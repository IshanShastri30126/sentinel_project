// Created: 2026-08-07 | Modified: Initial creation — Chunk 6 Leaderboard Engine

import redis from "./ctfRedis";

/**
 * Increments a participant's score in the Redis Sorted Set.
 * @param competitionId The ID of the competition
 * @param participantId The ID of the participant
 * @param points The points to add
 */
export async function incrementUserScore(
  competitionId: string,
  participantId: string,
  points: number
): Promise<number> {
  const key = `ctf:leaderboard:${competitionId}`;
  
  // ZINCRBY automatically creates the member if it doesn't exist
  // and adds the points to their current score.
  // It returns the new score as a string.
  const newScore = await redis.zincrby(key, points, participantId);
  return parseFloat(newScore);
}

/**
 * Fetches the top ranked participants from the Redis Sorted Set.
 * @param competitionId The ID of the competition
 * @param limit How many participants to fetch (e.g., 50)
 * @returns Array of { participantId, score }
 */
export async function getTopLeaderboard(
  competitionId: string,
  limit: number = 100
): Promise<{ participantId: string; score: number }[]> {
  const key = `ctf:leaderboard:${competitionId}`;

  // ZREVRANGE fetches highest scores first.
  // WITHSCORES returns a flat array: [id1, score1, id2, score2, ...]
  const results = await redis.zrevrange(key, 0, limit - 1, "WITHSCORES");

  const leaderboard: { participantId: string; score: number }[] = [];
  
  // Parse the flat array into an array of objects
  for (let i = 0; i < results.length; i += 2) {
    leaderboard.push({
      participantId: results[i],
      score: parseFloat(results[i + 1]),
    });
  }

  return leaderboard;
}

/**
 * Gets a specific participant's rank and score from the Redis Sorted Set.
 * @param competitionId The ID of the competition
 * @param participantId The ID of the participant
 * @returns { rank: number, score: number } or null if not on leaderboard
 */
export async function getUserRankAndScore(
  competitionId: string,
  participantId: string
): Promise<{ rank: number; score: number } | null> {
  const key = `ctf:leaderboard:${competitionId}`;

  // Fetch rank and score concurrently
  const [rank, scoreStr] = await Promise.all([
    redis.zrevrank(key, participantId),
    redis.zscore(key, participantId),
  ]);

  if (rank === null || scoreStr === null) {
    return null;
  }

  return {
    rank: rank + 1, // 0-indexed in Redis, we want 1-indexed for display
    score: parseFloat(scoreStr),
  };
}
