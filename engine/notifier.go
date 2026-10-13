package main

import (
	"encoding/json"
	"fmt"
	"os"

	webpush "github.com/SherClockHolmes/webpush-go"
)

func sendPushNotification(subscriptionJSON string, routeNo string, stopsAway int, stopName string) error {
	var sub webpush.Subscription
	err := json.Unmarshal([]byte(subscriptionJSON), &sub)
	if err != nil {
		return fmt.Errorf("invalid subscription json: %v", err)
	}

	vapidPublicKey := os.Getenv("NEXT_PUBLIC_VAPID_PUBLIC_KEY")
	vapidPrivateKey := os.Getenv("VAPID_PRIVATE_KEY")
	
	if vapidPublicKey == "" || vapidPrivateKey == "" {
		return fmt.Errorf("VAPID keys not configured in environment")
	}

	messageJSON, _ := json.Marshal(map[string]interface{}{
		"title": "Bus Approaching! 🚌",
		"body":  fmt.Sprintf("Route %s is %d stops away from %s", routeNo, stopsAway, stopName),
		"url":   fmt.Sprintf("/alarm?route=%s&stop=%s&away=%d", routeNo, stopName, stopsAway),
	})

	resp, err := webpush.SendNotification([]byte(messageJSON), &sub, &webpush.Options{
		Subscriber:      "mailto:admin@catchr.app",
		VAPIDPublicKey:  vapidPublicKey,
		VAPIDPrivateKey: vapidPrivateKey,
		TTL:             300, // 5 minutes TTL
	})
	
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("webpush failed with status code %d", resp.StatusCode)
	}

	return nil
}
