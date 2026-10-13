# Catchr V1 Product Requirements Document

Version 1.0  
Date: 2026-07-29  
Product: Catchr

---

## 1. Executive Summary

Catchr is a commuter workflow product for Bengaluru BMTC riders. It should not behave like another route browser or live map clone. Its purpose is to remove repetitive checking behavior: the commuter should define a route, a boarding stop, a monitoring window, and a trigger threshold such as 2, 3, or 4 stops away — then stop thinking about the bus until Catchr notifies them.

The strongest V1 outcome is simple: **create a reminder in under 30 seconds, close the app, and still catch the right bus at the right time**.

Based on the supplied BMTC API documentation and the public Swagger-like reference, the most important live-tracking building blocks appear to be:
- `/SearchByRouteDetails_v4` for route-level stop order plus current vehicles,
- `/VehicleTripDetails_v2` for vehicle-level refinement,
- `/TripPlannerMSMD` for trip discovery,
- `/FindNearByBusStop_v2` and `/SearchRoute_v2` for stop and route lookup.

However, these APIs are explicitly described in the uploaded document as **unofficial and reverse-engineered**, and the official Namma BMTC web app could not be fully crawled from this research environment due to timeout/failure. Therefore this PRD uses the **current production base URL named in the source material** as the operational integration target, while clearly separating sourced facts from items that engineering must validate against live production behavior during implementation. [Uploaded BMTC API document](https://www.genspark.ai/api/files/s/z4reepdV) [BMTC API Swagger reference](https://nimmbus.netlify.app/)

### Bottom-line recommendations

- **Start with a PWA first**, not a native mobile app.
- **Store derived monitoring history and event logs**, not full raw payload snapshots from every poll forever.
- **Use an open-source-first stack**: Next.js + TypeScript frontend, PostgreSQL, Redis, Web Push, and a minimal self-hosted infrastructure. Authentication is implemented in-house, while advanced observability is intentionally deferred until later releases.

---

## 2. Product Vision and Positioning

### Vision

Catchr helps BMTC commuters stay focused until it is actually time to leave.

### Positioning

The official BMTC experience answers: **“Where is my bus?”**  
Catchr answers: **“You don’t need to keep checking. I’ll tell you when to leave.”**

That difference matters. Most existing transit tools are information surfaces. Catchr should be a decision surface.

### Product promise

- No repeated refresh behavior
- No need to stare at the map
- No need to remember ETA guesses manually
- No need to reopen the BMTC app every few minutes

### V1 product thesis

A narrow, dependable reminder workflow is more valuable than a broad, fragile transport super-app.

---

## 3. Problem Statement

BMTC commuters today often follow this pattern:
1. Open the official app or web app.
2. Search for route or stop.
3. Inspect live tracking.
4. Refresh repeatedly.
5. Mentally estimate when to leave.
6. Risk leaving too early or too late.

This creates three core problems:

| Problem | User pain | Why current tools fail |
|---|---|---|
| Repetitive checking | Cognitive interruption during work/study | Current experience is pull-based, not reminder-driven |
| Uncertain leave time | Users either wait too long at the stop or miss the bus | Data is exposed, but not turned into a personal action trigger |
| No routine support | Daily commuters repeat the same search every day | Existing tools optimize discovery, not recurring commute workflows |

Catchr should convert BMTC live data into a **personal commute trigger**.

---

## 4. User Personas and Jobs-to-be-Done

### Persona A: Office commuter
- Travels on repeat time bands, usually evening commute
- Needs reminders without opening the app repeatedly
- High value on reliability and low friction

**JTBD:** “When I’m working and it is almost time for my bus, tell me when I should leave without forcing me to keep checking.”

### Persona B: College student
- Often boards from recurring campus stops
- May use a small set of routes but inconsistent daily timing
- Needs low-data, fast setup experience

**JTBD:** “When I’m about to head out, help me avoid waiting at the bus stop for too long.”

### Persona C: Frequent city traveller
- Knows stops, but not always exact route state
- Wants control over reminder threshold and direction

**JTBD:** “When the right bus is approaching my stop, alert me in a way that feels precise and trustworthy.”

### Persona D: Route explorer (deferred beyond V1)
- Does not know which exact bus to take
- Needs journey planning across origin and destination

**JTBD:** “Given where I am and where I need to go, help me discover the right ride and remind me at the right time.”

This persona matters, but should remain secondary in V1.

---

## 5. V1 Product Scope

### In scope

1. Route-based reminder creation
2. Boarding stop selection
3. Direction-aware route monitoring
4. Configurable threshold: notify when bus is N stops away
5. Time window per reminder
6. Notification delivery via web push
7. Active reminder dashboard
8. Reminder pause / disable after boarding
9. Basic favorites / recent route-stop combinations
10. Basic observability and reliability controls

### V1 user flow

1. User opens Catchr
2. Selects route or recent commute
3. Selects direction
4. Selects boarding stop
5. Selects threshold (2, 3, 4 stops away)
6. Selects active monitoring window
7. Grants notification permission
8. Activates reminder
9. Receives push when a qualifying bus approaches
10. Disables reminder after boarding or lets auto-expiry stop it

### Product objective for V1

Catchr V1 is successful if it reliably supports **single-leg boarding reminders** for frequent BMTC commuters.

---

## 6. V1 Non-goals

To protect focus, Catchr V1 should explicitly avoid becoming:

- A full trip planner for all Bengaluru transit modes
- A full map-first live tracking product
- A social app or community reporting layer
- A ticketing, payments, or pass management product
- A comprehensive route encyclopedia
- A transfer-optimization engine for complex multi-hop commutes
- A native mobile app from day one
- A consumer AI assistant experience

### Features to defer

- Multi-leg commute orchestration
- Automatic “leave now” walking-time optimization using continuous GPS
- Geofenced origin automation
- Transfer journey reminders
- Widgets / wearable integration
- Android Auto / CarPlay / smartwatch support
- Rich historical commute analytics for users

---

## 7. Smart Commute Workflow

This is the heart of the product.

### 7.1 Sourced API building blocks

From the uploaded BMTC document and the public Swagger-like reference, the documented flows appear to be:

| Use case | Endpoint | Role |
|---|---|---|
| Route discovery | `/SearchRoute_v2` | Resolve route number to a route parent identifier |
| Stop discovery | `/FindNearByBusStop_v2` | Search/select boarding stop |
| Live route monitoring | `/SearchByRouteDetails_v4` | Get stop arrays plus vehicle details for a route |
| Vehicle refinement | `/VehicleTripDetails_v2` | Track one chosen vehicle in more detail |
| Trip discovery | `/TripPlannerMSMD` | Identify direct or transfer options |
| Reference data | `/GetAllRouteList` | Route metadata |
| Reference data | `/GetTimetableByRouteid_v3` | Timetable reference |
| Fare | `/GetFareRoutes`, `/GetMobileFareData_v2` | Fare workflow support |
| Vehicle lookup | `/ListVehicles` | Find specific vehicle IDs |

The uploaded document names the current production base URL as `https://bmtcmobileapistaging.amnex.com/WebAPI`, while also warning that the overall API set is unofficial and reverse-engineered. [Uploaded BMTC API document](https://www.genspark.ai/api/files/s/z4reepdV) [BMTC API Swagger reference](https://nimmbus.netlify.app/)

### 7.2 Recommended V1 commute model

Although long-term the best product abstraction is likely commute-based (“Office → Home”), V1 should **internally model reminders as route + direction + boarding stop + threshold + time window**.

Why:
- Lower implementation risk
- Better fit with sourced route APIs
- Easier debugging of missed reminders
- Easier explanation to users

### 7.3 Proposed reminder evaluation pipeline

1. **Route resolution**
   - User chooses a route number.
   - Backend resolves it via `/SearchRoute_v2`.

2. **Stop resolution**
   - User searches/selects a boarding stop via `/FindNearByBusStop_v2`.

3. **Direction binding**
   - Reminder stores the correct route direction and target stop position.

4. **Monitoring start**
   - At reminder window start, scheduler activates watcher jobs.

5. **Route poll**
   - Worker polls `/SearchByRouteDetails_v4` on a shared cadence.

6. **Candidate matching**
   - For each active reminder on that route-direction, compute whether any bus is N stops before the boarding stop.

7. **Vehicle lock**
   - When a bus becomes a likely candidate, attach reminder to that `vehicleId` and optionally switch to `/VehicleTripDetails_v2` for finer updates.

8. **Notification firing**
   - Send push only after de-duplication checks pass.

9. **Post-notification state**
   - Reminder becomes `notified` and may either:
     - auto-complete,
     - remain active for backup notifications under controlled rules,
     - or wait for user dismissal/disable.

### 7.4 Rule for “N stops away”

The uploaded document indicates that `/SearchByRouteDetails_v4` returns ordered stop arrays and vehicle details, and explicitly notes that a bus can be considered N stops away when its current stop position matches an index N positions before the user’s boarding stop in the array. That should be the first implementation rule. If inconsistencies appear in live behavior, engineering should upgrade to a hybrid model that also considers ETA freshness, vehicle heading, and last/next stop coherence before firing notifications. [Uploaded BMTC API document](https://www.genspark.ai/api/files/s/z4reepdV)

### 7.5 Reliability gates before notification

A reminder should fire only if:
- current time is inside user window
- vehicle belongs to correct route/direction
- data freshness is acceptable
- stop distance rule is satisfied
- duplicate notification cooldown not violated
- vehicle has not already passed the user stop
- reminder not already completed or disabled

---

## 8. Functional Requirements

### 8.1 Reminder creation

**Requirements**
- User can create a reminder from route + stop
- User can choose threshold: 1 to 4 stops away in V1 UI, default 2
- User can choose start and end time window
- User can choose one-time or recurring weekday schedule
- User can enable/disable reminder at any time

**Acceptance criteria**
- New reminder can be created in under 30 seconds by a returning user
- Validation prevents impossible states (end before start, missing stop, invalid route)
- Reminder persists across sessions

### 8.2 Route selection

- Search by route number
- Show route variants and directions clearly
- Persist recent route searches

### 8.3 Stop selection

- Search stops by text
- Allow recent/favorite stops
- Prevent wrong-direction boarding by showing origin/destination context

### 8.4 Active reminders view

- List active reminders
- Show status: waiting, monitoring, candidate found, notified, expired, paused
- Show last checked timestamp and coarse confidence

### 8.5 Notifications

- Notify with route number, stop name, direction, threshold status
- Provide quick actions: dismiss, snooze, disable
- If supported later, deep-link into live status view

### 8.6 Recurrence

- Weekday recurrence for daily commuters
- Manual override for one-off activation

### 8.7 Failure handling

- If live data unavailable, reminder should degrade gracefully
- User-facing status should avoid false certainty

---

## 9. UX Principles and Key Flows

### UX principles

1. **Less search, more presets**
2. **Fast reminder creation**
3. **Direction clarity over map complexity**
4. **Trust through explicit status**
5. **Minimal permission friction**

### Key flow A: First reminder
- Landing page explains value in one sentence
- User selects route
- User selects stop and threshold
- User grants notifications
- Reminder activates

### Key flow B: Recurring commute
- User taps saved commute
- Adjusts time if needed
- Starts monitoring in one tap

### Key flow C: Notification received
- Notification says bus is nearing stop
- User opens detail card if needed
- User disables after boarding

### V1 UX note

Do not overload the first-time flow with trip planning, maps, or advanced filters.

---

## 10. Notification Strategy

### Notification channel

Use standards-based **Web Push** through service workers for the PWA.

The Push API allows web apps to receive messages through service workers even when the app is not in the foreground, and Apple documents support for Web Push on iOS/iPadOS for Home Screen web apps starting with iOS/iPadOS 16.4, provided the app is added to the Home Screen and permission is requested through user interaction. [MDN Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API) [WebKit on iOS Web Push](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/) [Firebase Web Push](https://firebase.google.com/docs/cloud-messaging/web/get-started)

### Recommended provider

For V1, use **standards-based Web Push with Firebase Cloud Messaging (web)** as the delivery layer if your team wants the most familiar JS ecosystem and browser-support workflow. Firebase documents that its web messaging works on browsers supporting the Push API and requires HTTPS and service workers. [Firebase Web Push](https://firebase.google.com/docs/cloud-messaging/web/get-started)

### Notification rules

- One primary alert per reminder match
- Optional backup alert after X minutes if user does not open/disable and bus is still relevant
- Cooldown window to prevent spam
- Quiet hours respected outside configured window

### Notification copy

Good V1 copy:
- “500D toward Hebbal is 2 stops away from Parangi Palya.”
- “Your BMTC bus is approaching. Time to leave.”

Bad V1 copy:
- Over-precise ETA promises without confidence controls

---

## 11. API Integration Strategy

### 11.1 Source-of-truth stance

Catchr should treat the **current production base URL named by the uploaded document** as the primary integration target:

`https://bmtcmobileapistaging.amnex.com/WebAPI`

But because the supplied source explicitly labels the API set as reverse-engineered, and because this research session could not directly inspect the official web app’s network behavior, engineering must perform a dedicated live integration validation sprint before public launch. [Uploaded BMTC API document](https://www.genspark.ai/api/files/s/z4reepdV)

### 11.2 Integration principles

- Centralize all BMTC calls in backend services
- Never let each client poll BMTC directly
- Cache route-stop topology aggressively
- Share route polling across users
- Separate static/reference fetches from high-frequency live polling

### 11.3 Recommended API usage by function

| Catchr function | Primary API | Secondary API |
|---|---|---|
| Search route | `/SearchRoute_v2` | `/GetAllRouteList` |
| Search stop | `/FindNearByBusStop_v2` | cached stop index |
| Monitor route live | `/SearchByRouteDetails_v4` | none |
| Refine a selected bus | `/VehicleTripDetails_v2` | none |
| Discover route between A and B | `/TripPlannerMSMD` | none |

### 11.4 Validation tasks before launch

- Confirm current base URL availability
- Confirm request/response schema stability
- Confirm route direction semantics
- Confirm stop ordering consistency
- Confirm field freshness indicators and null behavior
- Confirm server rate-limit tolerance
- Confirm whether CORS behavior requires backend proxying

---

## 12. Data Model

### Core tables

#### users
- id
- created_at
- locale
- timezone
- notification_opt_in_status

#### devices
- id
- user_id
- platform
- push_provider
- push_subscription / token
- last_seen_at
- permission_state

#### routes
- id
- external_route_parent_id
- route_number
- route_name
- source_stop_id
- destination_stop_id
- direction_key
- is_active
- metadata_json

#### stops
- id
- external_station_id
- stop_name
- latitude
- longitude
- normalized_name

#### route_stops
- id
- route_id
- stop_id
- stop_sequence
- direction_key
- distance_on_route

#### reminders
- id
- user_id
- route_id
- boarding_stop_id
- threshold_stops
- active_from_time
- active_to_time
- recurrence_rule
- status
- last_notified_at
- last_candidate_vehicle_id
- created_at
- updated_at

#### reminder_runs
- id
- reminder_id
- monitoring_date
- started_at
- ended_at
- outcome
- outcome_reason

#### vehicle_observations
- id
- route_id
- external_vehicle_id
- observed_at
- current_stop_id
- next_stop_id
- heading
- eta_text
- freshness_ts
- reduced_payload_json

#### notification_events
#### event_logs
- id
- event_type
- user_id
- reminder_id
- route_id
- vehicle_id
- status
- metadata_jsonb
- created_at

Purpose: store business/QoS events (reminder lifecycle, matching decisions, notification outcomes). Infrastructure logs remain structured application logs.

- id
- reminder_id
- device_id
- event_type
- event_time
- provider_response_code
- payload_summary_json

#### api_health_events
- id
- upstream_name
- event_time
- status
- latency_ms
- error_code
- route_context

---

## 13. System Architecture

### Recommended architecture

**Client:** Next.js PWA  
**API and orchestration:** Go (Chi)  
**Database:** PostgreSQL  
**Cache and shared state:** Redis  
**Workers and delayed jobs:** Asynq  
**Push delivery:** Web Push / FCM web  
**Logging:** Structured JSON logs (stdout)
**Business Events:** PostgreSQL event tables
**Future Observability:** Prometheus, Grafana, Loki and OpenTelemetry (V2/V3)

### Why this shape

The primary architectural mistake to avoid is **one user = one BMTC polling stream**.

Instead:

Users → Catchr Backend → Shared Route Pollers → Redis Snapshot Cache → Reminder Evaluation Workers → Push Delivery

This allows one upstream route poll to satisfy many reminders.

### Logical components

1. **Web client**
   - Reminder setup
   - Notification subscription
   - Active reminder management

2. **API gateway / app backend**
   - Custom JWT authentication, session handling, refresh tokens, email verification and password reset
   - Reminder CRUD
   - Device registration
   - User-facing status

3. **BMTC integration service**
   - Fetch upstream route/vehicle data
   - Normalize and validate fields
   - Publish route snapshots

4. **Polling scheduler**
   - Starts/stops route watchers based on active demand

5. **Reminder evaluation workers**
   - Match route snapshots to reminder rules
   - Decide when to notify

6. **Notification service**
   - Deliver web push
   - Apply cooldowns
   - Persist outcomes

7. **Observability layer**
   - Track latency, miss rate, stale data, notification outcomes

---

## 14. Polling, Caching, and Queue Design

### 14.1 Polling strategy

Use **shared route polling**, not per-user polling.

#### Proposed cadence
- No active reminders on route: no live polling
- Active reminders but low urgency: every 45–60 seconds
- Route with candidate bus near multiple users: every 20–30 seconds
- Vehicle refinement stage: every 15–20 seconds for locked candidate buses

These numbers are starting targets, not guarantees. Tune against actual upstream tolerance.

### 14.2 Redis usage

Use Redis for:
- active route watcher registry
- latest route snapshot cache
- candidate vehicle state
- deduplication keys
- temporary job coordination
- per-route freshness score

### 14.3 Queue usage

Asynq is a good fit because it is an open-source Redis-based queue built for delayed and repeatable jobs and horizontal workers. That matches Catchr’s need for scheduled reminder activation, repeated polling, retries, and fan-out evaluation. [Asynq docs](https://docs.bullmq.io/)

#### Suggested queues
- `route-poll-queue`
- `vehicle-refinement-queue`
- `reminder-evaluation-queue`
- `notification-delivery-queue`
- `upstream-retry-queue`

### 14.4 Snapshot model

Store per route-direction snapshot in Redis:
- latest fetch time
- normalized stop array
- normalized vehicle map
- route freshness state
- checksum/hash for change detection

### 14.5 De-duplication

Before sending a push, ensure:
- same reminder has not fired within cooldown
- same route/vehicle/stop-threshold combination not already alerted
- stale snapshot has not already generated a notification

---

## 15. Historical Logging Strategy

### Short answer

**Yes, store historical data — but only the right kind.**

### What to store

Store **derived, compact, queryable history**, not endless raw payload archives.

#### Recommended persisted history
1. **Reminder run history**
   - when monitoring started
   - whether notification fired
   - why it did or did not fire

2. **Notification event history**
   - sent / delivered / clicked / dismissed when available

3. **Reduced vehicle observations near decision points**
   - route
   - vehicleId
   - current stop
   - target stop
   - computed stops-away
   - freshness timestamp
   - confidence flags

4. **API health telemetry**
   - latency
   - failure rate
   - empty-result anomalies
   - schema anomalies

5. **Model-debug fields**
   - reminder decision reason
   - stale-data rejection reason
   - de-duplication reason

### What not to store by default

- Full raw JSON payload for every poll forever
- High-frequency duplicate route snapshots with no material change
- Continuous precise user location history unless a later feature explicitly needs it
- Verbose personal behavior logs unrelated to notification quality

### Retention recommendation

| Data type | Retention |
|---|---|
| Redis live snapshots | minutes to hours |
| Reduced vehicle observations | 7–30 days |
| Reminder run history | 90–180 days |
| Notification events | 90–180 days |
| API health metrics | 30–90 days aggregated; raw shorter |
| Full raw payload capture | only sampled or incident-based, 1–7 days |

### Why this matters

Without any history, you cannot answer:
- Why did a user miss a bus?
- Why did Catchr notify too early?
- Was BMTC upstream stale or was your algorithm wrong?
- Which routes are hardest to track reliably?

So the correct answer is **not “Redis only”** and also **not “store everything forever.”**

Store enough history to debug trust and improve reminder quality.

---

## 16. Tech Stack Recommendation (Version 2.0)

### V1 Production Stack

**Frontend**
- Next.js (App Router)
- TypeScript
- React
- Tailwind CSS
- shadcn/ui
- TanStack Query
- Zustand
- Workbox (PWA)

**Backend**
- Go
- Chi
- pgx
- sqlc

**Database**
- PostgreSQL
- JSONB

**Cache & Coordination**
- Redis

**Authentication**
- Custom JWT Authentication
- Argon2id
- Refresh Tokens
- Email Verification
- Password Reset
- Session Store

**Jobs**
- Asynq
- robfig/cron

**Notifications**
- Web Push
- Firebase Cloud Messaging (Web)

**Logging**
- Structured JSON logs
- PostgreSQL event_logs for business/QoS history

**Deployment**
- Docker Compose
- Caddy
- PostgreSQL
- Redis

### Deferred to V2/V3
- Loki
- Grafana
- Prometheus
- OpenTelemetry
- Alertmanager
- GlitchTip/Bugsink
- MinIO
- Flagsmith/Unleash
- Kubernetes

## 17. PWA-first vs Mobile-first Recommendation

### Platform Roadmap

| Version | Platform | Goal |
|---|---|---|
| V1 | PWA | Validate product |
| V1.5 | Android Wrapper (optional) | Play Store |
| V2 | Native Android (Kotlin + Jetpack Compose) | Reliability |
| V3 | Native iOS (SwiftUI) | Expansion |



### Recommendation: Start with PWA first

### Why PWA first is the best V1 move

1. **Fastest path to usable product**
   - No app-store approval cycle
   - Faster iteration on reminder UX

2. **Single codebase**
   - Especially important when product logic is still being discovered

3. **Web push is viable now**
   - Push API works with service workers in modern browsers, and Apple supports Web Push for Home Screen web apps on iOS/iPadOS 16.4+ under the documented conditions. [MDN Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API) [WebKit on iOS Web Push](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)

4. **Lower product risk**
   - The larger uncertainty is reminder correctness and trust, not native UI capability

### Real trade-offs

PWA-first is not perfect:
- iOS requires add-to-home-screen behavior for the full app-like push experience
- Push permission education is more important
- Background execution constraints still exist
- Native mobile could eventually produce better delivery reliability and richer OS integrations

### Decision framework

Start PWA-first if the V1 goal is:
- validate reminder demand
- validate notification usefulness
- validate algorithm trust
- reach users quickly

Move to native/mobile wrapper only if later evidence shows:
- push delivery is materially unreliable for your user base,
- install conversion is too low,
- or you need deeper device features.

### Phased platform roadmap

- **Phase 1:** PWA
- **Phase 2:** Android wrapper or React Native app only if notification reliability or distribution needs justify it
- **Phase 3:** broader mobile platform investment after proven retention

---

## 18. Security, Privacy, and Rate-limiting Considerations

### Security
- All BMTC requests should originate from backend services, not exposed client logic
- Validate and sanitize all upstream responses
- Protect push subscription endpoints from abuse
- Rate-limit public reminder creation endpoints
- Separate secrets and environment configuration cleanly

### Privacy
- Minimize user PII
- Avoid storing precise personal location history unless absolutely needed
- Store stop-based commute preferences rather than continuous location trails
- Provide easy device unlink / notification opt-out

### Rate limiting and upstream safety

Because the source materials themselves warn to use the APIs responsibly, Catchr must be conservative with polling. Shared polling, per-route caching, exponential backoff on failures, and route-level activation only when active reminders exist are mandatory architecture choices. [Uploaded BMTC API document](https://www.genspark.ai/api/files/s/z4reepdV) [BMTC API Swagger reference](https://nimmbus.netlify.app/)

---

## 19. Metrics and Observability

### Product metrics
- reminder creations per day
- active reminders per day
- repeat reminder usage rate
- weekly retained commuters
- install-to-permission conversion
- notification open / action rate

### Quality metrics
- reminder precision: % alerts judged useful
- reminder miss rate
- stale-data rejection rate
- duplicate notification rate
- upstream API failure rate
- median notification lead time

### Operational metrics
- route poll latency
- queue lag
- worker failure count
- Redis snapshot freshness
- push delivery success rate

### Minimum debugging dashboard
- active routes being watched
- top failing routes
- top stale routes
- fired notifications by hour
- routes with repeated false positives/negatives

---

## 20. Risks, Dependencies, and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Upstream API is unofficial / unstable | High | Build abstraction layer, schema guards, health alerts, fallback states |
| Official webapp behavior differs from documented fields | High | Run live validation sprint before public launch |
| Notification arrives too early / late | High | Use cooldowns, freshness thresholds, and post-notification learning |
| User picks wrong stop or direction | High | Show route direction clearly and save verified presets |
| Upstream rate limits or blocks traffic | High | Shared polling, low-frequency baseline, backoff, route-demand gating |
| PWA install friction | Medium | Use strong onboarding and simple install guidance |
| iOS notification expectations mismatch | Medium | Educate user that add-to-home-screen is required for best experience |
| Operational complexity too early | Medium | Keep V1 architecture modular but not microservice-heavy |

---

## 21. Delivery Roadmap

### Phase 0: Validation sprint
- Verify current upstream endpoints and schemas against live production behavior
- Test rate tolerance
- Validate route-direction semantics
- Validate stop index logic on sample commuter scenarios

### Phase 1: Core MVP
- Route search
- Stop selection
- Reminder creation
- Shared route polling
- Web push notifications
- Reminder dashboard

### Phase 2: Reliability release
- Vehicle refinement path
- Better duplicate suppression
- Incident logging and admin diagnostics
- Recurring weekday reminders

### Phase 3: Product hardening
- Saved commutes
- Smarter confidence messaging
- Limited “leave soon” inference
- Better onboarding and install conversion

---

## 22. Open Questions and Validation Checklist

### Must-validate before launch
- Is `https://bmtcmobileapistaging.amnex.com/WebAPI` still the live production endpoint in observed webapp traffic?
- Are request/response schemas stable across time?
- Does `SearchByRouteDetails_v4` consistently preserve ordered stop arrays for both directions?
- What is the best freshness threshold before a snapshot is considered stale?
- How often can Catchr poll safely without harming upstream reliability?
- Under what cases does `VehicleTripDetails_v2` disagree with route-level tracking?
- Does `TripPlannerMSMD` add enough value for V1 onboarding, or should it wait until V2?
- What percentage of users successfully enable push notifications after onboarding?

### Product questions
- Is threshold in “stops away” enough, or do users want “minutes away” too?
- Should V1 reminders auto-disable after first notification by default?
- Should route presets be framed as “saved commute” or remain route-centric in V1 copy?

---


## 22A. Build vs Buy Philosophy (Updated)

Catchr V1 intentionally minimizes operational complexity.

### Build in-house
- Custom JWT Authentication
- Reminder Engine
- BMTC Integration Layer
- Notification Decision Engine
- Business Event Logging (PostgreSQL)

### Use mature libraries
- Redis client
- Queue library (Asynq/Asynq depending on backend)
- Password hashing (Argon2id)
- JWT library
- Web Push library

### Self-host only
- PostgreSQL
- Redis
- Caddy
- Application containers

### Deferred to V2/V3
The following are valuable but intentionally postponed until production scale requires them:
- Loki (centralized log aggregation)
- Grafana (dashboards)
- Prometheus (metrics collection)
- OpenTelemetry (distributed tracing)
- Alertmanager
- GlitchTip/Bugsink
- Feature flag platforms (Flagsmith/Unleash)
- MinIO
- Elasticsearch / OpenSearch
- Kubernetes

The philosophy is to introduce infrastructure only after operational pain justifies it.

## 23. Strong Recommendations

### 23.1 Should Catchr begin as a PWA?

**Yes.** Start with a PWA.

Reason: the core risk is not app distribution, it is reminder correctness. A PWA lets you validate the product loop faster while still supporting modern push patterns through service workers and supported browsers, including iOS Home Screen web apps under Apple’s documented model. [MDN Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API) [WebKit on iOS Web Push](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)

### 23.2 Should Catchr store previous poll results?

**Yes, but selectively.**

Store:
- route snapshot summaries
- decision-point vehicle observations
- reminder outcomes
- notification events
- upstream health metrics

Do not store:
- every raw poll forever
- unnecessary user location traces

This gives you enough evidence to improve trust without turning the system into an expensive archive.

### 23.3 What exact V1 stack do I recommend?

**Recommended V1 stack**
- Frontend: Next.js + TypeScript + Tailwind + shadcn/ui + TanStack Query
- Backend: Go + Chi
- Database: PostgreSQL (primary relational database with JSONB support; MongoDB is not recommended for V1)
- Cache/state: Redis
- Jobs: Asynq
- Notifications: Web Push via service workers + FCM web
- Observability: Structured JSON logs + PostgreSQL event_logs (advanced observability deferred)
- Deployment: Docker Compose behind Caddy

If you want the shortest version of my opinion: **your direction is good, but split the background-job system out of the frontend app boundary early.**

---

## 24. Appendix: API Matrix with Confidence Levels

### Confidence rubric
- **High confidence:** explicitly named in both uploaded document and Swagger-like reference
- **Medium confidence:** explicitly named in uploaded document only
- **Needs live validation:** cannot be runtime-verified from this research session against the official web app

| Endpoint / Base | Use | Confidence | Notes |
|---|---|---|---|
| `https://bmtcmobileapistaging.amnex.com/WebAPI` | Current production base URL | Medium | Named in uploaded document; runtime validation still required |
| `/SearchByRouteDetails_v4` | Route live tracking, stop array, vehicle details | High | Named in uploaded document and Swagger-like reference |
| `/VehicleTripDetails_v2` | Live tracking for specific vehicle | High | Named in uploaded document and Swagger-like reference |
| `/TripPlannerMSMD` | Trip discovery | High | Named in uploaded document and Swagger-like reference |
| `/SearchRoute_v2` | Route discovery | High | Named in uploaded document and Swagger-like reference |
| `/GetAllRouteList` | Static route list | High | Named in uploaded document and Swagger-like reference |
| `/GetTimetableByRouteid_v3` | Timetable lookup | High | Named in Swagger-like reference |
| `/GetFareRoutes` | Fare workflow | High | Named in Swagger-like reference |
| `/GetMobileFareData_v2` | Fare workflow | High | Named in Swagger-like reference |
| `/FindNearByBusStop_v2` | Stop discovery | Medium | Named in uploaded document summary |
| `/ListVehicles` | Vehicle lookup | Medium | Named in uploaded document summary |
| `http://bmtcmob.hostg.in/api/itsroutewise/details` | Legacy/deprecated endpoint | Medium | Named as deprecated in uploaded document |
| `https://nammabmtcapp.karnataka.gov.in/` | Official site homepage | Needs live validation | Search surfaced it, but direct crawl timed out in this environment |
| `https://nammabmtcapp.karnataka.gov.in/commuter/search-by-route` | Official route page | Needs live validation | Search surfaced it, but direct crawl timed out in this environment |
| `https://nammabmtcapp.karnataka.gov.in/commuter/dashboard` | Official dashboard | Needs live validation | Named by user and source document, but direct crawl timed out |

---

## 25. Final Product Call

Catchr V1 should be a **reliable commute reminder layer on top of BMTC live data**, not a broader transit platform.

If you keep the scope narrow, centralize upstream polling, log the right decision data, and ship as a PWA first, you can reach a real user-value milestone quickly. The next product milestone after V1 should not be “more features.” It should be **more trust**.

That is what will make Catchr useful enough to become habit-forming.
