package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Reminder struct {
	ID               string
	UserID           string
	RouteNumber      string
	BoardingStopName string
	ThresholdStops   int
	DeviceID         string
	PushSubscription string
}

func processReminders(ctx context.Context, db *pgxpool.Pool) {
	log.Println("Evaluating active reminders...")

	// 1. Fetch active reminders (status = monitoring and within time window)
	// Properly handle time windows that cross midnight and use engine's local time instead of DB's UTC
	localTimeStr := time.Now().Format("15:04:05")
	query := `
		SELECT r.id, r.user_id, r.route_number, r.stop_name, r.threshold_stops, COALESCE(d.id::text, ''), COALESCE(d.push_subscription::text, '')
		FROM public.reminders r
		LEFT JOIN public.devices d ON r.user_id = d.user_id
		WHERE r.status = 'monitoring' 
		  AND (
		    (r.active_from_time <= r.active_to_time AND $1::time >= r.active_from_time AND $1::time <= r.active_to_time)
		    OR
		    (r.active_from_time > r.active_to_time AND ($1::time >= r.active_from_time OR $1::time <= r.active_to_time))
		  );
	`
	rows, err := db.Query(ctx, query, localTimeStr)
	if err != nil {
		log.Printf("Error fetching reminders: %v\n", err)
		return
	}
	defer rows.Close()

	var activeReminders []Reminder
	for rows.Next() {
		var r Reminder
		var subBytes []byte
		err := rows.Scan(&r.ID, &r.UserID, &r.RouteNumber, &r.BoardingStopName, &r.ThresholdStops, &r.DeviceID, &subBytes)
		if err != nil {
			log.Printf("Error scanning reminder: %v\n", err)
			continue
		}
		r.PushSubscription = string(subBytes)
		activeReminders = append(activeReminders, r)
	}

	if len(activeReminders) == 0 {
		log.Println("No active reminders to evaluate right now.")
		return
	}

	log.Printf("Found %d active reminders to check\n", len(activeReminders))

	// Group by route to minimize API calls
	routeMap := make(map[string][]Reminder)
	for _, r := range activeReminders {
		routeMap[r.RouteNumber] = append(routeMap[r.RouteNumber], r)
	}

	// For each route, check live BMTC data
	for routeNo, remindersForRoute := range routeMap {
		checkRoute(ctx, db, routeNo, remindersForRoute)
	}
}

type bmtcStation struct {
	StationName    string `json:"stationname"`
	VehicleDetails []struct {
		VehicleID     int    `json:"vehicleid"`
		VehicleNumber string `json:"vehiclenumber"`
	} `json:"vehicleDetails"`
}

type bmtcDetailsResp struct {
	Data struct {
		Up struct {
			Data []bmtcStation `json:"data"`
		} `json:"up"`
		Down struct {
			Data []bmtcStation `json:"data"`
		} `json:"down"`
	} `json:"data"`
}

func checkRoute(ctx context.Context, db *pgxpool.Pool, routeNo string, reminders []Reminder) {
	log.Printf("Checking live data for route %s...", routeNo)

	baseRoute := strings.TrimSpace(strings.ReplaceAll(strings.ReplaceAll(routeNo, " UP", ""), " DOWN", ""))
	direction := "up"
	if strings.HasSuffix(routeNo, " DOWN") {
		direction = "down"
	}

	// 1. Resolve Parent Route ID
	searchReq := map[string]string{"routetext": baseRoute}
	bodyBytes, _ := json.Marshal(searchReq)
	req, _ := http.NewRequest("POST", "https://bmtcmobileapi.karnataka.gov.in/WebAPI/SearchRoute_v2", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("deviceType", "WEB")
	req.Header.Set("lan", "en")
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
	req.Header.Set("Origin", "https://nammabmtcapp.karnataka.gov.in")
	req.Header.Set("Referer", "https://nammabmtcapp.karnataka.gov.in/")
	req.Header.Set("Accept", "application/json, text/plain, */*")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Error searching route %s: %v", baseRoute, err)
		return
	}
	b, _ := io.ReadAll(resp.Body)
	resp.Body.Close()

	var searchResp struct {
		Data []struct {
			RouteParentID interface{} `json:"routeparentid"`
			RouteNo       string      `json:"routeno"`
		} `json:"data"`
	}
	if err := json.Unmarshal(b, &searchResp); err != nil || len(searchResp.Data) == 0 {
		return
	}
	parentID := searchResp.Data[0].RouteParentID

	// 2. Fetch Live Details
	detailsReq := map[string]interface{}{"routeid": parentID, "servicetypeid": 0}
	bodyBytes, _ = json.Marshal(detailsReq)
	req, _ = http.NewRequest("POST", "https://bmtcmobileapi.karnataka.gov.in/WebAPI/SearchByRouteDetails_v4", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("deviceType", "WEB")
	req.Header.Set("lan", "en")
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
	req.Header.Set("Origin", "https://nammabmtcapp.karnataka.gov.in")
	req.Header.Set("Referer", "https://nammabmtcapp.karnataka.gov.in/")
	req.Header.Set("Accept", "application/json, text/plain, */*")

	resp, err = client.Do(req)
	if err != nil {
		log.Printf("Error fetching details for route %v: %v", parentID, err)
		return
	}
	b, _ = io.ReadAll(resp.Body)
	resp.Body.Close()

	var detailsResp bmtcDetailsResp
	if err := json.Unmarshal(b, &detailsResp); err != nil {
		return
	}

	stations := detailsResp.Data.Up.Data
	if direction == "down" {
		stations = detailsResp.Data.Down.Data
	}

	for _, reminder := range reminders {
		targetIdx := -1
		for i, st := range stations {
			if strings.Contains(strings.ToLower(st.StationName), strings.ToLower(reminder.BoardingStopName)) {
				targetIdx = i
				break
			}
		}

		if targetIdx == -1 {
			continue // Target stop not found
		}

		// Find buses heading to this stop
		matched := false
		for i, st := range stations {
			if i > targetIdx {
				break
			}
			stopsAway := targetIdx - i
			for _, v := range st.VehicleDetails {
				if stopsAway <= reminder.ThresholdStops {
					vID := fmt.Sprintf("%d", v.VehicleID)
					log.Printf("MATCH! Bus %s (%s) is %d stops away from %s (Threshold: %d)\n", vID, v.VehicleNumber, stopsAway, reminder.BoardingStopName, reminder.ThresholdStops)
					
					// Send Push Notification
					if reminder.PushSubscription != "" {
						err := sendPushNotification(reminder.PushSubscription, routeNo, stopsAway, reminder.BoardingStopName)
						if err != nil {
							log.Printf("Failed to send push: %v\n", err)
						}
					} else {
						log.Printf("Skipping push notification for %s, no subscription found.", reminder.ID)
					}

					// Update database
					updateStatus(ctx, db, reminder.ID, "notified", vID)
					matched = true
					break
				}
			}
			if matched {
				break
			}
		}
	}
}

func updateStatus(ctx context.Context, db *pgxpool.Pool, reminderID, status, vehicleID string) {
	_, err := db.Exec(ctx, `
		UPDATE public.reminders 
		SET status = $1, last_notified_at = NOW(), last_candidate_vehicle_id = $2 
		WHERE id = $3
	`, status, vehicleID, reminderID)
	if err != nil {
		log.Printf("Error updating reminder status: %v\n", err)
	}
}

type LiveBus struct {
	VehicleID string
	NextStop  string
	StopsAway int
}

	// Removed getLiveBusesForRoute

