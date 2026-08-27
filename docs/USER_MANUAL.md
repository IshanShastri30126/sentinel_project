# 📖 Chakravyuh SENTINAL (CyberKavach 2.0) — User Manual

Welcome to the **SENTINAL Platform (Chakravyuh Club Portal)** at [chakravyuhclub.com](https://chakravyuhclub.com). This manual provides operational workflows for all four portal roles: **General Members**, **Student Coordinators / Team Leads**, **Faculty Coordinators**, and the **Tech Team / System Administrators**.

---

## 🧭 Role Matrix & Permissions Overview

| Feature / Module | Member | Coordinator / Lead | Faculty | Tech Team / Admin |
| :--- | :---: | :---: | :---: | :---: |
| **Profile & Role Clearance** | View & Edit (Student ID, Sem 1-8) | View & Edit | View & Edit (Employee ID, No Sem) | Full System Access |
| **Public Event Catalog & RSVP** | ✅ Register / RSVP | ✅ Register / RSVP | ✅ View / Monitor | ✅ Full Control |
| **Event Creation & Management** | ❌ | ✅ Create, Edit, Posters, Links | ✅ Review & Approve | ✅ Full Control |
| **Attendance QR Check-in** | ❌ (Presents QR) | ✅ Scan with Camera | ✅ Monitor Reports | ✅ Full Control |
| **Certificate Generation & Verification** | ✅ Download Verified PDF | ✅ Design Templates | ✅ Authorize Release | ✅ Full Control |
| **Multi-Tier Approvals** | ❌ | ✅ Submit Requests | ✅ Approve / Reject | ✅ Audit All Decisions |
| **Maintenance Telemetry & IP Firewall** | ❌ | ❌ | ❌ | ✅ Live ASCII Logs & Rules |
| **Bug Tracking & System Logs** | ✅ Report Bugs | ✅ Report Bugs | ✅ Report Bugs | ✅ Triage & Assign |
| **CTF Wars SSO & Arena** | ✅ Solve & Score | ✅ Solve & Score | ✅ Monitor | ✅ Manage Challenges |

---

## 👤 1. Member & Student Guide

### 1.1 Registration & Onboarding
1. Navigate to [chakravyuhclub.com/auth](https://chakravyuhclub.com/auth).
2. Switch to the **Register** tab.
3. Fill in your details:
   - **Full Name**
   - **University Email ID**
   - **10-Digit Mobile Number** (Numeric only, strictly 10 digits).
   - **Institute & Department** (Selected from dependent cascading dropdowns).
   - **Semester** (1 through 8).
   - **Student Enrollment ID** (Unique university roll number).
   - **Password** (Minimum 8 characters with upper, lower, and numbers).
4. Click **Create Account**. Your account enters pending clearance until verified by a Faculty Coordinator.

### 1.2 Event Registration & Attendance
1. Browse upcoming workshops, hackathons, and guest lectures at **Events**.
2. Click **View Details** on any active event card.
3. Click **Register Now**. You will immediately receive a registration confirmation on your dashboard.
4. On the day of the event, open your dashboard on mobile and click **Show My Ticket / QR Code**. Present this QR code to the coordinator at the venue door for instant check-in.

### 1.3 Downloading & Verifying Certificates
1. Once an event finishes and certificates are authorized by faculty, visit **Dashboard > My Certificates**.
2. Click **Download PDF** for your customized high-resolution certificate.
3. Share your certificate with pride! Anyone can verify its authenticity by visiting `chakravyuhclub.com/verify/[CERTIFICATE_CODE]`.

---

## 👔 2. Student Coordinator & Team Lead Guide

### 2.1 Event Creation & Publishing
1. Go to **Dashboard > Events** and click **+ Create Event**.
2. Fill in the event configuration:
   - **Event Title & Category** (Workshop, CTF, Hackathon, Expert Talk).
   - **Start Date & End Date** with preset and custom time pickers.
   - **Maximum Seat Capacity**.
   - **Poster Upload** (PNG, JPEG, or WebP).
   - **Assigned Co-Organizers** (Select student coordinators from the dropdown).
   - **Social Links** (Custom Instagram, Discord, LinkedIn presets).
3. Click **Publish Event**.

### 2.2 QR Attendance Scanner Workflow
1. Navigate to **Dashboard > Attendance**.
2. Select the active event from the dropdown.
3. Click **Start QR Scanner** and grant browser camera permission.
4. Point your camera at students' dynamic QR ticket codes. The system checks attendance in real time with audio/visual confirmation and prevents double check-ins.
5. Export full attendance rosters to Microsoft Excel at any time by clicking **Export Excel**.

---

## 🎓 3. Faculty Coordinator Guide

### 3.1 Role-Specific Profile Details
- The faculty dashboard profile automatically identifies your academic rank and displays your **Employee ID** and department.
- Student-specific fields (such as semester numbers) are automatically hidden for clean governance.

### 3.2 Authorizations & Approvals Hub
1. Navigate to **Dashboard > Approvals**.
2. Review pending requests across categories:
   - **Event Permissions**
   - **Resource & Venue Requests**
   - **Budget Allocations**
   - **Certificate Releases**
3. Review attached details, budget breakdowns, and timelines.
4. Click **Approve** or **Reject** (with mandatory feedback comment). The system instantly notifies the student leads and records the decision in the permanent audit trail.

### 3.3 User Access Clearance
1. Navigate to **Dashboard > Users**.
2. Under the **Pending Approvals** tab, inspect new student registrants.
3. Click **Grant Access** to promote the applicant to an active Member, or click **Reject Access** to permanently remove the unverified application.

---

## 🛠️ 4. Tech Team & System Administrator Guide

### 4.1 Real-Time Maintenance Telemetry
1. Navigate to **Dashboard > Maintenance**.
2. Observe the live **9-Field ASCII Telemetry Stream** showing real-time HTTP requests, response latencies, user identities, client IPs, and firewall decisions.
3. Inspect system performance metrics: Memory usage, API latency percentiles (p50, p95, p99), and PostgreSQL connection pool stats.

### 4.2 Dynamic IP Firewall
1. Under **Maintenance > Firewall Rules**, view active IP filtering rules.
2. To block a malicious IP or range, click **Add Rule**, enter the IP/CIDR (e.g. `203.0.113.195`), select **BLOCK**, and submit. The rule takes effect immediately without server restarts.

### 4.3 Bug Tracker
1. Under **Maintenance > Bug Reports**, review incoming portal feedback submitted by students and faculty.
2. Update ticket status from `OPEN` to `IN_PROGRESS` or `RESOLVED`, and assign developer owners.
