# Phase 42.8 -- Student Coordinator Autofill Report

Generated: 2026-09-15
Scope: Phase 42.8 (Automatic Student Coordinator Lookup and Selection)

## Problem Statement

The original Event Lead Setup in Step 4 required organizers to be typed in manually -- Name, Email, Phone.
This was error-prone and disconnected from the actual user registry.

## Solution

### Backend -- GET /api/users/coordinators

New endpoint added to server/src/routes/users.ts:
- Queries approved, active users with role STUDENT_COORDINATOR, FACULTY_COORDINATOR, or DEVELOPMENT_TEAM.
- Returns: id, name, email, phone, role, studentId, employeeId for each coordinator.
- Cached in Redis for 120 seconds under the key users:coordinators.
- Protected by JWT authentication middleware.

### Frontend -- Step 4 of event/page.tsx

- coordinators state fetched from GET /api/users/coordinators on component mount.
- coordSearch input with a Search icon and onFocus/onChange handlers to open a dropdown.
- Dropdown renders a filtered list of coordinators matching the search query against name or email.
- On selection:
  - newOrganizer.name, email, phone are autofilled from the authoritative user profile.
  - coordSearch is set to the selected coordinator's name.
  - The dropdown closes.
- The manual Name, Email, Phone fields remain editable after autofill for corrections.
- A CLEAR button resets both newOrganizer fields and the coordSearch input.
- onMouseDown with e.preventDefault() on dropdown buttons prevents input blur from closing the dropdown before the click registers.
- Outside-click detection via useRef and document mousedown listener closes the dropdown cleanly.

## Security

- The /api/users/coordinators endpoint is behind requireAuth middleware.
- Only approved, active coordinators are returned -- deactivated accounts are excluded.
- No PII beyond what is needed for the event lead record is returned.

## Verification

Confirmed via Next.js hot reload. No TypeScript errors. useRef import added to event page.
