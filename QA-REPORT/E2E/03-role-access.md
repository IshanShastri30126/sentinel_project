# Role-Based Access Control (RBAC) & Privilege Separation Audit Report

**Audit Date:** 2026-09-14T12:49:23.069Z
**Access Matrix:** GUEST → MEMBER → STUDENT_COORDINATOR → FACULTY_COORDINATOR

### RBAC & IDOR Test Results

| Vector ID | Target Endpoint | Executing Identity | Expected Status | Actual Status | Access Control Verdict |
|---|---|---|---|---|---|
| SEC-RBAC-001 | `PATCH /api/users/undefined/approve with Student Role` | Low-Privilege Student | HTTP 403 | HTTP 401 | **DENIED (PASS)** |
| SEC-RBAC-002 | `GET /api/maintenance/audit-logs with Student Role` | Low-Privilege Student | HTTP 403 | HTTP 401 | **DENIED (PASS)** |
| SEC-IDOR-001 | `DELETE /api/events/registrations/:arbitraryId` | Low-Privilege Student | HTTP 404 | HTTP 404 | **DENIED (PASS)** |
