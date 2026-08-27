import { Router, Request, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";
import { authenticate, requireRole, requireMinRole } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { auditLog } from "../middlewares/auditLog";
import { emitToEvent } from "../lib/socket";

const router = Router();

// ─── Shared user select projection ────────────────────────────────────────────
// Includes avatarUrl so frontend can display real profile pictures in the log
const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  avatarUrl: true,
  employeeId: true,
} as const;

// ─── Validation schemas ────────────────────────────────────────────────────────

const checkInSchema = z.object({
  eventId: z.string().uuid(),
  type: z.enum(["CHECK_IN", "CHECK_OUT"]),
  userId: z.string().uuid().optional(),  // coordinator scanning on behalf of someone
  teamCode: z.string().max(50).optional(), // team bulk check-in via QR
});

const manualCheckInSchema = z.object({
  eventId: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.enum(["CHECK_IN", "CHECK_OUT"]),
  note: z.string().max(200).optional(), // reason for manual override
});

// ─── GET /api/attendance/my-status/:eventId ───────────────────────────────────
// Check if the current authenticated user is checked in to the given event
router.get("/my-status/:eventId", authenticate, async (req: Request, res: Response) => {
  try {
    const eventId = req.params.eventId;
    if (!z.string().uuid().safeParse(eventId).success) {
      res.status(400).json({ error: "Invalid event ID" });
      return;
    }

    const userId = req.user!.userId;
    // Get the most recent attendance record (determines current state)
    const record = await prisma.attendance.findFirst({
      where: { userId, eventId },
      orderBy: { timestamp: "desc" },
    });

    const checkedIn = !!record && record.type === "CHECK_IN";
    res.json({ checkedIn, record: record || null });
  } catch {
    res.status(500).json({ error: "Failed to retrieve status" });
  }
});

// ─── POST /api/attendance ────────────────────────────────────────────────────
// Record a check-in or check-out (QR scan or direct)
router.post(
  "/",
  authenticate,
  validate(checkInSchema),
  auditLog("ATTENDANCE_RECORDED"),
  async (req: Request, res: Response) => {
    try {
      const { eventId, type, userId: targetUserId, teamCode } = req.body;

      // ── TEAM BULK CHECK-IN via QR teamCode ──────────────────────────────
      if (teamCode) {
        const team = await prisma.team.findFirst({
          where: { teamCode, eventId }, // validate team belongs to this event
          include: { members: { include: { user: { select: USER_SELECT } } } },
        });
        if (!team) {
          res.status(404).json({ error: "Team not found for this event" });
          return;
        }

        const memberUserIds = team.members.map((m) => m.userId);

        // Batch fetch registrations and existing attendance in parallel
        const [registrations, latestRecords] = await Promise.all([
          prisma.eventRegistration.findMany({
            where: { eventId, userId: { in: memberUserIds } },
            select: { userId: true },
          }),
          type === "CHECK_IN"
            ? prisma.attendance.findMany({
                where: { eventId, userId: { in: memberUserIds } },
                orderBy: { timestamp: "desc" },
                distinct: ["userId"],
                select: { userId: true, type: true },
              })
            : Promise.resolve([]),
        ]);

        const registeredIds = new Set(registrations.map((r) => r.userId));
        const alreadyCheckedIn = new Set(
          (latestRecords as { userId: string; type: string }[])
            .filter((r) => r.type === "CHECK_IN")
            .map((r) => r.userId)
        );

        // Only process registered, not-yet-checked-in members
        let eligibleIds = memberUserIds.filter(
          (id) => registeredIds.has(id) && !alreadyCheckedIn.has(id)
        );

        let records: { id: string; userId: string; eventId: string; type: string; timestamp: Date; isLate: boolean; isEarly: boolean }[] = [];
        if (eligibleIds.length > 0) {
          const event = await prisma.event.findUnique({ where: { id: eventId } });
          const isLate = event ? new Date() > new Date(event.startDate) && type === "CHECK_IN" : false;
          const isEarly = event?.endDate ? new Date() < new Date(event.endDate) && type === "CHECK_OUT" : false;

          await prisma.attendance.createMany({
            data: eligibleIds.map((uid) => ({ userId: uid, eventId, type, isLate, isEarly })),
          });

          records = await prisma.attendance.findMany({
            where: { eventId, userId: { in: eligibleIds }, type },
            orderBy: { timestamp: "desc" },
            take: eligibleIds.length,
          });
        }

        // Emit real-time update with full team info
        emitToEvent(eventId, "attendance:team", {
          type: "team",
          teamCode,
          count: records.length,
          teamName: team.name,
        });

        res.status(201).json({ records, count: records.length, teamName: team.name });
        return;
      }

      // ── INDIVIDUAL CHECK-IN ──────────────────────────────────────────────
      const userId = targetUserId || req.user!.userId;

      // Coordinators can check in anyone; members can only check in themselves
      const isCoord = ["FACULTY", "STUDENT_COORDINATOR", "TECH"].includes(req.user!.role);
      if (targetUserId && !isCoord) {
        res.status(403).json({ error: "Insufficient permissions" });
        return;
      }

      const [reg, event] = await Promise.all([
        prisma.eventRegistration.findUnique({
          where: { userId_eventId: { userId, eventId } },
        }),
        prisma.event.findUnique({ where: { id: eventId } }),
      ]);

      if (!reg) {
        res.status(400).json({ error: "Not registered for this event" });
        return;
      }

      // Prevent duplicate check-in
      if (type === "CHECK_IN") {
        const last = await prisma.attendance.findFirst({
          where: { userId, eventId },
          orderBy: { timestamp: "desc" },
        });
        if (last?.type === "CHECK_IN") {
          res.status(400).json({ error: "Already checked in" });
          return;
        }
      }

      const isLate = event ? new Date() > new Date(event.startDate) && type === "CHECK_IN" : false;
      const isEarly = event?.endDate ? new Date() < new Date(event.endDate) && type === "CHECK_OUT" : false;

      const record = await prisma.attendance.create({
        data: { userId, eventId, type, isLate, isEarly },
        include: { user: { select: USER_SELECT } },
      });

      // Emit real-time update with full record for instant UI update
      emitToEvent(eventId, "attendance:new", record);

      res.status(201).json({ attendance: record });
    } catch {
      res.status(500).json({ error: "Failed to record attendance" });
    }
  }
);

