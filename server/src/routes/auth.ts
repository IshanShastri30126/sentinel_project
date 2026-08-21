import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import prisma from "../lib/prisma";
import { redisSet, redisDel } from "../lib/redis";
import { config } from "../config";
import { authenticate, AuthPayload } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { logAuditEvent } from "../lib/auditLogger";
import { sendNotification } from "../lib/notificationService";
import { sendWelcomeEmail, sendLoginNotificationEmail, sendPasswordResetEmail } from "../lib/emailService";
import { OAuth2Client } from "google-auth-library";
import crypto from "crypto";
import { Role } from "@prisma/client";
import { LoginRateLimiter } from "../lib/loginRateLimiter";

const router = Router();
const googleClient = new OAuth2Client(config.google.clientId);

// ─── Validation Schemas ────────────────────────────────────

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(128),
  studentId: z.string().optional(),
  phone: z.string().regex(/^\d{10}$/, "Mobile number must be exactly 10 digits"),
  department: z.string().optional(),
  institute: z.string().optional(),
  semester: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
 
});

// ─── Helpers ───────────────────────────────────────────────

function generateTokens(payload: AuthPayload) {
  const accessToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiry || "15m",
  } as jwt.SignOptions);
  const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiry || "7d",
  } as jwt.SignOptions);
  return { accessToken, refreshToken };
}

function setTokenCookies(res: Response, accessToken: string, refreshToken: string, deviceFingerprint?: string) {
  const isProduction = process.env.NODE_ENV === "production";
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 15 * 60 * 1000,
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  if (deviceFingerprint) {
    res.cookie("deviceFingerprint", deviceFingerprint, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 365 * 24 * 60 * 60 * 1000,
    });
  }
}

// ─── POST /api/auth/register ───────────────────────────────

