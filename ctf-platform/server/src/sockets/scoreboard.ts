// Created: 2026-08-07 | Modified: Initial creation — Chunk 6 Real-Time Engine

import { Namespace, Socket } from "socket.io";
import redis from "../lib/ctfRedis";

/**
 * Attaches real-time CTF events to the provided Socket.io namespace.
 */
export function setupScoreboardSockets(ctfNamespace: Namespace) {
  ctfNamespace.on("connection", (socket: Socket) => {
    console.log(`📡 [Socket.io] Client connected: ${socket.id}`);

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

    // ── Live Presence (Challenge Viewers) ────────────────────────
    // When a user opens a challenge modal, they emit this event.
    // We store it in Redis and broadcast the count.
    socket.on("viewChallenge", async (challengeId: string) => {
      if (!challengeId) return;
      
      const presenceKey = `ctf:presence:${challengeId}`;
      const room = `challenge:${challengeId}`;
      
      socket.join(room);
      
      // Add socket ID to a Redis Set to track active viewers
      await redis.sadd(presenceKey, socket.id);
      // Give it a 5-minute TTL so it automatically cleans up if the server crashes
      await redis.expire(presenceKey, 300); 

      // Broadcast current viewer count to everyone viewing this challenge
      const viewers = await redis.scard(presenceKey);
      ctfNamespace.to(room).emit("presenceUpdate", { challengeId, viewers });
    });

    // When they close the modal, they emit this event.
    socket.on("leaveChallenge", async (challengeId: string) => {
      if (!challengeId) return;
      
      const presenceKey = `ctf:presence:${challengeId}`;
      const room = `challenge:${challengeId}`;
      
      socket.leave(room);
      
      await redis.srem(presenceKey, socket.id);
      
      const viewers = await redis.scard(presenceKey);
      ctfNamespace.to(room).emit("presenceUpdate", { challengeId, viewers });
    });

    // ── Handle Disconnects ───────────────────────────────────────
    socket.on("disconnect", async () => {
      console.log(`📡 [Socket.io] Client disconnected: ${socket.id}`);
      // Note: Socket.io automatically removes the socket from all rooms.
      // Cleaning up Redis presence for every challenge they might be viewing
      // would require tracking their viewed challenges in memory or Redis.
      // For now, the 5-minute TTL on the presence key serves as a fallback,
      // and active users will emit 'viewChallenge' again if they are still there.
    });
  });
}
