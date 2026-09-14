# Event Lifecycle & Near-Real-Time Timing Audit Report

**Audit Execution Timestamp:** 2026-09-14T12:41:13.129Z  
**Testing Framework:** Chromium Headless via Puppeteer Engine + Direct REST API Validation  
**Target Environment:** Main Portal (`http://localhost:3000`) & Main API (`http://localhost:4000`)  
**Operator:** Principal QA Engineer / System Integration Tester  

---

### 1. Near-Real-Time Event Timing Verification

The event timing test was conducted in accordance with the mandatory near-real-time specification: `EVENT_START = CURRENT_TIME + approximately 4–5 minutes`, with `REGISTRATION_DEADLINE = EVENT_START`. Explicit ISO-8601 UTC timestamps were transmitted and verified against the backend parser.

| Timing Parameter | Exact Timestamp Value | Description |
|---|---|---|
| System Current Time (`CURRENT_TIME`) | `2026-09-14T12:41:13.129Z` | Actual execution clock time at test initiation |
| Event Start Timestamp (`EVENT_START`) | `2026-09-14T12:45:43.129Z` | Target commencement of demo event |
| Registration Deadline (`REGISTRATION_DEADLINE`) | `2026-09-14T12:45:43.129Z` | Explicit registration close time |
| Delta (Start − Current) | **270 seconds (4.50 minutes)** | Exact duration window allocated for live registration |
| Pre-Deadline Window at Student Registration | **234 seconds remaining** | Time remaining when Student 1 submitted registration payload |

#### Backend Interpretation Verification
The backend Express route (`POST /api/events`) deserialized the ISO-8601 string and stored the timestamp in the PostgreSQL Neon database.
- Backend Parsed `startDate`: `2026-09-14T12:45:43.129Z`
- Backend Parsed `registrationDeadline`: `2026-09-14T12:45:43.129Z`
- Timestamp Interpretation Match: **100% Exact** (Zero timezone drift observed when passing full ISO strings with the `Z` UTC designator).

---

### 2. Event Lifecycle State Transition Matrix

The event was tracked through its lifecycle states: draft creation, administrative publication, public discovery, authenticated registration, and duplicate registration prevention.

| Step | Action Description | Route / Endpoint | Response Status | Observed Outcome | Evidence Reference |
|---|---|---|---|---|---|
| 1 | Create Event (Draft) | `POST /api/events` | HTTP 201 | Created with `isPublished: false` | `05_event_management_page.png` |
| 2 | Faculty Event Publication | `PATCH /api/events/:id/publish` | HTTP 200 | Event state transitioned to Published | `06_published_event_in_faculty_view.png` |
| 3 | Student Discovery | `GET /api/events` | HTTP 200 | Published event appears in event listing | `11_student_event_detail.png` |
| 4 | Student Registration | `POST /api/events/:id/register` | HTTP 201 | Registration record persisted (`bd66edb5-...`) | `12_student_registered_view.png` |
| 5 | Duplicate Registration Probe | `POST /api/events/:id/register` | HTTP 409 | Duplicate attempt atomically rejected | N/A (API Console Log) |

---

### 3. Concurrency & Duplicate Prevention Verification

- **Atomic Registration Record:** Registration ID `bd66edb5-7173-4868-8eb3-54b8b72c4eed` created for User ID `b032d08f-b70b-42ef-a8cd-1107d6fcc63e` on Event ID `c5970094-e5c0-4007-bd34-f73c3e9a752d`.
- **Duplicate Prevention Behavior:** An immediate subsequent registration attempt from the same student context yielded `HTTP 409 Conflict` with message: `"User already registered for this event"`. Database unique constraints (`userId_eventId` composite unique index) and transactional checks prevented duplicate insertion.

---

### 4. Defect Findings & Behavioral Observations

1. **Client ISO Truncation Defect (Documented):** When frontend date pickers truncate timestamps (e.g. `YYYY-MM-DDTHH:mm`), browsers in local timezones (such as IST +05:30) can cause date parsing anomalies if UTC designators are omitted. Full ISO-8601 strings with explicit `Z` or timezone offsets must be enforced.
2. **Publish Requirement:** Unauthenticated or non-coordinator users cannot view draft events (`isPublished: false`). The platform correctly enforces authorization boundaries on event access.

**Verdict:** **PASS**
