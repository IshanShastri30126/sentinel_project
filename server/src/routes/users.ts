import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import { authenticate, requireRole, requireMinRole } from "../middlewares/auth";
import { auditLog } from "../middlewares/auditLog";
import { sendNotification } from "../lib/notificationService";
import { sendAccountApprovedEmail, sendRoleUpdatedEmail } from "../lib/emailService";
import { upload, getUploadedFileUrl } from "../middlewares/upload";
import bcrypt from "bcrypt";
import { Role } from "@prisma/client";
import redis, { redisGet, redisSet, redisDel } from "../lib/redis";

async function clearUsersCache() {
  try {
    const redisClient = redis;
    if (redisClient) {
      const keys = await redisClient.keys("users:list:*");
      if (keys && keys.length > 0) {
        await Promise.all(keys.map(key => redisClient.del(key)));
      }
    }
    await redisDel("analytics:operations");
    await redisDel("analytics:club");
    await redisDel("analytics:top3");
    await redisDel("analytics:coordinator-activity");
  } catch (err) {
    console.warn("Failed to clear users cache:", err);
  }
}

const router = Router();

// GET /api/users — List all users (SC+/Tech)
router.get("/", authenticate, requireMinRole("TECH"), async (req: Request, res: Response) => {
  try {
    const { search, role, approved, page, limit } = req.query;
    
    const pageNum = page ? parseInt(page as string) : undefined;
    const limitNum = limit ? parseInt(limit as string) : undefined;
    
    const pageVal = (pageNum && pageNum > 0) ? pageNum : undefined;
    const limitVal = (limitNum && limitNum > 0) ? limitNum : undefined;
    
    const cacheKey = `users:list:${search || "none"}:${role || "all"}:${approved || "all"}:${page || "all"}:${limit || "all"}`;
    const cached = await redisGet(cacheKey);
    if (cached) {
      res.json(JSON.parse(cached));
      return;
    }

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: "insensitive" } },
        { email: { contains: search as string, mode: "insensitive" } },
        { studentId: { contains: search as string, mode: "insensitive" } },
      ];
    }
    if (role) where.role = role as Role;
    if (approved !== undefined) where.isApproved = approved === "true";

    const total = await prisma.user.count({ where });

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true, name: true, email: true, role: true,
        studentId: true, department: true, phone: true,
        avatarUrl: true, isActive: true, isApproved: true, createdAt: true,
        institute: true, semester: true,
      },
      orderBy: { createdAt: "desc" },
      ...(pageVal && limitVal ? {
        skip: (pageVal - 1) * limitVal,
        take: limitVal,
      } : {}),
    });
    
    const responsePayload = {
      users,
      total,
      pages: limitVal ? Math.ceil(total / limitVal) : 1,
      page: pageVal || 1,
      limit: limitVal || total,
    };
    
    await redisSet(cacheKey, JSON.stringify(responsePayload), 300); // 5 minutes cache
    res.json(responsePayload);
  } catch (err) {
    console.error("[Users] List error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/users/search — Search users by name/email/studentId (for team member search)
router.get("/search", authenticate, async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (!q || (q as string).length < 2) {
      res.json({ users: [] });
      return;
    }
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: q as string, mode: "insensitive" } },
          { email: { contains: q as string, mode: "insensitive" } },
          { studentId: { contains: q as string, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, email: true, role: true, studentId: true, isApproved: true, isActive: true },
      take: 20,
    });
    res.json({ users });
  } catch (err) {
    console.error("[Users] Search error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/users/:id/approve — Approve new user account (SC+ only)
router.patch("/:id/approve", authenticate, requireMinRole("STUDENT_COORDINATOR"), auditLog("USER_APPROVED"), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isApproved: true, role: "MEMBER" },
      select: { id: true, name: true, email: true, role: true, isApproved: true },
    });

    await sendNotification({
      userId: user.id,
      type: "ACCOUNT_APPROVED",
      title: "Account Approved! 🎉",
      message: "Your Chakravyuh Club account has been approved. You can now access all member features.",
    });

    // Send account approved email (fire and forget)
    sendAccountApprovedEmail({ name: user.name, email: user.email }).catch((err) =>
      console.error("[Users] Account approved email failed:", err)
    );

    await clearUsersCache();

    res.json({ user: updated });
  } catch (err) {
    console.error("[Users] Approve error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

async function deleteUserCascade(userId: string) {
  const userRequests = await prisma.approvalRequest.findMany({
    where: { requesterId: userId },
    select: { id: true },
  });
  const reqIds = userRequests.map((r) => r.id);

  return prisma.$transaction([
    prisma.notification.deleteMany({ where: { userId } }),
    prisma.auditLog.deleteMany({ where: { userId } }),
    prisma.userBadge.deleteMany({ where: { userId } }),
    prisma.appreciationPoint.deleteMany({ where: { OR: [{ giverId: userId }, { receiverId: userId }] } }),
    prisma.attendance.deleteMany({ where: { userId } }),
    prisma.eventRegistration.deleteMany({ where: { userId } }),
    prisma.teamMember.deleteMany({ where: { userId } }),
    prisma.team.deleteMany({ where: { leaderId: userId } }),
    prisma.approvalStep.updateMany({ where: { approverId: userId }, data: { approverId: null } }),
    prisma.approvalStep.deleteMany({ where: { requestId: { in: reqIds } } }),
    prisma.approvalRequest.deleteMany({ where: { requesterId: userId } }),
    prisma.certificateTemplate.deleteMany({ where: { createdById: userId } }),
    prisma.event.deleteMany({ where: { creatorId: userId } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);
}

// PATCH /api/users/:id/reject — Reject & permanently remove candidate from portal (SC+ only)
router.patch("/:id/reject", authenticate, requireMinRole("STUDENT_COORDINATOR"), auditLog("USER_REJECTED"), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (id === req.user!.userId) {
      res.status(400).json({ error: "Cannot reject your own account" });
      return;
    }

    await deleteUserCascade(id);
    await clearUsersCache();

    res.json({ success: true, message: `Candidate ${user.name} and all associated data permanently removed from portal.` });
  } catch (err) {
    console.error("[Users] Reject error:", err);
    res.status(500).json({ error: "Failed to remove candidate data from portal" });
  }
});

// DELETE /api/users/:id — Delete user and remove all associated data (SC+ only)
router.delete("/:id", authenticate, requireMinRole("STUDENT_COORDINATOR"), auditLog("USER_DELETED"), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (id === req.user!.userId) {
      res.status(400).json({ error: "Cannot delete your own account" });
      return;
    }

    await deleteUserCascade(id);
    await clearUsersCache();

    res.json({ success: true, message: `Candidate ${user.name} and all associated data permanently removed from portal.` });
  } catch (err) {
    console.error("[Users] Delete user error:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// PATCH /api/users/:id/role — Update user role (Faculty only)
router.patch("/:id/role", authenticate, requireRole("FACULTY", "STUDENT_COORDINATOR"), auditLog("USER_ROLE_UPDATED"), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles: Role[] = ["FACULTY", "STUDENT_COORDINATOR", "TECH", "CONTENT", "SOCIAL_MEDIA", "MEMBER", "GUEST"];
    if (!validRoles.includes(role)) {
      res.status(400).json({ error: "Invalid role" });
      return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role, isApproved: true },
      select: { id: true, name: true, email: true, role: true, isApproved: true },
    });

    await sendNotification({
      userId: id,
      type: "SYSTEM",
      title: "Role Updated",
      message: `Your role has been updated to ${role.replace("_", " ")}.`,
    });

    // Send role updated email (fire and forget)
    sendRoleUpdatedEmail(
      { name: updated.name, email: updated.email },
      role
    ).catch((err) => console.error("[Users] Role update email failed:", err));

    await clearUsersCache();

    res.json({ user: updated });
  } catch (err) {
    console.error("[Users] Role update error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/users/:id/deactivate — Deactivate user (Faculty only)
router.patch("/:id/deactivate", authenticate, requireRole("FACULTY", "STUDENT_COORDINATOR"), auditLog("USER_DEACTIVATED"), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (id === req.user!.userId) {
      res.status(400).json({ error: "Cannot deactivate your own account" });
      return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, name: true, email: true, isActive: true },
    });
    
    await clearUsersCache();
    
    res.json({ user: updated });
  } catch (err) {
    console.error("[Users] Deactivate error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/users/:id/activate — Re-activate user (Faculty only)
router.patch("/:id/activate", authenticate, requireRole("FACULTY", "STUDENT_COORDINATOR"), auditLog("USER_ACTIVATED"), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: true },
      select: { id: true, name: true, email: true, isActive: true },
    });
    
    await clearUsersCache();
    
    res.json({ user: updated });
  } catch (err) {
    console.error("[Users] Activate error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/users/profile — Update current user's profile
router.patch("/profile", authenticate, upload.single("avatar"), async (req: Request, res: Response) => {
  try {
    const { name, password, studentId, phone, department, institute, semester } = req.body;
    const userId = req.user!.userId;
    const updateData: any = {};

    if (name) updateData.name = name;
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }
    if (req.file) {
      updateData.avatarUrl = getUploadedFileUrl(req.file);
    }
    if (studentId !== undefined) {
      if (studentId) {
        const existingStudent = await prisma.user.findFirst({
          where: { studentId, NOT: { id: userId } }
        });
        if (existingStudent) {
          res.status(409).json({ error: "Student ID is already in use" });
          return;
        }
        updateData.studentId = studentId;
      } else {
        updateData.studentId = null;
      }
    }
    if (phone !== undefined) {
      if (phone && !/^\d{10}$/.test(phone)) {
        res.status(400).json({ error: "Mobile number must be exactly 10 digits" });
        return;
      }
      updateData.phone = phone || null;
    }
    if (department !== undefined) updateData.department = department || null;
    if (institute !== undefined) updateData.institute = institute || null;

    const currentUser = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (currentUser?.role === "FACULTY") {
      updateData.semester = null;
    } else if (semester !== undefined) {
      updateData.semester = semester || null;
    }

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ error: "No update fields provided" });
      return;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        role: true,
        studentId: true,
        phone: true,
        department: true,
        institute: true,
        semester: true,
      },
    });

    await prisma.auditLog.create({
      data: { action: "USER_PROFILE_UPDATED", userId },
    });

    await clearUsersCache();

    res.json({ user: updated });
  } catch (err) {
    console.error("[Users] Profile update error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/users/audit-logs — List system audit logs (SC+/Tech)
router.get("/audit-logs", authenticate, requireMinRole("TECH"), async (req: Request, res: Response) => {
  try {
    const { action, outcome, page, limit } = req.query;
    const pageNum = page ? parseInt(page as string) : 1;
    const limitNum = limit ? parseInt(limit as string) : 50;

    const where: any = {};
    if (action) where.action = action as string;
    if (outcome) where.outcome = outcome as string;

    const total = await prisma.auditLog.count({ where });
    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    });

    res.json({
      logs,
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    console.error("[Users] Audit logs fetch error:", err);
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});

export default router;
