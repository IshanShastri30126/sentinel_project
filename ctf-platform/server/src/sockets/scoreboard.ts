// Created: 2026-08-07 | Modified: Initial creation — Chunk 6 Real-Time Engine

import { Namespace, Socket } from "socket.io";
import redis from "../lib/ctfRedis";

/**
 * Attaches real-time CTF events to the provided Socket.io namespace.
 */
export function setupScoreboardSockets(ctfNamespace: Namespace) {
  ctfNamespace.on("connection", (socket: Socket) => {
    console.log(`[WS] [Socket.io] Client connected: ${socket.id}`);

    // ── Join a Competition Room ──────────────────────────────────
    // Clients join this to receive leaderboard updates and admin freezes.
    socket.on("joinCompetition", (competitionId: string) => {
      if (!competitionId) return;
      const room = `competition:${competitionId}`;
      socket.join(room);
      console.log(`[Socket.io] Client ${socket.id} joined ${room}`);
    });

    // ── Leave a Competition Room ─────────────────────────────────
    socket.on("leaveCompetition", (competitionId: string) => {
      if (!competitionId) return;
      const room = `competition:${competitionId}`;
      socket.leave(room);
      console.log(`[Socket.io] Client ${socket.id} left ${room}`);
    });

    // In-memory fallback presence tracking for when Redis is unavailable (SEC-007 / REL-001)
    const memoryPresence = new Map<string, Set<string>>();

    // ── Live Presence (Challenge Viewers) ────────────────────────
    socket.on("viewChallenge", async (challengeId: string) => {
      if (!challengeId) return;
      
      const presenceKey = `ctf:presence:${challengeId}`;
      const room = `challenge:${challengeId}`;
      
      socket.join(room);
      
      let viewers = 0;
      if (redis && redis.status === "ready") {
        try {
          await redis.sadd(presenceKey, socket.id);
          await redis.expire(presenceKey, 300);
          viewers = await redis.scard(presenceKey);
        } catch (err) {
          console.warn("[WS] Redis presence update error:", err);
          let set = memoryPresence.get(challengeId);
          if (!set) {
            set = new Set<string>();
            memoryPresence.set(challengeId, set);
          }
          set.add(socket.id);
          viewers = set.size;
        }
      } else {
        let set = memoryPresence.get(challengeId);
        if (!set) {
          set = new Set<string>();
          memoryPresence.set(challengeId, set);
        }
        set.add(socket.id);
        viewers = set.size;
      }

      ctfNamespace.to(room).emit("presenceUpdate", { challengeId, viewers });
    });

    // When they close the modal, they emit this event.
    socket.on("leaveChallenge", async (challengeId: string) => {
      if (!challengeId) return;
      
      const presenceKey = `ctf:presence:${challengeId}`;
      const room = `challenge:${challengeId}`;
      
      socket.leave(room);
      
      let viewers = 0;
      if (redis && redis.status === "ready") {
        try {
          await redis.srem(presenceKey, socket.id);
          viewers = await redis.scard(presenceKey);
        } catch (err) {
          console.warn("[WS] Redis presence leave error:", err);
          const set = memoryPresence.get(challengeId);
          if (set) {
            set.delete(socket.id);
            viewers = set.size;
          }
        }
      } else {
        const set = memoryPresence.get(challengeId);
        if (set) {
          set.delete(socket.id);
          viewers = set.size;
        }
      }
      
      ctfNamespace.to(room).emit("presenceUpdate", { challengeId, viewers });
    });

    // ── Handle Disconnects ───────────────────────────────────────
    socket.on("disconnect", async () => {
      console.log(`[WS] [Socket.io] Client disconnected: ${socket.id}`);
      // Clean up in-memory presence sets on disconnect
      for (const [chId, set] of memoryPresence.entries()) {
        if (set.has(socket.id)) {
          set.delete(socket.id);
          ctfNamespace.to(`challenge:${chId}`).emit("presenceUpdate", { challengeId: chId, viewers: set.size });
        }
      }
    });
  });
}