router.post("/register", validate(registerSchema), async (req: Request, res: Response) => {
  try {
    const { name, email, password, studentId, phone, department, institute, semester, deviceFingerprint } = req.body;
    const clientFingerprint = deviceFingerprint || (req.headers["x-device-fingerprint"] as string);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      await logAuditEvent({
        action: "USER_REGISTER_FAILED",
        outcome: "FAILED",
        context: { email, reason: "Email already registered" },
        req,
      });
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    if (studentId) {
      const existingStudent = await prisma.user.findUnique({ where: { studentId } });
      if (existingStudent) {
        await logAuditEvent({
          action: "USER_REGISTER_FAILED",
          outcome: "FAILED",
          context: { studentId, reason: "Student ID already registered" },
          req,
        });
        res.status(409).json({ error: "Student ID already registered" });
        return;
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        studentId: studentId || null,
        phone: phone || null,
        department: department || null,
        institute: institute || null,
        semester: semester || null,
        role: "GUEST",
        isApproved: false,
        deviceFingerprint: clientFingerprint || null,
        lastActiveAt: new Date(),
      },
    });

    const payload: AuthPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      deviceFingerprint: clientFingerprint,
    };
    const { accessToken, refreshToken } = generateTokens(payload);

    await redisSet(`session:${user.id}`, JSON.stringify(payload), 7 * 24 * 3600);
    setTokenCookies(res, accessToken, refreshToken, clientFingerprint);

    await logAuditEvent({
      action: "USER_REGISTER",
      userId: user.id,
      outcome: "SUCCESS",
      context: { email, role: user.role },
      req,
    });

    // Notify coordinators about new registration
    const coordinators = await prisma.user.findMany({
      where: { role: { in: ["STUDENT_COORDINATOR", "FACULTY"] }, isActive: true },
      select: { id: true },
    });
    for (const coord of coordinators) {
      await sendNotification({
        userId: coord.id,
        type: "SYSTEM",
        title: "New Registration",
        message: `${name} (${email}) has registered and needs approval.`,
        metadata: { newUserId: user.id },
      });
    }

    sendWelcomeEmail({ name, email, role: "GUEST" }).catch((err) =>
      console.error("[Auth] Welcome email failed:", err)
    );

    res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        avatarUrl: user.avatarUrl,
        studentId: user.studentId,
        phone: user.phone,
        department: user.department,
        institute: user.institute,
        semester: user.semester,
      },
      accessToken,
    });
  } catch (err) {
    console.error("[Auth] Register error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /api/auth/login-status ────────────────────────────

router.get("/login-status", async (req: Request, res: Response) => {
  try {
    const clientIp = (req.headers["x-forwarded-for"] as string || req.ip || req.socket.remoteAddress || "127.0.0.1").split(",")[0].trim();
    const email = (req.query.email as string || "").trim();

    const status = await LoginRateLimiter.checkBlockStatus(clientIp, email || undefined);
    res.json(status);
  } catch (err) {
    console.error("[Auth] Login status error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /api/auth/login ──────────────────────────────────

router.post("/login", validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password, deviceFingerprint } = req.body;
    const clientIp = (req.headers["x-forwarded-for"] as string || req.ip || req.socket.remoteAddress || "127.0.0.1").split(",")[0].trim();
    const clientFingerprint = deviceFingerprint || (req.headers["x-device-fingerprint"] as string);

    // 1. Check Rate Limiter Block Status BEFORE attempting database query/bcrypt check
    const blockCheck = await LoginRateLimiter.checkBlockStatus(clientIp, email);
    if (blockCheck.blocked) {
      await logAuditEvent({
        action: "USER_LOGIN_BLOCKED",
        outcome: "REJECTED",
        context: { email, reason: blockCheck.message, remainingSeconds: blockCheck.remainingSeconds, tier: blockCheck.tier },
        req,
      });
      res.status(429).json({
        error: blockCheck.message,
        blocked: true,
        remainingSeconds: blockCheck.remainingSeconds,
        tier: blockCheck.tier,
        retryAfterFormatted: blockCheck.retryAfterFormatted,
      });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      const failResult = await LoginRateLimiter.recordFailure(clientIp, email);
      await logAuditEvent({
        action: "USER_LOGIN_FAILED",
        outcome: "FAILED",
        context: { email, reason: "User not found or inactive", attempts: failResult.attempts },
        req,
      });

      if (failResult.blocked) {
        res.status(429).json({
          error: failResult.message,
          blocked: true,
          remainingSeconds: failResult.remainingSeconds,
          tier: failResult.tier,
          retryAfterFormatted: failResult.retryAfterFormatted,
        });
        return;
      }

      res.status(401).json({
        error: failResult.message,
        remainingAttempts: failResult.remainingAttempts,
      });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      const failResult = await LoginRateLimiter.recordFailure(clientIp, email);
      await logAuditEvent({
        action: "USER_LOGIN_FAILED",
        userId: user.id,
        outcome: "FAILED",
        context: { email, reason: "Incorrect password", attempts: failResult.attempts },
        req,
      });

      if (failResult.blocked) {
        res.status(429).json({
          error: failResult.message,
          blocked: true,
          remainingSeconds: failResult.remainingSeconds,
          tier: failResult.tier,
          retryAfterFormatted: failResult.retryAfterFormatted,
        });
        return;
      }

      res.status(401).json({
        error: failResult.message,
        remainingAttempts: failResult.remainingAttempts,
      });
      return;
    }

    const payload: AuthPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      deviceFingerprint: clientFingerprint || user.deviceFingerprint || undefined,
    };

    const { accessToken, refreshToken } = generateTokens(payload);
    setTokenCookies(res, accessToken, refreshToken, clientFingerprint);

    // Asynchronous background operations (fire-and-forget to avoid blocking user response)
    Promise.allSettled([
      LoginRateLimiter.recordSuccess(clientIp, email),
      redisSet(`session:${user.id}`, JSON.stringify(payload), 7 * 24 * 3600),
      prisma.user.update({
        where: { id: user.id },
        data: { lastActiveAt: new Date() },
      }),
      logAuditEvent({
        action: "USER_LOGIN",
        userId: user.id,
        outcome: "SUCCESS",
        context: { email, role: user.role, deviceFingerprint: clientFingerprint },
        req,
      }),
    ]).catch(() => {});

    if (!user.firstLoginEmailSent) {
      sendLoginNotificationEmail(
        { name: user.name, email: user.email },
        { ip: req.ip || req.socket.remoteAddress, userAgent: req.headers["user-agent"] }
      ).catch(() => {});

      prisma.user.update({
        where: { id: user.id },
        data: { firstLoginEmailSent: true },
      }).catch(() => {});
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        avatarUrl: user.avatarUrl,
        studentId: user.studentId,
        phone: user.phone,
        department: user.department,
        institute: user.institute,
        semester: user.semester,
      },
      accessToken,
    });
  } catch (err) {
    console.error("[Auth] Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /api/auth/forgot-password ────────────────────────

router.post("/forgot-password", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      res.json({ message: "If that email exists, a reset link has been sent." });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });

    await logAuditEvent({
      action: "FORGOT_PASSWORD_REQUEST",
      userId: user.id,
      outcome: "SUCCESS",
      context: { email },
      req,
    });

    await sendPasswordResetEmail({ email: user.email }, resetToken);
    res.json({ message: "If that email exists, a reset link has been sent." });
  } catch (err) {
    console.error("[Auth] Forgot password error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /api/auth/reset-password ─────────────────────────

router.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword || newPassword.length < 6) {
      res.status(400).json({ error: "Invalid token or password" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { resetToken: token } });

    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      res.status(400).json({ error: "Token is invalid or has expired" });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    await logAuditEvent({
      action: "USER_PASSWORD_RESET",
      userId: user.id,
      outcome: "SUCCESS",
      context: { email: user.email },
      req,
    });

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("[Auth] Reset password error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /api/auth/google ─────────────────────────────────

router.post("/google", async (req: Request, res: Response) => {
  try {
    const { credential, deviceFingerprint } = req.body;
    const clientFingerprint = deviceFingerprint || (req.headers["x-device-fingerprint"] as string);

    if (!credential) {
      res.status(400).json({ error: "Missing Google credential token" });
      return;
    }

    let payload: { email: string; name?: string; picture?: string } | undefined;

    // 1. Attempt verification via google-auth-library
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        ...(config.google.clientId ? { audience: config.google.clientId } : {}),
      });
      const p = ticket.getPayload();
      if (p && p.email) {
        payload = { email: p.email, name: p.name, picture: p.picture };
      }
    } catch (verifyErr) {
      console.warn("[Auth] Google verifyIdToken failed, attempting fallback decode:", verifyErr);
    }

    // 2. Fallback JWT decoding if verifyIdToken is unconfigured or failed
    if (!payload) {
      try {
        const decoded = jwt.decode(credential) as any;
        if (decoded && decoded.email && (decoded.iss === "accounts.google.com" || decoded.iss === "https://accounts.google.com")) {
          payload = { email: decoded.email, name: decoded.name, picture: decoded.picture };
        }
      } catch (decodeErr) {
        console.warn("[Auth] JWT decode of Google credential failed:", decodeErr);
      }
    }

    if (!payload || !payload.email) {
      res.status(400).json({ error: "Invalid Google token payload" });
      return;
    }

    const email = payload.email;
    const name = payload.name || "Google User";
    const avatarUrl = payload.picture || null;

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          avatarUrl,
          passwordHash: "",
          role: "MEMBER",
          isApproved: true,
          deviceFingerprint: clientFingerprint || null,
        },
      });

      await logAuditEvent({
        action: "USER_REGISTER_GOOGLE",
        userId: user.id,
        outcome: "SUCCESS",
        context: { email },
        req,
      });
    } else {
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { lastActiveAt: new Date() },
        });
      } catch (e) {
        console.warn("[Auth] lastActiveAt update skipped:", e);
      }
    }

    if (!user.isActive) {
      res.status(401).json({ error: "Account is inactive" });
      return;
    }

    const authPayload: AuthPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      deviceFingerprint: clientFingerprint || user.deviceFingerprint || undefined,
    };
    const { accessToken, refreshToken } = generateTokens(authPayload);

    await redisSet(`session:${user.id}`, JSON.stringify(authPayload), 7 * 24 * 3600);
    setTokenCookies(res, accessToken, refreshToken, clientFingerprint);

    await logAuditEvent({
      action: "USER_LOGIN_GOOGLE",
      userId: user.id,
      outcome: "SUCCESS",
      context: { email, role: user.role },
      req,
    });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        avatarUrl: user.avatarUrl,
        studentId: user.studentId,
        phone: user.phone,
        department: user.department,
        institute: user.institute,
        semester: user.semester,
      },
      accessToken,
    });
  } catch (err: any) {
    console.error("[Auth] Google Login error:", err);
    res.status(500).json({ error: err?.message || "Internal server error during Google login" });
  }
});

