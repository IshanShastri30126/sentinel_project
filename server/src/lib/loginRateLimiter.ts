import { redisGet, redisSet, redisDel } from "./redis";
import { FirewallPolicyManager } from "./firewallRules";

interface BlockRecord {
  attempts: number;
  blockedUntil: number; // ms timestamp
  tier: 1 | 2;
}

const memoryStore = new Map<string, BlockRecord>();

// Helper to format remaining time nicely
export function formatRemainingTime(seconds: number): string {
  if (seconds <= 0) return "0 seconds";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs} hour${hrs > 1 ? "s" : ""} ${mins} minute${mins !== 1 ? "s" : ""}`;
  }
  if (mins > 0) {
    return `${mins} minute${mins > 1 ? "s" : ""} ${secs} second${secs !== 1 ? "s" : ""}`;
  }
  return `${secs} second${secs !== 1 ? "s" : ""}`;
}

async function getRecord(key: string): Promise<BlockRecord> {
  const mem = memoryStore.get(key);
  if (mem) {
    return mem;
  }
  const redisVal = await redisGet(`rate_limit:${key}`);
  if (redisVal) {
    try {
      const parsed = JSON.parse(redisVal);
      memoryStore.set(key, parsed);
      return parsed;
    } catch {
      // Ignore parse error
    }
  }
  return { attempts: 0, blockedUntil: 0, tier: 1 };
}

async function setRecord(key: string, record: BlockRecord, ttlSeconds: number): Promise<void> {
  memoryStore.set(key, record);
  await redisSet(`rate_limit:${key}`, JSON.stringify(record), ttlSeconds);
}

async function deleteRecord(key: string): Promise<void> {
  memoryStore.delete(key);
  await redisDel(`rate_limit:${key}`);
}

export class LoginRateLimiter {
  /**
   * Check if IP or Email is currently blocked (Parallel Redis lookups)
   */
  static async checkBlockStatus(ip: string, email?: string) {
    const now = Date.now();
    const ipKey = `ip:${ip}`;
    const emailKey = email ? `email:${email.toLowerCase().trim()}` : null;

    // Parallel fetch from Redis/Memory
    const [ipRecord, emailRecord] = await Promise.all([
      getRecord(ipKey),
      emailKey ? getRecord(emailKey) : Promise.resolve(null),
    ]);

    // Check IP block
    if (ipRecord.blockedUntil > now) {
      const remainingSec = Math.ceil((ipRecord.blockedUntil - now) / 1000);
      return {
        blocked: true,
        reason: "IP_BLOCKED",
        remainingSeconds: remainingSec,
        tier: ipRecord.tier,
        retryAfterFormatted: formatRemainingTime(remainingSec),
        message: `Too many failed login attempts from your IP. Access blocked for ${formatRemainingTime(remainingSec)}.`,
      };
    }

    // Check Email block
    if (emailRecord && emailRecord.blockedUntil > now) {
      const remainingSec = Math.ceil((emailRecord.blockedUntil - now) / 1000);
      return {
        blocked: true,
        reason: "ACCOUNT_BLOCKED",
        remainingSeconds: remainingSec,
        tier: emailRecord.tier,
        retryAfterFormatted: formatRemainingTime(remainingSec),
        message: `Too many failed login attempts for this account. Access blocked for ${formatRemainingTime(remainingSec)}.`,
      };
    }

    // If block period has expired, check if they are at 4 attempts (Tier 1 expired -> 1 chance remaining)
    const currentAttempts = Math.max(
      ipRecord.blockedUntil > 0 && ipRecord.attempts >= 4 ? 4 : ipRecord.attempts,
      emailRecord && emailRecord.blockedUntil > 0 && emailRecord.attempts >= 4 ? 4 : emailRecord?.attempts || 0
    );

    return {
      blocked: false,
      attempts: currentAttempts,
      remainingAttempts: Math.max(0, 4 - currentAttempts),
    };
  }

  /**
   * Record a failed login attempt (Parallel execution)
   */
  static async recordFailure(ip: string, email?: string) {
    const now = Date.now();
    const ipKey = `ip:${ip}`;
    const emailKey = email ? `email:${email.toLowerCase().trim()}` : null;

    const keys = [ipKey];
    if (emailKey) keys.push(emailKey);

    let maxBlockedUntil = 0;
    let maxTier: number = 1;
    let maxAttempts = 0;

    await Promise.all(
      keys.map(async (key) => {
        const rec = await getRecord(key);

        let prevAttempts = rec.attempts;
        if (rec.blockedUntil > 0 && rec.blockedUntil <= now && prevAttempts >= 4) {
          prevAttempts = 4;
        }

        const newAttempts = prevAttempts + 1;
        let blockedUntil = 0;
        let tier: 1 | 2 = 1;
        let ttl = 24 * 3600;

        if (newAttempts < 4) {
          blockedUntil = 0;
        } else if (newAttempts === 4) {
          blockedUntil = now + 20 * 60 * 1000;
          tier = 1;
          ttl = 25 * 60;
        } else {
          blockedUntil = now + 5 * 60 * 60 * 1000;
          tier = 2;
          ttl = 6 * 3600;
        }

        const updatedRecord: BlockRecord = {
          attempts: newAttempts,
          blockedUntil,
          tier,
        };

        await setRecord(key, updatedRecord, ttl);

        if (blockedUntil > now && blockedUntil > maxBlockedUntil) {
          maxBlockedUntil = blockedUntil;
          maxTier = tier;
        }
        if (newAttempts > maxAttempts) {
          maxAttempts = newAttempts;
        }
      })
    );

    if (maxBlockedUntil > now) {
      const remainingSec = Math.ceil((maxBlockedUntil - now) / 1000);

      // On Tier 2 lockout (5+ failed attempts), automatically register public IP into Firewall Ban List
      if (maxTier === 2 && ip && ip !== "127.0.0.1") {
        FirewallPolicyManager.blockPublicIp(ip, "Exceeded 5 failed login attempts").catch(() => {});
      }

      return {
        blocked: true,
        remainingSeconds: remainingSec,
        tier: maxTier,
        attempts: maxAttempts,
        retryAfterFormatted: formatRemainingTime(remainingSec),
        message: maxTier === 1
          ? `4 failed login attempts reached. Your access is blocked for 20 minutes.`
          : `Final attempt failed. Your public IP has been blocked for 5 hours by firewall policy.`,
      };
    }


    const remainingAttempts = Math.max(0, 4 - maxAttempts);
    return {
      blocked: false,
      attempts: maxAttempts,
      remainingAttempts,
      message: `Invalid credentials. ${remainingAttempts} attempt${remainingAttempts !== 1 ? "s" : ""} remaining before 20-minute lockout.`,
    };
  }

  /**
   * Record a successful login attempt (reset counter & blocks in parallel)
   */
  static async recordSuccess(ip: string, email?: string) {
    const ipKey = `ip:${ip}`;
    const promises: Promise<void>[] = [deleteRecord(ipKey)];

    if (email) {
      const emailKey = `email:${email.toLowerCase().trim()}`;
      promises.push(deleteRecord(emailKey));
    }

    await Promise.all(promises);
  }
}
