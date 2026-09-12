# CTF Wars — System Requirements (SRS)

> **Author:** Engineering Team (Dhairya Tanna)
> **Status:** APPROVED

---

## 1. Project Goal
We are building a standalone, high-performance Capture The Flag (CTF) platform. 
It uses a **Node.js (Express)** backend and a **Next.js** frontend. It will share the database with the main Sentinel portal so users don't have to create separate accounts.

---

## 2. User Roles
There are 4 main roles in the CTF platform. To avoid breaking Sentinel's core system, we map CTF roles directly to Sentinel's existing `Role` enum in the database:
*   **Participant (Mapped to `STUDENT` or `MEMBER`):** Plays the CTF. Can solve challenges, view the leaderboard, and check their personal stats.
*   **Judge (Mapped to `EVALUATOR`):** Helps run the event. Can review manual flag submissions and view the submissions log.
*   **Question Setter (Mapped to `FACULTY`):** Creates the content. Can add/edit challenges, hints, and set point values.
*   **Admin (Mapped to `SUPER_ADMIN` or `ADMIN`):** The boss. Controls the start/stop of the competition, sends live alerts, and views advanced analytics.

---

## 3. Player Experience (Gamification)

*These features are inspired by top-tier platforms like HackVerse.*

### 3.1 Tier-Based Leaderboard
*   **Simple Ranking:** A clean table showing Position, Name, and Score. Uses a "Load More" button instead of loading everyone at once.
*   **Skill Tiers:** Players are automatically assigned a tier based on their score:
    *   **Apprentice** (Beginner)
    *   **Journeyman** (Intermediate)
    *   **Master** (Advanced)
    *   **Grandmaster** (Elite)
*   **Filtering:** Users can filter the leaderboard to only see people in their specific tier.

### 3.2 "My Scores" Dashboard
*   Players get a dedicated personal page.
*   It shows a timeline of when they solved challenges and a chart of their score growth over time.
*   They don't have to hunt for their name on the main leaderboard to see how they are doing.

### 3.3 Account Management
*   **Self-Service:** Players can securely change their own passwords from their settings page without asking an admin for help.

---

## 4. The Scoring Engine

Instead of fixed points (e.g., 100 points for everyone), we use **Dynamic Parabolic Scoring** to reward speed and keep rare challenges valuable.

### How Parabolic Decay Works:
The value of a challenge drops as more people solve it, but it follows a curved path (parabola) so it stays highly valuable for the first few solvers before dropping.

Every challenge has 3 settings configured by the Question Setter:
1.  **Initial:** The maximum starting points (e.g., 500).
2.  **Decay:** The number of solves it takes to reach the minimum points (e.g., 20).
3.  **Minimum:** The absolute lowest points this challenge will give (e.g., 50).

*Formula used:* `value = ceil( ((minimum - initial) / decay²) * solve_count² + initial )`

---

## 5. Admin & Organizer Tools

*These analytics and control features are inspired by CTFd.*

### 5.1 Live Statistics Dashboard
Admins get a real-time HUD showing:
*   **KPIs:** Total users, active teams, distinct IPs, total points awarded, and total challenges.
*   **Highlights:** Instantly see the "Most Solved" and "Least Solved" challenges.

### 5.2 Player Progression Matrix
A visual grid (heatmap) showing exactly what every player is doing.
*   **Rows:** Player/Team Name.
*   **Columns:** Every challenge in the CTF.
*   **Color Coding:** 
    *   🟩 **Green:** Solved
    *   🟨 **Yellow:** Attempted (submitted a wrong flag)
    *   🟦 **Blue:** Opened (viewed the challenge but hasn't submitted yet)
*   Includes a "Filter Matrix Data" tool to narrow down specific teams or challenges.

### 5.3 Submission Logs
*   Admins can view a raw, real-time feed of every flag submitted by every player.
*   They can quickly filter the log by: **All Submissions**, **Correct Only**, or **Incorrect Only**.
*   *Why?* Helps catch cheaters sharing flags or identify if a challenge is broken because everyone is submitting the same wrong answer.

---

## 6. Real-Time Mechanics & Concurrency

Since 150+ students might be playing at the same time, the system has strict technical rules to prevent freezing.

### 6.1 Admin Interruption (The 5-Second Freeze)
*   If a Question Setter realizes a challenge has a typo and fixes it live, we must ensure players aren't confused.
*   Saving an edit triggers a **global WebSocket broadcast**.
*   All active players get a mandatory, full-screen pop-up: *"Challenge Modified. Please Review."*
*   The screen is frozen for exactly 5 seconds (cannot click away), then they can go to the updated question.

### 6.2 Live Presence
*   Players can see how many other people are looking at the same challenge right now (e.g., "👁️ 12 users viewing").

### 6.3 Anti-Crash Protection (Optimistic Concurrency)
*   If 50 people submit a flag at the exact same millisecond, the database won't lock up. 
*   We use a fast Redis queue and version-checking to process them smoothly and correctly calculate the dynamic parabolic score drops.
