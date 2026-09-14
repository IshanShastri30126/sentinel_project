# Current System Role to Functionality Mapping

This document provides a comprehensive map of the existing role-based access control (RBAC) layer in the current system, before any modifications. 

The system currently uses both explicit lists (`requireRole`) and a numeric hierarchy (`requireMinRole`) where a lower number means higher authority.

### Current Role Hierarchy
1. **Level 1**: `FACULTY_COORDINATOR`, `TECH_COORDINATOR`
2. **Level 2**: `STUDENT_COORDINATOR`, `SOCIAL_MEDIA_COORDINATOR`
3. **Level 3**: `MEMBER`
4. **Unauthenticated / Pseudo-role**: `GUEST` (or unapproved users)

> [!NOTE]
> The frontend UI also includes legacy strings (`FACULTY`, `TECH`, `CONTENT`, `SOCIAL_MEDIA`) which are inconsistently applied. The backend primarily strictly enforces the exact `_COORDINATOR` strings and `MEMBER`.

---

## Backend API Functionality Mapping

### 1. Events Module (`/events`)
| Functionality | Allowed Roles | Enforcement Method |
|---------------|---------------|-------------------|
| Create Event / Update Event Details / Delete Event | `FACULTY_COORDINATOR`, `STUDENT_COORDINATOR` | `requireRole` (Explicit) |
| Upload Event Poster & Document | `FACULTY_COORDINATOR`, `STUDENT_COORDINATOR` | `requireRole` (Explicit) |
| Toggle Event Publish Status | `FACULTY_COORDINATOR`, `STUDENT_COORDINATOR` | `requireRole` (Explicit) |
| Send Event Emails / Notifications | `FACULTY_COORDINATOR`, `STUDENT_COORDINATOR` | `requireRole` (Explicit) |
| Toggle Leaderboard Visibility | `FACULTY_COORDINATOR`, `TECH_COORDINATOR` | `requireRole` (Explicit) |
| View All Events (Coordinator View) | `FACULTY_COORDINATOR`, `TECH_COORDINATOR`, `SOCIAL_MEDIA_COORDINATOR`, `STUDENT_COORDINATOR` | `requireRole` (Explicit) |
| View Event Analytics & Registrations | Level 1 (`FACULTY_COORDINATOR`, `TECH_COORDINATOR`) | `requireMinRole("TECH_COORDINATOR")` |

### 2. User & Identity Management (`/users`)
| Functionality | Allowed Roles | Enforcement Method |
|---------------|---------------|-------------------|
| Change User Roles | `FACULTY_COORDINATOR`, `TECH_COORDINATOR` | `requireRole` (Explicit) |
| View Audit Logs | `FACULTY_COORDINATOR`, `TECH_COORDINATOR` | `requireRole` (Explicit) |
| Approve / Reject User Access | Level 1 (`FACULTY_COORDINATOR`, `TECH_COORDINATOR`) | `requireMinRole("TECH_COORDINATOR")` |
| View User Directory / Operative Base | Levels 1 & 2 (All Coordinators) | `requireMinRole("SOCIAL_MEDIA_COORDINATOR")` |

### 3. Certificates Module (`/certificates`)
| Functionality | Allowed Roles | Enforcement Method |
|---------------|---------------|-------------------|
| Generate Bulk Certificates / Import Registrations | Level 1 (`FACULTY_COORDINATOR`, `TECH_COORDINATOR`) | `requireMinRole("TECH_COORDINATOR")` |
| Download Certificates ZIP / View Templates Admin | Level 1 (`FACULTY_COORDINATOR`, `TECH_COORDINATOR`) | `requireMinRole("TECH_COORDINATOR")` |
| Create / Edit / Delete Certificate Templates | Levels 1 & 2 (All Coordinators) | `requireMinRole("STUDENT_COORDINATOR")` |

### 4. Attendance & Operations (`/attendance`, `/teams`, `/clubs`)
| Functionality | Allowed Roles | Enforcement Method |
|---------------|---------------|-------------------|
| Mark/Override Attendance manually | `FACULTY_COORDINATOR`, `STUDENT_COORDINATOR`, `TECH_COORDINATOR` | `requireRole` (Explicit) |
| Edit Club Branding | Levels 1 & 2 (All Coordinators) | `requireMinRole("STUDENT_COORDINATOR")` |
| Disqualify Teams / View All Teams Admin | Level 1 (`FACULTY_COORDINATOR`, `TECH_COORDINATOR`) | `requireMinRole("TECH_COORDINATOR")` |

