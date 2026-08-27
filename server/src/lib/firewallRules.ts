import prisma from "./prisma";
import { redisGet, redisSet, redisDel } from "./redis";

export type FirewallAction = "BLOCK" | "CHALLENGE" | "RATE_LIMIT" | "LOG_ONLY" | "ALLOW";
export type FirewallRuleCategory = "SQLI" | "XSS" | "BRUTE_FORCE" | "PATH_TRAVERSAL" | "BAD_BOT" | "DOS" | "GEO_CIDR" | "CUSTOM";

export interface FirewallRule {
  id: string;
  name: string;
  category: FirewallRuleCategory;
  description: string;
  action: FirewallAction;
  enabled: boolean;
  pattern?: string; // Regex pattern string or condition
  target: "BODY" | "QUERY" | "PATH" | "HEADER" | "IP_CIDR" | "USER_AGENT" | "ALL";
  severity: "INFO" | "WARN" | "CRITICAL" | "EMERGENCY" | "SECURITY_BLOCK";
  hitsCount: number;
  lastTriggeredAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Default Level 2 Pre-configured Policies
const DEFAULT_FIREWALL_RULES: FirewallRule[] = [
  {
    id: "FW-RULE-001",
    name: "SQL Injection Deep Inspection (Level 2)",
    category: "SQLI",
    description: "Blocks SQL syntax manipulation, UNION injections, comment truncations, and stacked queries.",
    action: "BLOCK",
    enabled: true,
    pattern: "('|\")?\\s*(or|and)\\s+['\"\\d]|union\\s+(all\\s+)?select|(drop|truncate|delete\\s+from|insert\\s+into|update\\s+\\w+\\s+set)\\s+\\w|exec\\s*\\(|xp_cmdshell|(--|#)\\s*$",
    target: "ALL",
    severity: "SECURITY_BLOCK",
    hitsCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "FW-RULE-002",
    name: "Cross-Site Scripting (XSS) & Event Probes",
    category: "XSS",
    description: "Detects inline script tags, javascript: pseudo-protocols, and malicious DOM event handler attributes.",
    action: "BLOCK",
    enabled: true,
    pattern: "<script[\\s>]|javascript\\s*:|vbscript\\s*:|on(?:error|load|click|mouseover|focus|blur|input|change|submit|reset|keydown|keyup)\\s*=|data\\s*:\\s*text\\/html",
    target: "ALL",
    severity: "SECURITY_BLOCK",
    hitsCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "FW-RULE-003",
    name: "Path Traversal & System File Probes",
    category: "PATH_TRAVERSAL",
    description: "Blocks directory climbing (../), encoded null-byte escapes (%00, %2e%2e), and sensitive config probes.",
    action: "BLOCK",
    enabled: true,
    pattern: "\\.\\.[\\/\\\\]|%2e%2e[\\/\\\\%]|%252e%252e|\\x00|%00|etc\\/passwd|windows\\/win\\.ini|boot\\.ini",
    target: "ALL",
    severity: "SECURITY_BLOCK",
    hitsCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "FW-RULE-004",
    name: "Public Network IP Brute Force Defense",
    category: "BRUTE_FORCE",
    description: "Enforces automatic lockout when multiple credential failures originate from the same public IP address.",
    action: "BLOCK",
    enabled: true,
    target: "IP_CIDR",
    severity: "SECURITY_BLOCK",
    hitsCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "FW-RULE-005",
    name: "Cloud Metadata (SSRF) & Internal Subnet Shield",
    category: "DOS",
    description: "Prevents Server-Side Request Forgery against cloud metadata (169.254.169.254) and internal loopback escapes.",
    action: "BLOCK",
    enabled: true,
    pattern: "169\\.254\\.169\\.254|file:\\/\\/|gopher:\\/\\/|dict:\\/\\/",
    target: "ALL",
    severity: "EMERGENCY",
    hitsCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "FW-RULE-006",
    name: "Automated Attack Tools & Malicious User-Agent Blacklist",
    category: "BAD_BOT",
    description: "Blocks automated scanners like sqlmap, nikto, dirbuster, gobuster, nmap, and masscan.",
    action: "BLOCK",
    enabled: true,
    pattern: "sqlmap|nikto|dirbuster|gobuster|nmap|masscan|wpscan|hydra|acunetix|nessus",
    target: "USER_AGENT",
    severity: "CRITICAL",
    hitsCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "FW-RULE-007",
    name: "NoSQL & MongoDB Query Operator Injection",
    category: "SQLI",
    description: "Blocks MongoDB aggregation and filter operator injection payloads ($where, $gt, $ne, $regex).",
    action: "BLOCK",
    enabled: true,
    pattern: "\\$(where|gt|lt|ne|gte|lte|in|nin|regex|exists|type|mod|all|size|elemMatch)\\b",
    target: "BODY",
    severity: "CRITICAL",
    hitsCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const SETTINGS_KEY = "FIREWALL_RULES_POLICY_L2";
let cachedRules: FirewallRule[] | null = null;
let lastCacheUpdate = 0;
const CACHE_TTL_MS = 15 * 1000; // 15s memory cache

export class FirewallPolicyManager {
  /**
   * Get all Level 2 Firewall Rules
   */
  static async getRules(): Promise<FirewallRule[]> {
    const now = Date.now();
    if (cachedRules && now - lastCacheUpdate < CACHE_TTL_MS) {
      return cachedRules;
    }

    try {
      const setting = await prisma.clubSettings.findUnique({ where: { key: SETTINGS_KEY } });
      if (setting && Array.isArray(setting.value) && setting.value.length > 0) {
        cachedRules = setting.value as unknown as FirewallRule[];
      } else {
        // Initialize with default rules
        cachedRules = DEFAULT_FIREWALL_RULES;
        await prisma.clubSettings.upsert({
          where: { key: SETTINGS_KEY },
          update: { value: DEFAULT_FIREWALL_RULES as any },
          create: { key: SETTINGS_KEY, value: DEFAULT_FIREWALL_RULES as any },
        });
      }
    } catch {
      cachedRules = DEFAULT_FIREWALL_RULES;
    }

    lastCacheUpdate = now;
    return cachedRules;
  }

  /**
   * Add a new dynamic firewall rule
   */
  static async addRule(rule: Omit<FirewallRule, "id" | "hitsCount" | "createdAt" | "updatedAt">): Promise<FirewallRule> {
    const rules = await this.getRules();
    const newRule: FirewallRule = {
      ...rule,
      id: `FW-RULE-${Date.now().toString(36).toUpperCase()}`,
      hitsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newRule, ...rules];
    await prisma.clubSettings.upsert({
      where: { key: SETTINGS_KEY },
      update: { value: updated as any },
      create: { key: SETTINGS_KEY, value: updated as any },
    });

    cachedRules = updated;
    lastCacheUpdate = Date.now();
    return newRule;
  }

  /**
   * Update an existing firewall rule
   */
  static async updateRule(id: string, updates: Partial<FirewallRule>): Promise<FirewallRule | null> {
    const rules = await this.getRules();
    const idx = rules.findIndex((r) => r.id === id);
    if (idx === -1) return null;

    rules[idx] = {
      ...rules[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await prisma.clubSettings.upsert({
      where: { key: SETTINGS_KEY },
      update: { value: rules as any },
      create: { key: SETTINGS_KEY, value: rules as any },
    });

    cachedRules = rules;
    lastCacheUpdate = Date.now();
    return rules[idx];
  }

  /**
   * Delete a custom firewall rule
   */
  static async deleteRule(id: string): Promise<boolean> {
    const rules = await this.getRules();
    const filtered = rules.filter((r) => r.id !== id);
    if (filtered.length === rules.length) return false;

    await prisma.clubSettings.upsert({
      where: { key: SETTINGS_KEY },
      update: { value: filtered as any },
      create: { key: SETTINGS_KEY, value: filtered as any },
    });

    cachedRules = filtered;
    lastCacheUpdate = Date.now();
    return true;
  }

  /**
   * Record a rule hit / match asynchronously
   */
  static recordHit(ruleId: string): void {
    if (!cachedRules) return;
    const rule = cachedRules.find((r) => r.id === ruleId);
    if (rule) {
      rule.hitsCount = (rule.hitsCount || 0) + 1;
      rule.lastTriggeredAt = new Date().toISOString();
    }
  }

  /**
   * Check if a Public Network IP is currently blocked by firewall
   */
  static async isPublicIpBlocked(ip: string): Promise<boolean> {
    try {
      const blockedSetting = await prisma.clubSettings.findUnique({ where: { key: "BLOCKED_IPS" } });
      const blockedIps = Array.isArray(blockedSetting?.value) ? (blockedSetting?.value as string[]) : [];
      return blockedIps.includes(ip);
    } catch {
      return false;
    }
  }

  /**
   * Block a Public Network IP address
   */
  static async blockPublicIp(ip: string, reason = "Firewall Security Policy Violation"): Promise<string[]> {
    const blockedSetting = await prisma.clubSettings.findUnique({ where: { key: "BLOCKED_IPS" } });
    const current = Array.isArray(blockedSetting?.value) ? (blockedSetting?.value as string[]) : [];
    if (!current.includes(ip)) {
      current.push(ip);
      await prisma.clubSettings.upsert({
        where: { key: "BLOCKED_IPS" },
        update: { value: current },
        create: { key: "BLOCKED_IPS", value: current },
      });
      await redisDel("BLOCKED_IPS");
    }
    return current;
  }
}