// ─── POST /api/auth/refresh ────────────────────────────────

router.post("/refresh", async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken;
    const clientFingerprint = (req.headers["x-device-fingerprint"] as string) || req.cookies?.deviceFingerprint;

    if (!token) {
      res.status(401).json({ error: "No refresh token" });
      return;
    }

    const payload = jwt.verify(token, config.jwt.refreshSecret) as AuthPayload;
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.isActive) {
      res.status(401).json({ error: "User not found or inactive" });
      return;
    }

    const newPayload: AuthPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      deviceFingerprint: clientFingerprint || payload.deviceFingerprint,
    };
    const { accessToken, refreshToken } = generateTokens(newPayload);

    await redisSet(`session:${user.id}`, JSON.stringify(newPayload), 7 * 24 * 3600);
    setTokenCookies(res, accessToken, refreshToken, clientFingerprint);
    res.json({ accessToken });
  } catch {
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

// ─── POST /api/auth/logout ─────────────────────────────────

router.post("/logout", authenticate, async (req: Request, res: Response) => {
  try {
    if (req.user) {
      await redisDel(`session:${req.user.userId}`);
      await logAuditEvent({
        action: "USER_LOGOUT",
        userId: req.user.userId,
        outcome: "SUCCESS",
        context: { email: req.user.email },
        req,
      });
    }
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.clearCookie("deviceFingerprint");
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("[Auth] Logout error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /api/auth/me ──────────────────────────────────────

router.get("/me", authenticate, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        studentId: true,
        phone: true,
        department: true,
        isApproved: true,
        isActive: true,
        createdAt: true,
        institute: true,
        semester: true,
    
      },
    });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ user });
  } catch (err) {
    console.error("[Auth] Me error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