// ─── POST /api/attendance/manual ─────────────────────────────────────────────
// Coordinator manually adds attendance for a user (physical sign-in / forgotten QR)
router.post(
  "/manual",
  authenticate,
  requireRole("FACULTY", "STUDENT_COORDINATOR", "TECH"),
  validate(manualCheckInSchema),
  auditLog("ATTENDANCE_MANUAL_OVERRIDE"),
  async (req: Request, res: Response) => {
    try {
      const { eventId, userId, type, note } = req.body;

      const [reg, event] = await Promise.all([
        prisma.eventRegistration.findUnique({
          where: { userId_eventId: { userId, eventId } },
        }),
        prisma.event.findUnique({ where: { id: eventId } }),
      ]);

      if (!reg) {
        res.status(400).json({ error: "User is not registered for this event" });
        return;
      }
      if (!event) {
        res.status(404).json({ error: "Event not found" });
        return;
      }

      // Check for duplicate check-in
      if (type === "CHECK_IN") {
        const last = await prisma.attendance.findFirst({
          where: { userId, eventId },
          orderBy: { timestamp: "desc" },
        });
        if (last?.type === "CHECK_IN") {
          res.status(400).json({ error: "User is already checked in" });
          return;
        }
      }

      const isLate = new Date() > new Date(event.startDate) && type === "CHECK_IN";
      const isEarly = event.endDate ? new Date() < new Date(event.endDate) && type === "CHECK_OUT" : false;

      const record = await prisma.attendance.create({
        data: {
          userId,
          eventId,
          type,
          isLate,
          isEarly,
        },
        include: { user: { select: USER_SELECT } },
      });

      // Emit to all coordinators watching this event
      emitToEvent(eventId, "attendance:new", { ...record, isManual: true, note });

      res.status(201).json({ attendance: record, note });
    } catch {
      res.status(500).json({ error: "Failed to record manual attendance" });
    }
  }
);

// ─── DELETE /api/attendance/:id ───────────────────────────────────────────────
// Coordinator voids/undoes a specific attendance record
router.delete(
  "/:id",
  authenticate,
  requireRole("FACULTY", "STUDENT_COORDINATOR", "TECH"),
  auditLog("ATTENDANCE_VOIDED"),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!z.string().uuid().safeParse(id).success) {
        res.status(400).json({ error: "Invalid attendance ID" });
        return;
      }

      const record = await prisma.attendance.findUnique({ where: { id } });
      if (!record) {
        res.status(404).json({ error: "Attendance record not found" });
        return;
      }

      await prisma.attendance.delete({ where: { id } });

      // Emit void event so live dashboard removes the record
      emitToEvent(record.eventId, "attendance:voided", { id, eventId: record.eventId });

      res.json({ success: true, voidedId: id });
    } catch {
      res.status(500).json({ error: "Failed to void attendance record" });
    }
  }
);

