// ==========================================================
// OAuth 2.0 Authorization Code Routes — Chakravyuh (IdP)
// ==========================================================
// These routes allow CTF Wars to authenticate users via Chakravyuh
// using the industry-standard Authorization Code flow.
//
// Flow:
//   1. User clicks "Enter CTF Wars" → GET /api/oauth/authorize
//   2. Chakravyuh verifies session, generates auth_code, redirects to CTF Wars
//   3. CTF Wars backend calls POST /api/oauth/token with the code
//   4. Chakravyuh validates code, returns signed JWT
//   5. CTF Wars sets its own HttpOnly cookie
// ==========================================================

import { Router, Request, Response } from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";
import { config } from "../config";
import { authenticate } from "../middlewares/auth";
import { logAuditEvent } from "../lib/auditLogger";

const router = Router();

// ─── GET /api/oauth/authorize ──────────────────────────────
// The user's browser visits this URL (via a link/button on the
// Chakravyuh dashboard). If they have a valid Chakravyuh session,
// we generate a single-use authorization code and redirect them
// to CTF Wars with that code in the URL.
//
// Query params:
//   redirect_uri (optional) — where to redirect on CTF Wars side
//     defaults to CTF_WARS_URL/api/auth/callback
// ────────────────────────────────────────────────────────────

router.get("/authorize", authenticate, async (req: Request, res: Response) => {
    try {
        const user = req.user!;
        const rawRedirectUri = (req.query.redirect_uri as string) || `${config.ctfWarsUrl}/api/auth/callback`;

        // ── Open Redirect & SSRF Defense ─────────────────────────────────────
        // Validate redirect_uri to ensure it only points to trusted endpoints
        let validRedirectUri = `${config.ctfWarsUrl}/api/auth/callback`;
        try {
            const parsedUri = new URL(rawRedirectUri);
            const clientParsed = new URL(config.clientUrl.split(",")[0].trim() || "http://localhost:3000");
            const ctfParsed = new URL(config.ctfWarsUrl || "http://localhost:3001");

            const isAllowedHost =
                parsedUri.host === ctfParsed.host ||
                parsedUri.host === clientParsed.host ||
                parsedUri.hostname === "localhost" ||
                parsedUri.hostname === "127.0.0.1" ||
                parsedUri.hostname.endsWith(".vercel.app");

            if (isAllowedHost && (parsedUri.protocol === "http:" || parsedUri.protocol === "https:")) {
                validRedirectUri = rawRedirectUri;
            } else {
                console.warn(`[OAuth] Disallowed redirect_uri rejected: ${rawRedirectUri}`);
            }
        } catch {
            validRedirectUri = `${config.ctfWarsUrl}/api/auth/callback`;
        }

        // Generate a cryptographically secure 64-byte random authorization code
        const code = crypto.randomBytes(64).toString("hex");

        // Store in DB with 60-second expiry (single-use, will be deleted on exchange)
        await (prisma as any).oAuthCode.create({
            data: {
                code,
                userId: user.userId,
                expiresAt: new Date(Date.now() + 60 * 1000), // 60 seconds
            },
        });

        // Clean up expired codes (fire-and-forget, keeps DB tidy)
        (prisma as any).oAuthCode
            .deleteMany({ where: { expiresAt: { lt: new Date() } } })
            .catch(() => { });

        await logAuditEvent({
            action: "OAUTH_AUTHORIZE",
            userId: user.userId,
            outcome: "SUCCESS",
            context: { redirectUri: validRedirectUri, targetApp: "ctf-wars" },
            req,
        });

        // Redirect user's browser to CTF Wars with the authorization code
        const redirectUrl = `${validRedirectUri}?code=${code}`;
        res.redirect(302, redirectUrl);
    } catch (err) {
        console.error("[OAuth] Authorize error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ─── POST /api/oauth/token ─────────────────────────────────
// Server-to-server endpoint. CTF Wars' backend sends the
// authorization code here to exchange it for a signed JWT.
//
// This is the CRITICAL security boundary:
//   ✅ Code must exist in DB
//   ✅ Code must not be expired (60s TTL)
//   ✅ Code must not have been used before
//   ✅ Code is deleted immediately after use (single-use)
//   ✅ Returns a short-lived JWT (5 minutes) signed with shared secret
// ────────────────────────────────────────────────────────────

router.post("/token", async (req: Request, res: Response) => {
    try {
        const { code } = req.body;

        if (!code || typeof code !== "string") {
            res.status(400).json({ error: "Authorization code is required" });
            return;
        }

        // Look up the code in the database
        const oauthCode = await (prisma as any).oAuthCode.findUnique({
            where: { code },
            include: { user: { select: { id: true, email: true, role: true, isActive: true, name: true } } },
        });

        // Validate: code exists
        if (!oauthCode) {
            await logAuditEvent({
                action: "OAUTH_TOKEN_EXCHANGE_FAILED",
                outcome: "FAILED",
                context: { reason: "Code not found (possibly replayed)" },
                req,
            });
            res.status(401).json({ error: "Invalid authorization code" });
            return;
        }

        // Validate: code not expired
        if (oauthCode.expiresAt < new Date()) {
            // Delete the expired code
            await (prisma as any).oAuthCode.delete({ where: { id: oauthCode.id } }).catch(() => { });
            await logAuditEvent({
                action: "OAUTH_TOKEN_EXCHANGE_FAILED",
                userId: oauthCode.userId,
                outcome: "FAILED",
                context: { reason: "Code expired" },
                req,
            });
            res.status(401).json({ error: "Authorization code has expired" });
            return;
        }

        // Validate: code not already used (defense-in-depth)
        if (oauthCode.used) {
            // Potential replay attack — delete the code and log as CRITICAL
            await (prisma as any).oAuthCode.delete({ where: { id: oauthCode.id } }).catch(() => { });
            await logAuditEvent({
                action: "OAUTH_REPLAY_ATTACK_DETECTED",
                userId: oauthCode.userId,
                outcome: "FAILED",
                context: { reason: "Code already used — possible replay attack" },
                req,
            });
            res.status(401).json({ error: "Authorization code already used" });
            return;
        }

        // Validate: user is still active
        if (!oauthCode.user.isActive) {
            await (prisma as any).oAuthCode.delete({ where: { id: oauthCode.id } }).catch(() => { });
            res.status(401).json({ error: "User account is inactive" });
            return;
        }

        // ── BURN THE CODE (single-use) ──────────────────────────
        // Delete immediately so it can NEVER be replayed
        await (prisma as any).oAuthCode.delete({ where: { id: oauthCode.id } });

        // Generate a short-lived JWT (5 minutes) for CTF Wars
        // This token has the `type: 'CTF_SSO'` claim to prevent
        // it from being used as a regular Chakravyuh session token
        const ssoToken = jwt.sign(
            {
                userId: oauthCode.user.id,
                email: oauthCode.user.email,
                role: oauthCode.user.role,
                name: oauthCode.user.name,
                type: "CTF_SSO", // This claim distinguishes it from regular tokens
            },
            config.jwt.secret,
            { expiresIn: "5m" } as jwt.SignOptions
        );

        await logAuditEvent({
            action: "OAUTH_TOKEN_EXCHANGE",
            userId: oauthCode.userId,
            outcome: "SUCCESS",
            context: { targetApp: "ctf-wars" },
            req,
        });

        res.json({
            access_token: ssoToken,
            token_type: "Bearer",
            expires_in: 300, // 5 minutes in seconds
        });
    } catch (err) {
        console.error("[OAuth] Token exchange error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
