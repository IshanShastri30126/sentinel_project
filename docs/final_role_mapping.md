# Final System Role to Functionality Mapping

This document provides a comprehensive map of the **new** role-based access control (RBAC) layer after the system-wide refactor. The legacy hierarchical system (`requireMinRole`) has been entirely removed and replaced with a flat, explicitly scoped permission map. 

### Canonical Roles
The system now strictly enforces the following enum roles:
- `FACULTY_COORDINATOR` (Faculty Level Access)
- `TECH_COORDINATOR` (Admin / Tech Division)
- `STUDENT_COORDINATOR` (Student Director Level)
- `SOCIAL_MEDIA_COORDINATOR` (Social Media / Content Marketing Level)
- `MEMBER` (Standard Authenticated User)
- `GUEST` (Unapproved Authenticated User)

*(Legacy roles such as `FACULTY`, `TECH`, `CONTENT`, and `SOCIAL_MEDIA` have been permanently deprecated from the schema and frontend).*

---

## Backend API Functionality Mapping

All routes use the `requireRole` middleware with an explicit array of permitted roles. Where applicable, route-level scope logic (e.g., `req.user.id === event.creatorId`) further restricts data access.

### 1. Events Module (`/events`)
| Functionality | Allowed Roles | Scope / Restrictions |
|---------------|---------------|-----------------------|
| View All Events (Admin) | `FACULTY_COORDINATOR`, `STUDENT_COORDINATOR`, `TECH_COORDINATOR`, `SOCIAL_MEDIA_COORDINATOR` | Global visibility. |
| Create Event | `FACULTY_COORDINATOR`, `STUDENT_COORDINATOR`, `TECH_COORDINATOR`, `SOCIAL_MEDIA_COORDINATOR` | None. |
| Edit/Update Event | `FACULTY_COORDINATOR`, `STUDENT_COORDINATOR`, `TECH_COORDINATOR`, `SOCIAL_MEDIA_COORDINATOR` | `SOCIAL_MEDIA_COORDINATOR` and `STUDENT_COORDINATOR` restricted to updating only events they created. |
| Delete Event | `FACULTY_COORDINATOR`, `STUDENT_COORDINATOR`, `TECH_COORDINATOR` | `STUDENT_COORDINATOR` restricted to deleting only events they created. |
| Publish Event | `FACULTY_COORDINATOR`, `STUDENT_COORDINATOR`, `TECH_COORDINATOR` | `STUDENT_COORDINATOR` restricted to publishing only events they created. |
| Upload Event Assets | `FACULTY_COORDINATOR`, `STUDENT_COORDINATOR`, `TECH_COORDINATOR`, `SOCIAL_MEDIA_COORDINATOR` | None. |
| Notifications / Emails | `FACULTY_COORDINATOR`, `STUDENT_COORDINATOR`, `TECH_COORDINATOR` | None. |

### 2. User & Identity Management (`/users`)
| Functionality | Allowed Roles | Scope / Restrictions |
|---------------|---------------|-----------------------|
| View User Directory | `FACULTY_COORDINATOR`, `TECH_COORDINATOR` | None. |
| Approve / Reject Users | `FACULTY_COORDINATOR`, `TECH_COORDINATOR` | None. |
| Change User Roles | `FACULTY_COORDINATOR`, `TECH_COORDINATOR` | None. |
| View System Audit Logs | `FACULTY_COORDINATOR`, `TECH_COORDINATOR` | None. |

### 3. Approvals System (`/approvals`)
| Functionality | Allowed Roles | Scope / Restrictions |
|---------------|---------------|-----------------------|
| View Pending Approvals | `FACULTY_COORDINATOR`, `TECH_COORDINATOR`, `STUDENT_COORDINATOR`, `SOCIAL_MEDIA_COORDINATOR` | Users can only view requests they submitted unless they are `FACULTY_COORDINATOR` or `TECH_COORDINATOR` (who see all). |
| Submit Request | `STUDENT_COORDINATOR`, `SOCIAL_MEDIA_COORDINATOR`, `TECH_COORDINATOR` | Requests are typed. `SOCIAL_MEDIA_COORDINATOR` restricted to `SOCIAL_MEDIA_POST` and `CONTENT_PUBLISH`. `STUDENT_COORDINATOR` handles Event / Resource / Budget approvals. |
| Execute Approval Decision | `FACULTY_COORDINATOR`, `TECH_COORDINATOR` | Global execution power. (Student Coordinators no longer have this power). |