### 5. Approvals System (`/approvals`)
| Functionality | Allowed Roles | Enforcement Method |
|---------------|---------------|-------------------|
| Execute Approval Decisions (Approve/Reject) | `FACULTY_COORDINATOR`, `TECH_COORDINATOR`, `STUDENT_COORDINATOR` | `requireRole` (Explicit) |
| View Pending Approvals / Audit Views | All Authenticated Users | `requireMinRole("MEMBER")` |

### 6. Gamification / Points (`/appreciation`)
| Functionality | Allowed Roles | Enforcement Method |
|---------------|---------------|-------------------|
| Award or Deduct Points | `FACULTY_COORDINATOR`, `TECH_COORDINATOR`, `STUDENT_COORDINATOR` | `requireRole` (Explicit) |
| Create Badges | `FACULTY_COORDINATOR`, `TECH_COORDINATOR`, `STUDENT_COORDINATOR` | `requireRole` (Explicit) |

### 7. Telemetry & Settings (`/maintenance`, `/settings`, `/analytics`)
| Functionality | Allowed Roles | Enforcement Method |
|---------------|---------------|-------------------|
| View System Maintenance Logs | `FACULTY_COORDINATOR`, `TECH_COORDINATOR` | `requireRole` (Explicit) |
| Update Landing Page Team / CMS Uploads | `FACULTY_COORDINATOR`, `TECH_COORDINATOR` | `requireRole` (Explicit) |
| View Sentinel & Operations Analytics | Level 1 (`FACULTY_COORDINATOR`, `TECH_COORDINATOR`) | `requireMinRole("TECH_COORDINATOR")` |
| View Top 3 / Event Analysis / Coordinator Activity | Levels 1 & 2 (All Coordinators) | `requireMinRole("STUDENT_COORDINATOR")` |

---

## Frontend Navigation Visibility (Dashboard Layout)

If a route is not listed here, it is currently visible to **ALL** authenticated users regardless of role (e.g. Overview, Teams, Attendance, Leaderboard, My Certificates, Profile).

| Module | Roles Permitted to See Navigation Link |
|--------|---------------------------------------|
| **Events** | `FACULTY_COORDINATOR`, `STUDENT_COORDINATOR`, `TECH_COORDINATOR`, `FACULTY`, `TECH` |
| **Certificates** | `FACULTY_COORDINATOR`, `STUDENT_COORDINATOR`, `TECH_COORDINATOR`, `FACULTY`, `TECH` |
| **Approvals** | `FACULTY_COORDINATOR`, `STUDENT_COORDINATOR`, `TECH_COORDINATOR`, `FACULTY`, `TECH` |
| **Users** | `FACULTY_COORDINATOR`, `STUDENT_COORDINATOR`, `TECH_COORDINATOR`, `FACULTY`, `TECH` |
| **Analytics** | `FACULTY_COORDINATOR`, `STUDENT_COORDINATOR`, `TECH_COORDINATOR`, `FACULTY`, `TECH` |
| **Landing CMS** | `FACULTY_COORDINATOR`, `TECH_COORDINATOR`, `FACULTY`, `TECH` |
| **Maintenance Logs** | `FACULTY_COORDINATOR`, `TECH_COORDINATOR`, `FACULTY`, `TECH` |
| **Info** | `FACULTY_COORDINATOR` |

---

### Key Inconsistencies & Takeaways
1. `SOCIAL_MEDIA_COORDINATOR` exists but is highly restricted; they only really have access to the User Directory (`/users`) because of `requireMinRole`, but they are excluded from explicit `requireRole` arrays for things like Events publishing.
2. The frontend uses a mix of the old/future enum (`FACULTY`, `TECH`) and the current DB enum (`FACULTY_COORDINATOR`, `TECH_COORDINATOR`).
3. `STUDENT_COORDINATOR` has immense power (same as `FACULTY_COORDINATOR`) over event creation, publishing, and approval decisions.
4. `TECH_COORDINATOR` relies heavily on the `requireMinRole` hierarchy to gain access to Analytics and User Management. Removing the hierarchy requires hard-coding them into every route array.
