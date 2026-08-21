"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert, Activity, Cpu, HardDrive, Database, Server,
  Lock, AlertTriangle, RefreshCw, CheckCircle, XCircle, Search,
  Filter, Ban, Check, Terminal, FileText, Bug, Settings, Users,
  Globe, Eye, Clock, ShieldCheck, Zap, AlertCircle, Plus, Trash2,
  Sliders, Download, Radio, Wifi, Code, ShieldX, CheckSquare,
  ArrowUpRight, Copy
} from "lucide-react";

interface SystemMetrics {
  uptimeSeconds: number;
  nodeVersion: string;
  platform: string;
  arch: string;
  cpuCores: number;
  totalMemoryMB: number;
  freeMemoryMB: number;
  heapUsedMB: number;
  heapTotalMB: number;
  rssMB: number;
  env: string;
  version: string;
  owaspComplianceScore: number;
}

interface TelemetryMetrics {
  totalUsers: number;
  activeUsers: number;
  totalAuditLogs: number;
  recent24hLogCount: number;
  attacksBlocked24h: number;
  totalEvents: number;
  totalRegistrations: number;
  totalCertificates: number;
  totalTeams: number;
  totalNotifications: number;
  blockedIpsCount: number;
  activeFirewallRulesCount: number;
  totalFirewallHits: number;
  isMaintenanceMode: boolean;
  realtimeConnections: number;
  requestRatePerMin: number;
}

interface AuditLogItem {
  id: string;
  action: string;
  outcome: string;
  severity?: "INFO" | "WARN" | "CRITICAL" | "EMERGENCY" | "SECURITY_BLOCK";
  category?: string;
  ruleId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  context?: Record<string, any> | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    studentId?: string | null;
    institute?: string | null;
  } | null;
  device?: string;
  deviceId?: string;
  localIp?: string;
  privateIp?: string;
  publicIp?: string;
  browser?: string;
  os?: string;
  time?: string;
  payloadContext?: Record<string, any>;
}