### 4. Certificates Module (`/certificates`)
| Functionality | Allowed Roles | Scope / Restrictions |
|---------------|---------------|-----------------------|
| Manage Certificate Templates | `FACULTY_COORDINATOR`, `STUDENT_COORDINATOR`, `TECH_COORDINATOR` | None. |
| Generate Bulk Certificates | `FACULTY_COORDINATOR`, `TECH_COORDINATOR` | None. |
| Download Certificates ZIP | `FACULTY_COORDINATOR`, `TECH_COORDINATOR` | None. |

### 5. Analytics & Dashboards (`/analytics`)
| Functionality | Allowed Roles | Scope / Restrictions |
|---------------|---------------|-----------------------|
| View Sentinel & Operations | `FACULTY_COORDINATOR`, `TECH_COORDINATOR` | Global system health and broad operational data. |
| View Top 3 / Event Analysis | `FACULTY_COORDINATOR`, `STUDENT_COORDINATOR`, `TECH_COORDINATOR`, `SOCIAL_MEDIA_COORDINATOR` | Marketing and engagement data visibility for content/student coordinators. |

### 6. Attendance & Operations (`/attendance`, `/teams`)
| Functionality | Allowed Roles | Scope / Restrictions |
|---------------|---------------|-----------------------|
| Mark/Override Attendance | `FACULTY_COORDINATOR`, `STUDENT_COORDINATOR`, `TECH_COORDINATOR` | None. |
| Edit Club Branding / Teams | `FACULTY_COORDINATOR`, `STUDENT_COORDINATOR`, `TECH_COORDINATOR` | None. |
| Disqualify Teams | `FACULTY_COORDINATOR`, `TECH_COORDINATOR` | None. |

### 7. Telemetry & Settings (`/maintenance`, `/settings`)
| Functionality | Allowed Roles | Scope / Restrictions |
|---------------|---------------|-----------------------|
| View Maintenance Logs | `FACULTY_COORDINATOR`, `TECH_COORDINATOR` | None. |
| Manage Landing CMS | `FACULTY_COORDINATOR`, `TECH_COORDINATOR`, `SOCIAL_MEDIA_COORDINATOR` | Allows marketing/content roles to manage public landing page assets. |

---

## Frontend Navigation Visibility (Dashboard)

The frontend navigation (`client/src/app/dashboard/layout.tsx`) natively hides/shows links based on explicit string matching against the authenticated user's token role.

*(Note: Routes like "Overview", "Teams", "Attendance", "Leaderboard", "My Certificates", and "Profile" remain visible to all `MEMBER` users as standard functionality).*

| Module | Roles Permitted to See Navigation Link |
|--------|---------------------------------------|
| **Events** | `FACULTY_COORDINATOR`, `STUDENT_COORDINATOR`, `TECH_COORDINATOR`, `SOCIAL_MEDIA_COORDINATOR` |
| **Certificates** | `FACULTY_COORDINATOR`, `STUDENT_COORDINATOR`, `TECH_COORDINATOR` |
| **Approvals** | `FACULTY_COORDINATOR`, `STUDENT_COORDINATOR`, `TECH_COORDINATOR`, `SOCIAL_MEDIA_COORDINATOR` |
| **Users** | `FACULTY_COORDINATOR`, `TECH_COORDINATOR` |
| **Analytics** | `FACULTY_COORDINATOR`, `STUDENT_COORDINATOR`, `TECH_COORDINATOR`, `SOCIAL_MEDIA_COORDINATOR` |
| **Landing CMS** | `FACULTY_COORDINATOR`, `TECH_COORDINATOR`, `SOCIAL_MEDIA_COORDINATOR` |
| **Maintenance Logs** | `FACULTY_COORDINATOR`, `TECH_COORDINATOR` |
| **Info** | `FACULTY_COORDINATOR` |
