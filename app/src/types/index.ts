// ============================================
// BMTC API Types
// ============================================
export interface BMTCRoute {
  routeid: string;
  routeno: string;
  routename: string;
  fromstation: string;
  tostation: string;
  distance: string;
  routeorder: string;
}

export interface BMTCStop {
  stationid: string;
  stationname: string;
  centerlat: string;
  centerlong: string;
  distance?: string;
}

export interface BMTCVehicle {
  vehicleid: string;
  vehicleno: string;
  currentstop: string;
  nextstop: string;
  laststop: string;
  lat: string;
  lng: string;
  speed: string;
  heading: string;
  eta: string;
  lastUpdatedAt?: string;
}

export interface BMTCRouteDetails {
  routeid: string;
  routeno: string;
  fromstation: string;
  tostation: string;
  upstops: BMTCStop[];
  downstops: BMTCStop[];
  vehicles: BMTCVehicle[];
}

// ============================================
// App Types
// ============================================
export type ReminderStatus = 'idle' | 'monitoring' | 'candidate' | 'notified' | 'completed' | 'paused' | 'expired';
export type RecurrenceRule = 'once' | 'weekdays' | 'daily' | string;

export interface Reminder {
  id: string;
  user_id: string;
  route_number: string;
  route_name?: string;
  direction_label?: string;
  stop_name: string;
  threshold_stops: number;
  active_from_time?: string;
  active_to_time?: string;
  recurrence_rule: RecurrenceRule;
  status: ReminderStatus;
  is_favorite: boolean;
  last_notified_at?: string;
  last_candidate_vehicle_id?: string;
  notification_cooldown_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface SavedCommute {
  id: string;
  user_id: string;
  label: string;
  route_number: string;
  route_name?: string;
  direction_label?: string;
  stop_name: string;
  threshold_stops: number;
  default_from_time?: string;
  default_to_time?: string;
  recurrence_rule: RecurrenceRule;
  use_count: number;
  last_used_at?: string;
  created_at: string;
}

export interface Device {
  id: string;
  user_id: string;
  platform: string;
  push_provider: string;
  push_subscription: object | null;
  last_seen_at: string;
  permission_state: string;
}

export interface Profile {
  id: string;
  display_name?: string;
  locale: string;
  timezone: string;
  notification_opt_in: boolean;
  created_at: string;
}

// ============================================
// UI State Types
// ============================================
export interface CreateReminderState {
  step: number;
  routeNumber: string;
  selectedRoute: BMTCRoute | null;
  direction: 'up' | 'down';
  stops: BMTCStop[];
  selectedStop: BMTCStop | null;
  thresholdStops: number;
  activeFromTime: string;
  activeToTime: string;
  recurrence: RecurrenceRule;
}

export interface AlarmData {
  reminderId: string;
  routeNumber: string;
  routeName: string;
  stopName: string;
  directionLabel: string;
  vehicleId: string;
  stopsAway: number;
  triggeredAt: string;
}
