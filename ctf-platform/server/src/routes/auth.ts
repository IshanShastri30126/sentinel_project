// ==========================================================
// OAuth Callback Route — CTF Wars (OAuth Client)
// ==========================================================
// Receives the authorization code from Chakravyuh's redirect,
// exchanges it server-to-server for a JWT, verifies it, and
// sets an HttpOnly cookie for the CTF Wars domain.
//
// Also handles:
//   - Direct visits without a session → redirect to Chakravyuh
//   - Login status check for the frontend
// ==========================================================

import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";

const router = Router();

const CHAKRAVYUH_API_URL = process.env.CHAKRAVYUH_API_URL || "http://localhost:4000/api";
const CHAKRAVYUH_LOGIN_URL = process.env.CHAKRAVYUH_LOGIN_URL || "http://localhost:3000/auth";
const JWT_SECRET = process.env.JWT_SECRET || "";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3001";

// ─── GET /api/auth/callback?code=xxx ───────────────────────
// Step 5-10 in the OAuth flow:
//   5. Browser arrives here with ?code=xxx from Chakravyuh
//   6. We POST the code to Chakravyuh's /api/oauth/token (server-to-server)
//   7-8. Chakravyuh validates and returns a signed JWT
//   9. We verify the JWT signature using our shared JWT_SECRET
//   10. Set HttpOnly cookie + redirect to /lobby
// ────────────────────────────────────────────────────────────

router.get("/callback", async (req: Request, res: Response) => {
    try {
        const { code } = req.query;

        if (!code || typeof code !== "string") {
            // No code provided — redirect to Chakravyuh login
            res.redirect(302, CHAKRAVYUH_LOGIN_URL);
            return;
        }

        // ── Step 6: Server-to-Server Token Exchange ─────────────
        // This is the critical part: CTF Wars' Node.js server
        // makes a direct HTTP POST to Chakravyuh's backend.
        // The user's browser is NOT involved in this step.
        const tokenResponse = await fetch(`${CHAKRAVYUH_API_URL}/oauth/token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code }),
        });

        if (!tokenResponse.ok) {
            const error = await tokenResponse.json().catch(() => ({}));
            console.error("[Auth] Token exchange failed:", error);
            // Code was invalid/expired/replayed — send to Chakravyuh to re-authenticate
            res.redirect(302, `${CHAKRAVYUH_LOGIN_URL}?error=auth_failed`);
            return;
        }

        const { access_token } = (await tokenResponse.json()) as { access_token: string };

        // ── Step 9: Verify the JWT ──────────────────────────────
        // Even though Chakravyuh signed it, we verify locally to
        // ensure nobody tampered with it in transit.
        let decoded: any;
        try {
            decoded = jwt.verify(access_token, JWT_SECRET);
        } catch (jwtErr) {
            console.error("[Auth] JWT verification failed:", jwtErr);
            res.redirect(302, `${CHAKRAVYUH_LOGIN_URL}?error=invalid_token`);
            return;
        }

        // Validate the token has the CTF_SSO type claim
        if (decoded.type !== "CTF_SSO") {
            console.error("[Auth] Invalid token type:", decoded.type);
            res.redirect(302, `${CHAKRAVYUH_LOGIN_URL}?error=invalid_token_type`);
            return;
        }

        // ── Step 10: Issue CTF Wars Session Cookie ──────────────
        // Generate a fresh, long-lived CTF Wars token (not the 5-min SSO one)
        const ctfToken = jwt.sign(
            {
                userId: decoded.userId,
                email: decoded.email,
                role: decoded.role,
                name: decoded.name,
            },
            JWT_SECRET,
            { expiresIn: "24h" } as jwt.SignOptions
        );

        const isProduction = process.env.NODE_ENV === "production";
        res.cookie("token", ctfToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            path: "/",
        });

        // Redirect to the CTF Wars frontend lobby
        res.redirect(302, `${CLIENT_URL}/lobby`);
    } catch (err) {
        console.error("[Auth] Callback error:", err);
        res.redirect(302, `${CHAKRAVYUH_LOGIN_URL}?error=server_error`);
    }
});

// ─── GET /api/auth/login ───────────────────────────────────
// If a user visits CTF Wars directly without a session,
// the frontend redirects them here. This route bounces them
// to Chakravyuh's OAuth authorize endpoint.
// ────────────────────────────────────────────────────────────

router.get("/login", (_req: Request, res: Response) => {
    res.redirect(302, `${CHAKRAVYUH_API_URL}/oauth/authorize`);
});

// ─── GET /api/auth/me ──────────────────────────────────────
// Returns the current user's identity from their CTF Wars cookie.
// The frontend calls this on mount to check login status.
// ────────────────────────────────────────────────────────────

router.get("/me", (req: Request, res: Response) => {
    try {
        const token = req.cookies?.token;
        if (!token) {
            res.status(401).json({ authenticated: false });
            return;
        }

        const decoded = jwt.verify(token, JWT_SECRET) as any;
        res.json({
            authenticated: true,
            user: {
                userId: decoded.userId,
                email: decoded.email,
                role: decoded.role,
                name: decoded.name,
            },
        });
    } catch {
        res.status(401).json({ authenticated: false });
    }
});

// ─── POST /api/auth/logout ─────────────────────────────────
// Clears the CTF Wars cookie.
// ────────────────────────────────────────────────────────────

router.post("/logout", (_req: Request, res: Response) => {
    res.clearCookie("token", { path: "/" });
    res.json({ success: true, message: "Logged out from CTF Wars" });
});

export default router;