// ─── GET /api/attendance/event/:eventId ──────────────────────────────────────
// Coordinator live dashboard: paginated records + stats + timeline
router.get(
  "/event/:eventId",
  authenticate,
  requireMinRole("TECH"),
  async (req: Request, res: Response) => {
    try {
      const eventId = req.params.eventId;
      if (!z.string().uuid().safeParse(eventId).success) {
        res.status(400).json({ error: "Invalid event ID" });
        return;
      }

      const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || "50"), 10)));
      const skip = (page - 1) * limit;

      // Run all queries in parallel for performance
      const [records, totalCount, totalRegistered, event] = await Promise.all([
        prisma.attendance.findMany({
          where: { eventId },
          include: { user: { select: USER_SELECT } },
          orderBy: { timestamp: "desc" },
          skip,
          take: limit,
        }),
        prisma.attendance.count({ where: { eventId } }),
        prisma.eventRegistration.count({ where: { eventId } }),
        prisma.event.findUnique({ where: { id: eventId }, select: { startDate: true, endDate: true } }),
      ]);

      // ── Compute presence stats ───────────────────────────────────────────
      // Fetch ALL records (not just current page) for accurate stats
      const allRecords = await prisma.attendance.findMany({
        where: { eventId },
        orderBy: { timestamp: "asc" },
        select: { userId: true, type: true, timestamp: true, isLate: true, isEarly: true },
      });

      // Determine each user's current state (last record wins)
      const userStatus = new Map<string, string>();
      for (const r of allRecords) {
        userStatus.set(r.userId, r.type);
      }

      let checkedIn = 0, checkedOut = 0;
      userStatus.forEach((status) => {
        if (status === "CHECK_IN") checkedIn++;
        else checkedOut++;
      });

      const lateArrivals = allRecords.filter((r) => r.isLate && r.type === "CHECK_IN").length;
      const earlyExits = allRecords.filter((r) => r.isEarly && r.type === "CHECK_OUT").length;

      // ── Hourly timeline (for sparkline chart) ───────────────────────────
      // Group check-ins by hour for the last 24 hours
      const hourlyMap: Record<string, number> = {};
      for (const r of allRecords) {
        if (r.type === "CHECK_IN") {
          const hour = new Date(r.timestamp).toISOString().slice(0, 13); // "2025-05-28T14"
          hourlyMap[hour] = (hourlyMap[hour] || 0) + 1;
        }
      }
      const timeline = Object.entries(hourlyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([hour, count]) => ({ hour, count }));

      res.json({
        records,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasMore: skip + limit < totalCount,
        },
        stats: {
          currentlyPresent: checkedIn,
          totalCheckedOut: checkedOut,
          pendingArrival: Math.max(0, totalRegistered - userStatus.size),
          totalRegistered,
          uniqueAttendees: userStatus.size,
          lateArrivals,
          earlyExits,
          anomalies: lateArrivals + earlyExits,
        },
        timeline,
        eventInfo: event,
      });
    } catch {
      res.status(500).json({ error: "Failed to load attendance dashboard" });
    }
  }
);

// ─── GET /api/attendance/presence/:eventId ───────────────────────────────────
// Returns two lists: present[] (currently inside) and absent[] (not yet arrived)
router.get(
  "/presence/:eventId",
  authenticate,
  requireMinRole("TECH"),
  async (req: Request, res: Response) => {
    try {
      const eventId = req.params.eventId;
      if (!z.string().uuid().safeParse(eventId).success) {
        res.status(400).json({ error: "Invalid event ID" });
        return;
      }

      // All registered users for this event
      const registrations = await prisma.eventRegistration.findMany({
        where: { eventId },
        include: { user: { select: USER_SELECT } },
        orderBy: { createdAt: "asc" },
      });

      // Latest attendance state per user
      const latestRecords = await prisma.attendance.findMany({
        where: { eventId },
        orderBy: { timestamp: "desc" },
        distinct: ["userId"],
        select: { userId: true, type: true, timestamp: true },
      });

      const userStatus = new Map(latestRecords.map((r) => [r.userId, r]));

      const present: typeof registrations = [];
      const absent: typeof registrations = [];
      const checkedOut: typeof registrations = [];

      for (const reg of registrations) {
        const status = userStatus.get(reg.userId);
        if (!status) {
          absent.push(reg);
        } else if (status.type === "CHECK_IN") {
          present.push(reg);
        } else {
          checkedOut.push(reg);
        }
      }

      res.json({
        present: present.map((r) => ({ ...r.user, lastSeen: userStatus.get(r.userId)?.timestamp })),
        absent: absent.map((r) => r.user),
        checkedOut: checkedOut.map((r) => ({ ...r.user, lastSeen: userStatus.get(r.userId)?.timestamp })),
        counts: {
          present: present.length,
          absent: absent.length,
          checkedOut: checkedOut.length,
          total: registrations.length,
        },
      });
    } catch {
      res.status(500).json({ error: "Failed to load presence data" });
    }
  }
);

// ─── GET /api/attendance/search-registered/:eventId ──────────────────────────
// Search registered users by name/email (for manual override UI autocomplete)
router.get(
  "/search-registered/:eventId",
  authenticate,
  requireRole("FACULTY", "STUDENT_COORDINATOR", "TECH"),
  async (req: Request, res: Response) => {
    try {
      const eventId = req.params.eventId;
      const q = String(req.query.q || "").trim().slice(0, 100);

      if (!z.string().uuid().safeParse(eventId).success) {
        res.status(400).json({ error: "Invalid event ID" });
        return;
      }

      const registrations = await prisma.eventRegistration.findMany({
        where: {
          eventId,
          user: q
            ? {
                OR: [
                  { name: { contains: q, mode: "insensitive" } },
                  { email: { contains: q, mode: "insensitive" } },
                ],
              }
            : undefined,
        },
        include: { user: { select: USER_SELECT } },
        take: 20,
      });

      res.json({ users: registrations.map((r) => r.user) });

    } catch {
      res.status(500).json({ error: "Search failed" });
    }
  }
);

export default router;