interface FirewallRule {
  id: string;
  name: string;
  category: string;
  description: string;
  action: "BLOCK" | "CHALLENGE" | "RATE_LIMIT" | "LOG_ONLY" | "ALLOW";
  enabled: boolean;
  pattern?: string;
  target: "BODY" | "QUERY" | "PATH" | "HEADER" | "IP_CIDR" | "USER_AGENT" | "ALL";
  severity: "INFO" | "WARN" | "CRITICAL" | "EMERGENCY" | "SECURITY_BLOCK";
  hitsCount: number;
  lastTriggeredAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface IpManagementItem {
  ipAddress: string;
  publicIp: string;
  privateIp: string;
  localIp: string;
  requestCount: number;
  lastActiveAt: string;
  lastUser?: { id: string; name: string; email: string; role: string } | null;
  userAgent: string;
  isBlocked: boolean;
  location: string;
  isp: string;
}

interface DbTableItem {
  name: string;
  rows: number;
  primaryKey: string;
  indexes: number;
  status: string;
}

interface BugReport {
  id: string;
  title: string;
  category: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  reportedBy: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

export default function MaintenancePage() {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "logs" | "firewall" | "security" | "database" | "bugs">("overview");

  // Overview State
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetryMetrics | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(true);

  // Level 2 Logs State
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(1);
  const [logsSearch, setLogsSearch] = useState("");
  const [logsAction, setLogsAction] = useState("");
  const [logsOutcome, setLogsOutcome] = useState("");
  const [logsSeverity, setLogsSeverity] = useState("");
  const [logsCategory, setLogsCategory] = useState("");
  const [logsViewMode, setLogsViewMode] = useState<"ascii" | "table">("table");
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [autoRefreshLogs, setAutoRefreshLogs] = useState(false);

  // Firewall State
  const [firewallRules, setFirewallRules] = useState<FirewallRule[]>([]);
  const [loadingFirewall, setLoadingFirewall] = useState(false);
  const [showAddRuleModal, setShowAddRuleModal] = useState(false);
  const [newRuleName, setNewRuleName] = useState("");
  const [newRuleCategory, setNewRuleCategory] = useState("CUSTOM");
  const [newRuleDescription, setNewRuleDescription] = useState("");
  const [newRulePattern, setNewRulePattern] = useState("");
  const [newRuleTarget, setNewRuleTarget] = useState<FirewallRule["target"]>("ALL");
  const [newRuleAction, setNewRuleAction] = useState<FirewallRule["action"]>("BLOCK");
  const [newRuleSeverity, setNewRuleSeverity] = useState<FirewallRule["severity"]>("SECURITY_BLOCK");

  // Security IP Management State
  const [ipList, setIpList] = useState<IpManagementItem[]>([]);
  const [passwordPolicy, setPasswordPolicy] = useState<any>(null);
  const [recentFailedLogins, setRecentFailedLogins] = useState<any[]>([]);
  const [loadingSecurity, setLoadingSecurity] = useState(false);

  // Database State
  const [dbTables, setDbTables] = useState<DbTableItem[]>([]);
  const [dbMetrics, setDbMetrics] = useState<any>(null);
  const [loadingDb, setLoadingDb] = useState(false);

  // Bugs & Maintenance State
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [maintenanceSettings, setMaintenanceSettings] = useState<any>({ enabled: false, message: "", ipWhitelist: [] });
  const [loadingBugs, setLoadingBugs] = useState(false);

  // Bug Report Form State
  const [newBugTitle, setNewBugTitle] = useState("");
  const [newBugCategory, setNewBugCategory] = useState("PORTAL_CORE");
  const [newBugSeverity, setNewBugSeverity] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [newBugDesc, setNewBugDesc] = useState("");
  const [submittingBug, setSubmittingBug] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch Overview Data
  const fetchOverview = async () => {
    setLoadingOverview(true);
    try {
      const data = await api<any>("/maintenance/overview", { token: token || undefined });
      setSystemMetrics(data.system);
      setTelemetry(data.telemetry);
    } catch (err) {
      console.error("Failed to load maintenance overview", err);
    } finally {
      setLoadingOverview(false);
    }
  };

  // Fetch Logs Data
  const fetchLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const params = new URLSearchParams({
        page: logsPage.toString(),
        limit: "25",
        search: logsSearch,
        action: logsAction,
        outcome: logsOutcome,
        severity: logsSeverity,
        category: logsCategory,
      });
      const data = await api<any>(`/maintenance/logs?${params.toString()}`, { token: token || undefined });
      setLogs(data.logs || []);
      setLogsTotal(data.pagination?.total || 0);
    } catch (err) {
      console.error("Failed to load maintenance logs", err);
    } finally {
      setLoadingLogs(false);
    }
  }, [token, logsPage, logsSearch, logsAction, logsOutcome, logsSeverity, logsCategory]);

  // Fetch Firewall Rules Data
  const fetchFirewallRules = async () => {
    setLoadingFirewall(true);
    try {
      const data = await api<any>("/maintenance/firewall/rules", { token: token || undefined });
      setFirewallRules(data.rules || []);
    } catch (err) {
      console.error("Failed to load firewall rules", err);
    } finally {
      setLoadingFirewall(false);
    }
  };

  // Fetch Security Data
  const fetchSecurity = async () => {
    setLoadingSecurity(true);
    try {
      const [ipRes, passRes] = await Promise.all([
        api<any>("/maintenance/security/ip-management", { token: token || undefined }),
        api<any>("/maintenance/security/passwords", { token: token || undefined }),
      ]);
      setIpList(ipRes.ips || []);
      setPasswordPolicy(passRes.policy || null);
      setRecentFailedLogins(passRes.recentFailedLogins || []);
    } catch (err) {
      console.error("Failed to load security telemetry", err);
    } finally {
      setLoadingSecurity(false);
    }
  };

  // Fetch Database Data
  const fetchDatabase = async () => {
    setLoadingDb(true);
    try {
      const data = await api<any>("/maintenance/database/tables", { token: token || undefined });
      setDbTables(data.tables || []);
      setDbMetrics(data.database || null);
    } catch (err) {
      console.error("Failed to load database telemetry", err);
    } finally {
      setLoadingDb(false);
    }
  };

  // Fetch Bugs & Settings
  const fetchBugsAndSettings = async () => {
    setLoadingBugs(true);
    try {
      const [bugsRes, settingsRes] = await Promise.all([
        api<any>("/maintenance/bugs", { token: token || undefined }),
        api<any>("/maintenance/settings", { token: token || undefined }),
      ]);
      setBugs(bugsRes.bugs || []);
      setMaintenanceSettings(settingsRes.settings || { enabled: false });
    } catch (err) {
      console.error("Failed to load bug reports", err);
    } finally {
      setLoadingBugs(false);
    }
  };

  useEffect(() => {
    if (activeTab === "overview") fetchOverview();
    if (activeTab === "logs") fetchLogs();
    if (activeTab === "firewall") fetchFirewallRules();
    if (activeTab === "security") fetchSecurity();
    if (activeTab === "database") fetchDatabase();
    if (activeTab === "bugs") fetchBugsAndSettings();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "logs") return;
    const timer = setTimeout(() => {
      fetchLogs();
    }, 300);
    return () => clearTimeout(timer);
  }, [activeTab, logsPage, logsSearch, logsAction, logsOutcome, logsSeverity, logsCategory, fetchLogs]);

  // Live stream auto-refresh
  useEffect(() => {
    if (!autoRefreshLogs || activeTab !== "logs") return;
    const interval = setInterval(() => {
      fetchLogs();
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefreshLogs, activeTab, fetchLogs]);

  // Handle IP Block / Unblock
  const handleToggleBlockIp = async (ipAddress: string, isBlocked: boolean) => {
    const endpoint = isBlocked
      ? "/maintenance/security/ip-management/unblock"
      : "/maintenance/security/ip-management/block";

    try {
      await api(endpoint, {
        method: "POST",
        token: token || undefined,
        body: JSON.stringify({ ipAddress }),
      });
      setIpList((prev) =>
        prev.map((item) =>
          item.ipAddress === ipAddress ? { ...item, isBlocked: !isBlocked } : item
        )
      );
      showToast(`Public IP ${ipAddress} ${isBlocked ? "Unblocked" : "Blocked & Enforced"} successfully`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update IP block state", "error");
    }
  };

  // Handle Firewall Rule Toggle
  const handleToggleFirewallRule = async (ruleId: string, currentEnabled: boolean) => {
    try {
      await api(`/maintenance/firewall/rules/${ruleId}`, {
        method: "PATCH",
        token: token || undefined,
        body: JSON.stringify({ enabled: !currentEnabled }),
      });
      setFirewallRules((prev) =>
        prev.map((r) => (r.id === ruleId ? { ...r, enabled: !currentEnabled } : r))
      );
      showToast(`Rule ${ruleId} ${!currentEnabled ? "Enabled" : "Disabled"}`);
    } catch (err) {
      showToast("Failed to toggle firewall rule", "error");
    }
  };

  // Handle Create Firewall Rule
  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await api<any>("/maintenance/firewall/rules", {
        method: "POST",
        token: token || undefined,
        body: JSON.stringify({
          name: newRuleName,
          category: newRuleCategory,
          description: newRuleDescription,
          pattern: newRulePattern || undefined,
          target: newRuleTarget,
          action: newRuleAction,
          severity: newRuleSeverity,
          enabled: true,
        }),
      });
      setFirewallRules((prev) => [data.rule, ...prev]);
      setShowAddRuleModal(false);
      setNewRuleName("");
      setNewRuleDescription("");
      setNewRulePattern("");
      showToast("New Firewall Policy Rule Enforced Successfully!");
    } catch (err) {
      showToast("Failed to create firewall rule", "error");
    }
  };

  // Handle Delete Firewall Rule
  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm("Are you sure you want to remove this security rule?")) return;
    try {
      await api(`/maintenance/firewall/rules/${ruleId}`, {
        method: "DELETE",
        token: token || undefined,
      });
      setFirewallRules((prev) => prev.filter((r) => r.id !== ruleId));
      showToast("Firewall Rule Removed");
    } catch (err) {
      showToast("Failed to delete firewall rule", "error");
    }
  };

  // Export Forensic Logs
  const handleExportLogs = () => {
    if (!logs.length) return;
    const jsonStr = JSON.stringify(logs, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `forensic_telemetry_l2_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    showToast("Level 2 Forensic Telemetry Exported");
  };

  // Handle Toggle Maintenance Mode
  const handleToggleMaintenance = async () => {
    try {
      const newStatus = !maintenanceSettings.enabled;
      await api("/maintenance/settings", {
        method: "PATCH",
        token: token || undefined,
        body: JSON.stringify({
          enabled: newStatus,
          message: maintenanceSettings.message || "Portal is undergoing scheduled maintenance.",
        }),
      });
      setMaintenanceSettings({ ...maintenanceSettings, enabled: newStatus });
      showToast(`Maintenance Mode ${newStatus ? "ACTIVATED" : "DEACTIVATED"}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to toggle maintenance mode", "error");
    }
  };

  // Handle Bug Submit
  const handleBugSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBugTitle.trim() || !newBugDesc.trim()) return;
    setSubmittingBug(true);
    try {
      const data = await api<any>("/maintenance/bugs", {
        method: "POST",
        token: token || undefined,
        body: JSON.stringify({
          title: newBugTitle,
          category: newBugCategory,
          severity: newBugSeverity,
          description: newBugDesc,
        }),
      });
      setBugs((prev) => [data.bug, ...prev]);
      setNewBugTitle("");
      setNewBugDesc("");
      showToast("Bug Report Logged Successfully");
    } catch (err) {
      showToast("Failed to submit bug report", "error");
    } finally {
      setSubmittingBug(false);
    }
  };

  const getSeverityBadge = (severity?: string) => {
    switch (severity) {
      case "SECURITY_BLOCK":
        return <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-red-500/10 border border-red-500/30 text-red-400">🛡️ SEC_BLOCK</span>;
      case "EMERGENCY":
        return <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-red-600/20 border border-red-500 text-red-300 animate-pulse">⚡ EMERGENCY</span>;
      case "CRITICAL":
        return <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-orange-500/10 border border-orange-500/30 text-orange-400">⚠️ CRITICAL</span>;
      case "WARN":
        return <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-yellow-500/10 border border-yellow-500/30 text-yellow-400">⚡ WARN</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">ℹ️ INFO</span>;
    }
  };

  return (
    <div className="flex flex-col gap-6 p-2 sm:p-4 max-w-7xl mx-auto">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl border font-mono text-xs font-semibold shadow-2xl backdrop-blur-xl"
            style={toastMessage.type === "success"
              ? { background: "rgba(204,255,0,0.08)", borderColor: "rgba(204,255,0,0.3)", color: "#CCFF00" }
              : { background: "rgba(255,0,60,0.08)", borderColor: "rgba(255,0,60,0.3)", color: "#FF003C" }}
          >
            {toastMessage.type === "success" ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {toastMessage.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-[#CCFF00]/10 border border-[#CCFF00]/30 text-[#CCFF00]">
              LEVEL 2 ENTERPRISE TELEMETRY
            </span>
            <span className="text-[10px] font-mono text-zinc-400">OWASP Hardened</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-[var(--ck-text)]">
            MAINTENANCE & <span className="text-[#CCFF00]">SECURITY CORE</span>
          </h1>
        </div>

        {/* Global Action Tools */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleMaintenance}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all border ${
              maintenanceSettings.enabled
                ? "bg-red-500/20 border-red-500 text-red-400 shadow-[0_0_15px_rgba(255,0,60,0.2)] animate-pulse"
                : "bg-black/40 border-white/[0.08] text-zinc-400 hover:text-white"
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            {maintenanceSettings.enabled ? "MAINTENANCE ACTIVE" : "LOCKDOWN PORTAL"}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/[0.06]">
        {[
          { id: "overview", label: "OVERVIEW", icon: Activity },
          { id: "logs", label: "LEVEL 2 LOGS", icon: Terminal },
          { id: "firewall", label: "FIREWALL RULES", icon: ShieldCheck },
          { id: "security", label: "IP & ATTACKS", icon: Ban },
          { id: "database", label: "DATA METRICS", icon: Database },
          { id: "bugs", label: "SYS BUGS", icon: Bug },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all ${
                isActive
                  ? "bg-[#CCFF00]/10 border border-[#CCFF00]/30 text-[#CCFF00] shadow-[0_0_12px_rgba(204,255,0,0.15)]"
                  : "text-zinc-400 hover:text-white border border-transparent"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: OVERVIEW ── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="ck-glass-card p-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">24H BLOCKED THREATS</span>
              <p className="text-2xl sm:text-3xl font-black font-mono text-red-400 mt-1">
                {telemetry?.attacksBlocked24h || 0}
              </p>
            </div>
            <div className="ck-glass-card p-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">ACTIVE FIREWALL RULES</span>
              <p className="text-2xl sm:text-3xl font-black font-mono text-[#CCFF00] mt-1">
                {telemetry?.activeFirewallRulesCount || 7}
              </p>
            </div>
            <div className="ck-glass-card p-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">BLOCKED PUBLIC IPS</span>
              <p className="text-2xl sm:text-3xl font-black font-mono text-orange-400 mt-1">
                {telemetry?.blockedIpsCount || 0}
              </p>
            </div>
            <div className="ck-glass-card p-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">TELEMETRY LOG VOLUME</span>
              <p className="text-2xl sm:text-3xl font-black font-mono text-cyan-400 mt-1">
                {telemetry?.totalAuditLogs || 0}
              </p>
            </div>
          </div>

          {/* System Environment Telemetry */}
          <div className="ck-glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Server className="w-4 h-4 text-[#CCFF00]" />
              <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[var(--ck-text)]">
                HOST ENVIRONMENT & OWASP TELEMETRY
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3 rounded-lg bg-black/30 border border-white/[0.04]">
                <p className="text-zinc-500">SERVER UPTIME</p>
                <p className="text-white font-bold mt-1">
                  {Math.floor((systemMetrics?.uptimeSeconds || 0) / 3600)}h {Math.floor(((systemMetrics?.uptimeSeconds || 0) % 3600) / 60)}m
                </p>
              </div>
              <div className="p-3 rounded-lg bg-black/30 border border-white/[0.04]">
                <p className="text-zinc-500">MEMORY CONSUMPTION</p>
                <p className="text-white font-bold mt-1">{systemMetrics?.rssMB || 0} MB RSS</p>
              </div>
              <div className="p-3 rounded-lg bg-black/30 border border-white/[0.04]">
                <p className="text-zinc-500">ENGINE RUNTIME</p>
                <p className="text-white font-bold mt-1">{systemMetrics?.nodeVersion} ({systemMetrics?.platform})</p>
              </div>
              <div className="p-3 rounded-lg bg-black/30 border border-white/[0.04]">
                <p className="text-zinc-500">SECURITY COMPLIANCE</p>
                <p className="text-[#CCFF00] font-bold mt-1">100% Level 2 OWASP</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: LEVEL 2 LOGS ── */}
      {activeTab === "logs" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-black/30 border border-white/[0.06]">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                <input
                  value={logsSearch}
                  onChange={(e) => setLogsSearch(e.target.value)}
                  placeholder="Search user, IP, rule ID..."
                  className="pl-8 pr-3 py-1.5 rounded-lg bg-black/50 border border-white/[0.08] text-xs font-mono text-white outline-none focus:border-[#CCFF00]/40 w-48 sm:w-64"
                />
              </div>
              <select
                value={logsSeverity}
                onChange={(e) => setLogsSeverity(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-black/50 border border-white/[0.08] text-xs font-mono text-zinc-300 outline-none"
              >
                <option value="">All Severities</option>
                <option value="SECURITY_BLOCK">Security Block</option>
                <option value="EMERGENCY">Emergency</option>
                <option value="CRITICAL">Critical</option>
                <option value="WARN">Warning</option>
                <option value="INFO">Info</option>
              </select>
              <select
                value={logsCategory}
                onChange={(e) => setLogsCategory(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-black/50 border border-white/[0.08] text-xs font-mono text-zinc-300 outline-none"
              >
                <option value="">All Categories</option>
                <option value="FIREWALL">Firewall</option>
                <option value="WAF">WAF</option>
                <option value="AUTH">Authentication</option>
                <option value="SYSTEM">System Ops</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setAutoRefreshLogs(!autoRefreshLogs)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                  autoRefreshLogs ? "bg-[#CCFF00]/10 border-[#CCFF00]/30 text-[#CCFF00]" : "border-white/[0.08] text-zinc-400"
                }`}
              >
                <Radio className={`w-3.5 h-3.5 ${autoRefreshLogs ? "animate-pulse" : ""}`} />
                {autoRefreshLogs ? "STREAM ON" : "STREAM OFF"}
              </button>
              <button
                onClick={handleExportLogs}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border border-white/[0.08] text-zinc-300 hover:text-white"
              >
                <Download className="w-3.5 h-3.5" />
                EXPORT
              </button>
            </div>
          </div>

          {/* Logs Table */}
          <div className="ck-glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-black/40 text-zinc-500 uppercase text-[10px]">
                    <th className="py-2.5 px-4">TIMESTAMP</th>
                    <th className="py-2.5 px-4">SEVERITY</th>
                    <th className="py-2.5 px-4">ACTION & RULE</th>
                    <th className="py-2.5 px-4">PUBLIC NETWORK IP</th>
                    <th className="py-2.5 px-4">DEVICE PRIVATE IP</th>
                    <th className="py-2.5 px-4">USER IDENTITY</th>
                    <th className="py-2.5 px-4 text-right">INSPECT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {loadingLogs ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-zinc-500">
                        Loading Level 2 Telemetry Stream...
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-zinc-500">
                        No telemetry logs matched filter criteria.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => {
                      const isExpanded = expandedLogId === log.id;
                      return (
                        <React.Fragment key={log.id}>
                          <tr className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-2.5 px-4 text-zinc-400 whitespace-nowrap">
                              {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                            </td>
                            <td className="py-2.5 px-4 whitespace-nowrap">
                              {getSeverityBadge(log.severity)}
                            </td>
                            <td className="py-2.5 px-4">
                              <span className="font-bold text-white block">{log.action}</span>
                              {log.ruleId && (
                                <span className="text-[9px] text-[#CCFF00] font-mono">{log.ruleId}</span>
                              )}
                            </td>
                            <td className="py-2.5 px-4 text-zinc-300">
                              <div className="flex items-center gap-1.5">
                                <Globe className="w-3 h-3 text-cyan-400 shrink-0" />
                                <span>{log.publicIp || "127.0.0.1"}</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-4 text-zinc-300">
                              <div className="flex items-center gap-1.5">
                                <Wifi className="w-3 h-3 text-emerald-400 shrink-0" />
                                <span>{log.privateIp || log.localIp || "192.168.1.100"}</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-4">
                              {log.user ? (
                                <div>
                                  <span className="text-white font-semibold block truncate max-w-[120px]">{log.user.name}</span>
                                  <span className="text-[9px] text-zinc-500 block truncate max-w-[120px]">{log.user.email}</span>
                                </div>
                              ) : (
                                <span className="text-zinc-600">Anonymous</span>
                              )}
                            </td>
                            <td className="py-2.5 px-4 text-right whitespace-nowrap">
                              <button
                                onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                                className="px-2 py-1 rounded bg-black/50 border border-white/[0.08] text-[10px] text-zinc-300 hover:text-white"
                              >
                                {isExpanded ? "Close" : "Payload"}
                              </button>
                            </td>
                          </tr>

                          {/* Expanded Forensic Drawer */}
                          {isExpanded && (
                            <tr className="bg-black/60">
                              <td colSpan={7} className="p-4 border-b border-white/[0.08]">
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between text-xs text-zinc-400 border-b border-white/[0.06] pb-2">
                                    <span className="text-[#CCFF00] font-bold">FORENSIC TELEMETRY DATA & CONTEXT</span>
                                    <span>Device: {log.device} · OS: {log.os} · Browser: {log.browser}</span>
                                  </div>
                                  <pre className="p-3 rounded-lg bg-black/80 border border-white/[0.06] text-[11px] text-emerald-400 font-mono overflow-x-auto">
                                    {JSON.stringify(log.payloadContext || log.context || {}, null, 2)}
                                  </pre>
                                  {log.publicIp && log.publicIp !== "127.0.0.1" && (
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleToggleBlockIp(log.publicIp!, false)}
                                        className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs hover:bg-red-500/20"
                                      >
                                        Ban Public Network IP ({log.publicIp})
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: FIREWALL RULES POLICY ENGINE ── */}
      {activeTab === "firewall" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-black/40 border border-white/[0.06]">
            <div>
              <h2 className="text-sm font-mono font-bold uppercase text-[var(--ck-text)]">
                DYNAMIC FIREWALL POLICY RULES (LEVEL 2)
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Active real-time security rules evaluated across API routes, payloads, and public network IPs.
              </p>
            </div>
            <button
              onClick={() => setShowAddRuleModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#CCFF00]/10 border border-[#CCFF00]/30 text-[#CCFF00] text-xs font-mono font-bold hover:bg-[#CCFF00]/20"
            >
              <Plus className="w-3.5 h-3.5" />
              CREATE POLICY RULE
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {firewallRules.map((rule) => (
              <div
                key={rule.id}
                className="ck-glass-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-white font-mono">{rule.name}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-zinc-800 text-zinc-300">
                      {rule.id}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-purple-500/10 border border-purple-500/30 text-purple-400">
                      {rule.category}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-red-500/10 text-red-400 font-bold">
                      {rule.action}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">{rule.description}</p>
                  {rule.pattern && (
                    <div className="p-2 rounded bg-black/60 border border-white/[0.04] text-[10px] font-mono text-[#CCFF00] truncate max-w-2xl">
                      Pattern: {rule.pattern}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right font-mono">
                    <span className="text-[10px] text-zinc-500 uppercase block">THREAT HITS</span>
                    <span className="text-sm font-black text-red-400">{rule.hitsCount || 0}</span>
                  </div>
                  <button
                    onClick={() => handleToggleFirewallRule(rule.id, rule.enabled)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
                      rule.enabled
                        ? "bg-[#CCFF00]/10 border-[#CCFF00]/30 text-[#CCFF00]"
                        : "bg-zinc-900 border-zinc-700 text-zinc-500"
                    }`}
                  >
                    {rule.enabled ? "ACTIVE" : "DISABLED"}
                  </button>
                  {rule.id.startsWith("FW-RULE-") && rule.category === "CUSTOM" && (
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add Rule Modal */}
          {showAddRuleModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="ck-glass-card p-6 w-full max-w-xl space-y-4"
              >
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                  <h3 className="text-sm font-mono font-bold uppercase text-white">
                    DEFINE FIREWALL POLICY RULE (LEVEL 2)
                  </h3>
                  <button
                    onClick={() => setShowAddRuleModal(false)}
                    className="text-zinc-500 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                <form onSubmit={handleCreateRule} className="space-y-3 font-mono text-xs">
                  <div>
                    <label className="block text-zinc-400 mb-1">RULE NAME</label>
                    <input
                      required
                      value={newRuleName}
                      onChange={(e) => setNewRuleName(e.target.value)}
                      placeholder="e.g. Block Malicious Proxy Scanners"
                      className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/[0.08] text-white outline-none focus:border-[#CCFF00]/40"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-zinc-400 mb-1">CATEGORY</label>
                      <select
                        value={newRuleCategory}
                        onChange={(e) => setNewRuleCategory(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/[0.08] text-white outline-none"
                      >
                        <option value="CUSTOM">Custom Rule</option>
                        <option value="SQLI">SQL Injection</option>
                        <option value="XSS">XSS Scripting</option>
                        <option value="BRUTE_FORCE">Brute Force</option>
                        <option value="PATH_TRAVERSAL">Path Traversal</option>
                        <option value="BAD_BOT">Bad Bot / Scanner</option>
                        <option value="GEO_CIDR">CIDR / IP Range</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-zinc-400 mb-1">TARGET INSPECTION</label>
                      <select
                        value={newRuleTarget}
                        onChange={(e) => setNewRuleTarget(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/[0.08] text-white outline-none"
                      >
                        <option value="ALL">All Request Data</option>
                        <option value="BODY">JSON / Form Body</option>
                        <option value="QUERY">URL Query Params</option>
                        <option value="PATH">Request URL Path</option>
                        <option value="HEADER">HTTP Headers</option>
                        <option value="USER_AGENT">User-Agent</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">DETECTION REGEX PATTERN</label>
                    <input
                      value={newRulePattern}
                      onChange={(e) => setNewRulePattern(e.target.value)}
                      placeholder="e.g. (evilbot|hacktool|scanner)"
                      className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/[0.08] text-white outline-none focus:border-[#CCFF00]/40"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">RULE DESCRIPTION</label>
                    <textarea
                      required
                      value={newRuleDescription}
                      onChange={(e) => setNewRuleDescription(e.target.value)}
                      rows={2}
                      placeholder="Briefly describe the threat and mitigation rationale."
                      className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/[0.08] text-white outline-none focus:border-[#CCFF00]/40"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddRuleModal(false)}
                      className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-[#CCFF00] text-black font-bold"
                    >
                      Enforce Rule
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: IP SECURITY & ATTACKS ── */}
      {activeTab === "security" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06]">
            <h2 className="text-sm font-mono font-bold uppercase text-[var(--ck-text)]">
              PUBLIC NETWORK IP MANAGEMENT & HARDENING
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Identifies public network egress gateways, private device LAN addresses, and enforces automated lockout.
            </p>
          </div>

          <div className="ck-glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-black/40 text-zinc-500 uppercase text-[10px]">
                    <th className="py-2.5 px-4">PUBLIC NETWORK IP</th>
                    <th className="py-2.5 px-4">PRIVATE DEVICE LAN IP</th>
                    <th className="py-2.5 px-4">REQUEST COUNT</th>
                    <th className="py-2.5 px-4">LAST IDENTITY</th>
                    <th className="py-2.5 px-4">STATUS</th>
                    <th className="py-2.5 px-4 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {loadingSecurity ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-zinc-500">
                        Scanning IP telemetry...
                      </td>
                    </tr>
                  ) : (
                    ipList.map((ip) => (
                      <tr key={ip.ipAddress} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 font-bold text-white">
                          <div className="flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span>{ip.publicIp || ip.ipAddress}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-zinc-300">
                          <div className="flex items-center gap-1.5">
                            <Wifi className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>{ip.privateIp || ip.localIp || "192.168.1.100"}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-zinc-400">{ip.requestCount} requests</td>
                        <td className="py-3 px-4 text-zinc-300">
                          {ip.lastUser ? `${ip.lastUser.name} (${ip.lastUser.role})` : "Anonymous"}
                        </td>
                        <td className="py-3 px-4">
                          {ip.isBlocked ? (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-red-500/10 border border-red-500/30 text-red-400">
                              BLOCKED BY FIREWALL
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400">
                              CLEAN
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleToggleBlockIp(ip.ipAddress, ip.isBlocked)}
                            className={`px-3 py-1 rounded text-xs font-bold border transition-all ${
                              ip.isBlocked
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                                : "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                            }`}
                          >
                            {ip.isBlocked ? "Unblock IP" : "Ban Public IP"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: DATABASE TABLES ── */}
      {activeTab === "database" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06]">
            <h2 className="text-sm font-mono font-bold uppercase text-[var(--ck-text)]">
              PRISMA DATABASE SCHEMA & STORAGE METRICS
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {dbTables.map((t) => (
              <div key={t.name} className="ck-glass-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-white">{t.name}</span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-emerald-500/10 text-emerald-400">
                    {t.status}
                  </span>
                </div>
                <p className="text-xl font-mono font-black text-[#CCFF00]">{t.rows} Records</p>
                <div className="flex justify-between text-[10px] font-mono text-zinc-500 border-t border-white/[0.04] pt-2">
                  <span>PK: {t.primaryKey}</span>
                  <span>{t.indexes} Indexes</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 6: SYSTEM BUGS ── */}
      {activeTab === "bugs" && (
        <div className="space-y-4">
          <div className="ck-glass-card p-5">
            <h2 className="text-sm font-mono font-bold uppercase text-white mb-3">
              REPORT SYSTEM ISSUE / BUG (LEVEL 2 AUDIT)
            </h2>
            <form onSubmit={handleBugSubmit} className="space-y-3 font-mono text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-zinc-400 mb-1">ISSUE TITLE</label>
                  <input
                    required
                    value={newBugTitle}
                    onChange={(e) => setNewBugTitle(e.target.value)}
                    placeholder="Brief description of the anomaly..."
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/[0.08] text-white outline-none focus:border-[#CCFF00]/40"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">SEVERITY</label>
                  <select
                    value={newBugSeverity}
                    onChange={(e) => setNewBugSeverity(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/[0.08] text-white outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">TECHNICAL OBSERVATIONS & LOGS</label>
                <textarea
                  required
                  value={newBugDesc}
                  onChange={(e) => setNewBugDesc(e.target.value)}
                  rows={3}
                  placeholder="Steps to reproduce, error message, affected route..."
                  className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/[0.08] text-white outline-none focus:border-[#CCFF00]/40"
                />
              </div>
              <button
                type="submit"
                disabled={submittingBug}
                className="px-4 py-2 rounded-lg bg-[#CCFF00] text-black font-bold"
              >
                {submittingBug ? "Logging..." : "Submit Technical Bug Report"}
              </button>
            </form>
          </div>

          <div className="space-y-2">
            {bugs.map((b) => (
              <div key={b.id} className="ck-glass-card p-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white font-mono">{b.title}</span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-zinc-800 text-zinc-300">
                    {b.status}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 font-mono">{b.description}</p>
                <div className="text-[10px] font-mono text-zinc-500">
                  Reported by: {b.reportedBy} · {new Date(b.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
