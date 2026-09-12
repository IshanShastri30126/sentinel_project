# CTF Wars — Design & UI Guide

> **Author:** Engineering Team (Dhairya Tanna)
> **Status:** APPROVED

---

## 1. The Vibe (Aesthetics)
The platform must feel like a professional cybersecurity command center. 
We are avoiding generic, AI-looking UI components.

*   **Theme:** Strictly **Green and Black**.
*   **Banned Color:** Red. We will use Orange for errors/incorrect flags to stick to the theme.
*   **UI Libraries:** We will use a custom mix of **Shadcn UI** (for extremely clean, professional forms/buttons) and **Aceternity UI** (for subtle, non-distracting hacker backgrounds).

---

## 2. The Color Palette

### Base Colors
*   **Background:** `#0A0A0A` (Deep Space Black)
*   **Cards/Panels:** `#111111` (Slightly lighter black)
*   **Borders:** `#262626` (Dark Grey)
*   **Primary Text:** `#FAFAFA` (Off-white for readability)

### The "Hacker Green" Accents
*   **Primary Action/Success:** `#00FF88` (Neon Lime)
*   **Subtle Glow:** `rgba(0, 255, 136, 0.15)`

### Semantic Colors
*   **Success (Correct Flag):** `#00FF88` (Neon Lime)
*   **Warning (Hint Cost):** `#FBBF24` (Amber/Gold)
*   **Error (Wrong Flag):** `#F97316` (Orange — NO RED!)

---

## 3. Game-Specific Colors

### Leaderboard Tiers
We color-code player names based on their skill bracket (HackVerse style):
*   🥉 **Apprentice:** `#A1A1AA` (Steel/Silver)
*   🥈 **Journeyman:** `#38BDF8` (Sky Blue)
*   🥇 **Master:** `#FBBF24` (Gold)
*   💎 **Grandmaster:** `#A855F7` (Purple/Neon)

### Player Progression Matrix (Admin Dashboard)
We color-code the grid cells so admins can instantly see activity (CTFd style):
*   🟦 **Opened:** `#38BDF8` (Blue) — Player looked at the question.
*   🟨 **Attempted:** `#FBBF24` (Yellow) — Player submitted a wrong flag.
*   🟩 **Solved:** `#00FF88` (Green) — Player captured the flag.

---

## 4. Fonts
We are using fonts that look like they belong in a terminal, but are highly readable.
*   **Headings & Titles:** `Space Grotesk` (Modern, geometric, looks great for numbers).
*   **Reading Text:** `Inter` (Standard, ultra-clean professional font).
*   **Flags, Code, & Scores:** `JetBrains Mono` (Monospaced, so numbers line up perfectly on the leaderboard).

---

## 5. UI Components

### The 5-Second Admin Freeze
*   A full-screen dark overlay that pops up when a question is edited live.
*   Blocks the player from clicking anything.
*   Shows a giant countdown timer (5... 4... 3...) in neon green.
*   After 5 seconds, buttons unlock to let them go to the updated challenge.

### Challenge Cards
*   Load smoothly using "Skeleton" placeholders (looks like a grey shimmering box while loading).
*   Shows the category, title, current parabolic score, and a tiny "👁️ 5 users viewing" indicator at the bottom.
