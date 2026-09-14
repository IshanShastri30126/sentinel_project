# Phase 42.7 -- Calendar and Date-Picker UI Redesign Report

Generated: 2026-09-15
Scope: Phase 42.7 (Calendar / Date-Picker UI Redesign)

## Problem Statement

The original Step 2 (Schedule) in the event creation wizard rendered three full MiniCalendar panels side-by-side in a lg:grid-cols-3 layout.

Issues identified:
- On screens smaller than 1024px all three panels stacked vertically, consuming 800-1000px of vertical space.
- All three calendars were simultaneously visible even when only one was relevant at a time.
- The color coding between the three panels was uniform, making it difficult to distinguish START vs END vs DEADLINE.
- The disabledNotice panels rendered as full empty calendar grids.

## Solution

Replaced the three-panel grid with a unified vertical accordion.

Each accordion panel:
- Has a distinct accent color: cyan (#00F5D4) for Start, violet (#7C3AED) for End, orange (#FF4D00) for Deadline.
- Shows the currently-set date and time in its collapsed header.
- Shows a "SET" badge when a date has been selected.
- Expands to reveal the full MiniCalendar when clicked.
- Shows a locked/disabled message when a prerequisite date has not been set.
- Collapses the previously-open panel automatically when a new one is opened.

Preserved features:
- All original validation logic (startDate < endDate, past dates disabled, deadline must precede start).
- All original onSelect callbacks and cascade logic (auto-setting registrationDeadline when start is chosen).
- rangeStart / rangeEnd highlighting across panels.
- onClear for registration deadline.
- Quick time presets and relative deadline presets.

## Verification

Confirmed via Next.js hot reload compilation (task-3883). No TypeScript errors. Business logic unchanged.
