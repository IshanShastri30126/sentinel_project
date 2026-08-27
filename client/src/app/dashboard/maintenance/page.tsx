"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert, Activity, Database, Server,
  AlertTriangle, RefreshCw, CheckCircle, XCircle, Search,
  Ban, Terminal, FileText, Bug, Users,
  Globe, Clock, ShieldCheck, Zap, AlertCircle, Plus, Trash2,
  Download, Radio, Wifi, Code,
  Copy, ChevronLeft, ChevronRight,
  BarChart2, Shield, List, TerminalSquare
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
  context?: Record<string, unknown> | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    studentId?: string | null;
    employeeId?: string | null;
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
  payloadContext?: Record<string, unknown>;
}

interface LogStats {
  total: number;
  securityBlocksCount: number;
  warningsCount: number;
  successCount: number;
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

interface MaintenanceSettings {
  enabled: boolean;
  message?: string;
  ipWhitelist?: string[];
  loggingLevel?: string;
}

type TabType = "logs" | "overview" | "firewall" | "security" | "database" | "bugs";
type LogViewMode = "table" | "terminal" | "timeline" | "analytics";

export default function MaintenancePage() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("logs");

  // Overview State
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetryMetrics | null>(null);

  // Level 2 Logs State
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [logStats, setLogStats] = useState<LogStats>({ total: 0, securityBlocksCount: 0, warningsCount: 0, successCount: 0 });
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(1);
  const [logsLimit, setLogsLimit] = useState(25);
  const [logsSearch, setLogsSearch] = useState("");
  const [logsAction, setLogsAction] = useState("");
  const [logsOutcome, setLogsOutcome] = useState("");
  const [logsSeverity, setLogsSeverity] = useState("");
  const [logsCategory, setLogsCategory] = useState("");
  const [logsViewMode, setLogsViewMode] = useState<LogViewMode>("table");
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [selectedRawLog, setSelectedRawLog] = useState<AuditLogItem | null>(null);
  const [autoRefreshLogs, setAutoRefreshLogs] = useState(false);
  const [terminalAutoscroll, setTerminalAutoscroll] = useState(true);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Firewall State
  const [firewallRules, setFirewallRules] = useState<FirewallRule[]>([]);
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
  const [loadingSecurity, setLoadingSecurity] = useState(false);

  // Database State
  const [dbTables, setDbTables] = useState<DbTableItem[]>([]);

  // Bugs & Maintenance State
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [maintenanceSettings, setMaintenanceSettings] = useState<MaintenanceSettings>({ enabled: false, message: "", ipWhitelist: [] });

  // Bug Report Form State
  const [newBugTitle, setNewBugTitle] = useState("");
  const [newBugCategory, setNewBugCategory] = useState("PORTAL_CORE");
  const [newBugSeverity, setNewBugSeverity] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [newBugDesc, setNewBugDesc] = useState("");
  const [submittingBug, setSubmittingBug] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = useCallback((text: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  // Fetch Overview Data
  const fetchOverview = useCallback(async () => {
    try {
      const data = await api<{ system: SystemMetrics; telemetry: TelemetryMetrics }>("/maintenance/overview", { token: token || undefined });
      setSystemMetrics(data.system);
      setTelemetry(data.telemetry);
    } catch (err) {
      console.error("Failed to load maintenance overview", err);
    }
  }, [token]);

  // Fetch Logs Data
  const fetchLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const params = new URLSearchParams({
        page: logsPage.toString(),
        limit: logsLimit.toString(),
        search: logsSearch,
        action: logsAction,
        outcome: logsOutcome,
        severity: logsSeverity,
        category: logsCategory,
      });
      const data = await api<{ logs: AuditLogItem[]; pagination: { total: number }; stats?: LogStats }>(
        `/maintenance/logs?${params.toString()}`,
        { token: token || undefined }
      );
      setLogs(data.logs || []);
      setLogsTotal(data.pagination?.total || 0);
      if (data.stats) {
        setLogStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to load maintenance logs", err);
    } finally {
      setLoadingLogs(false);
    }
  }, [token, logsPage, logsLimit, logsSearch, logsAction, logsOutcome, logsSeverity, logsCategory]);

  // Fetch Firewall Rules Data
  const fetchFirewallRules = useCallback(async () => {
    try {
      const data = await api<{ rules: FirewallRule[] }>("/maintenance/firewall/rules", { token: token || undefined });
      setFirewallRules(data.rules || []);
    } catch (err) {
      console.error("Failed to load firewall rules", err);
    }
  }, [token]);

  // Fetch Security Data
  const fetchSecurity = useCallback(async () => {
    setLoadingSecurity(true);
    try {
      const [ipRes] = await Promise.all([
        api<{ ips: IpManagementItem[] }>("/maintenance/security/ip-management", { token: token || undefined }),
      ]);
      setIpList(ipRes.ips || []);
    } catch (err) {
      console.error("Failed to load security telemetry", err);
    } finally {
      setLoadingSecurity(false);
    }
  }, [token]);

  // Fetch Database Data
  const fetchDatabase = useCallback(async () => {
    try {
      const data = await api<{ tables: DbTableItem[] }>("/maintenance/database/tables", { token: token || undefined });
      setDbTables(data.tables || []);
    } catch (err) {
      console.error("Failed to load database telemetry", err);
    }
  }, [token]);

  // Fetch Bugs & Settings
  const fetchBugsAndSettings = useCallback(async () => {
    try {
      const [bugsRes, settingsRes] = await Promise.all([
        api<{ bugs: BugReport[] }>("/maintenance/bugs", { token: token || undefined }),
        api<{ settings: MaintenanceSettings }>("/maintenance/settings", { token: token || undefined }),
      ]);
      setBugs(bugsRes.bugs || []);
      setMaintenanceSettings(settingsRes.settings || { enabled: false });
    } catch (err) {
      console.error("Failed to load bug reports", err);
    }
  }, [token]);

  useEffect(() => {
    if (activeTab === "overview") void fetchOverview();
    if (activeTab === "logs") void fetchLogs();
    if (activeTab === "firewall") void fetchFirewallRules();
    if (activeTab === "security") void fetchSecurity();
    if (activeTab === "database") void fetchDatabase();
    if (activeTab === "bugs") void fetchBugsAndSettings();
  }, [activeTab, fetchOverview, fetchLogs, fetchFirewallRules, fetchSecurity, fetchDatabase, fetchBugsAndSettings]);

  useEffect(() => {
    if (activeTab !== "logs") return;
    const timer = setTimeout(() => {
      void fetchLogs();
    }, 300);
    return () => clearTimeout(timer);
  }, [activeTab, logsPage, logsLimit, logsSearch, logsAction, logsOutcome, logsSeverity, logsCategory, fetchLogs]);

  // Live stream auto-refresh
  useEffect(() => {
    if (!autoRefreshLogs || activeTab !== "logs") return;
    const interval = setInterval(() => {
      void fetchLogs();
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefreshLogs, activeTab, fetchLogs]);

  // Autoscroll terminal
  useEffect(() => {
    if (logsViewMode === "terminal" && terminalAutoscroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, logsViewMode, terminalAutoscroll]);

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
      if (activeTab === "logs") void fetchLogs();
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
    } catch (_err) {
      showToast("Failed to toggle firewall rule", "error");
    }
  };

  // Handle Create Firewall Rule
  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await api<{ rule: FirewallRule }>("/maintenance/firewall/rules", {
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
    } catch (_err) {
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
    } catch (_err) {
      showToast("Failed to delete firewall rule", "error");
    }
  };

  // Export Forensic Logs in JSON
  const handleExportJSON = () => {
    if (!logs.length) return;
    const jsonStr = JSON.stringify(logs, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `forensic_telemetry_l2_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    showToast("Level 2 Forensic Telemetry Exported as JSON", "success");
  };

  // Export Forensic Logs in CSV
  const handleExportCSV = () => {
    if (!logs.length) return;
    const headers = ["Timestamp", "Severity", "Action", "Outcome", "Category", "Public IP", "Private IP", "User Name", "User Email", "User Role", "Device", "OS", "Browser"];
    const rows = logs.map((l) => [
      `"${l.createdAt}"`,
      `"${l.severity || "INFO"}"`,
      `"${l.action}"`,
      `"${l.outcome}"`,
      `"${l.category || "SYSTEM"}"`,
      `"${l.publicIp || l.ipAddress || ""}"`,
      `"${l.privateIp || l.localIp || ""}"`,
      `"${l.user?.name || "Anonymous"}"`,
      `"${l.user?.email || ""}"`,
      `"${l.user?.role || ""}"`,
      `"${l.device || ""}"`,
      `"${l.os || ""}"`,
      `"${l.browser || ""}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `forensic_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    showToast("Forensic Logs Exported as CSV Spreadsheet", "success");
  };

  const copyToClipboard = (text: string, label = "Copied") => {
    void navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard`, "info");
  };

  const resetAllFilters = () => {
    setLogsSearch("");
    setLogsAction("");
    setLogsOutcome("");
    setLogsSeverity("");
    setLogsCategory("");
    setLogsPage(1);
    showToast("All filters cleared", "info");
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
      const data = await api<{ bug: BugReport }>("/maintenance/bugs", {
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
    } catch (_err) {
      showToast("Failed to submit bug report", "error");
    } finally {
      setSubmittingBug(false);
    }
  };

  const getSeverityBadge = (severity?: string) => {
    switch (severity) {
      case "SECURITY_BLOCK":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-red-500/15 border border-red-500/40 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.2)]">
            <ShieldAlert className="w-3 h-3" /> SEC_BLOCK
          </span>
        );
      case "EMERGENCY":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-rose-600/25 border border-rose-500 text-rose-300 animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.35)]">
            <Zap className="w-3 h-3" /> EMERGENCY
          </span>
        );
      case "CRITICAL":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-orange-500/15 border border-orange-500/40 text-orange-400">
            <AlertTriangle className="w-3 h-3" /> CRITICAL
          </span>
        );
      case "WARN":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-yellow-500/15 border border-yellow-500/40 text-yellow-400">
            <AlertCircle className="w-3 h-3" /> WARN
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Activity className="w-3 h-3" /> INFO
          </span>
        );
    }
  };

  const getCategoryBadge = (category?: string) => {
    switch (category) {
      case "FIREWALL":
      case "WAF":
        return <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-purple-500/10 border border-purple-500/30 text-purple-400">FIREWALL / WAF</span>;
      case "AUTH":
        return <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-500/10 border border-blue-500/30 text-blue-400">AUTH & PASS</span>;
      case "EVENTS":
        return <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">EVENTS / OPS</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-zinc-700/30 border border-zinc-600/30 text-zinc-300">SYSTEM CORE</span>;
    }
  };

  const getOutcomeBadge = (outcome: string) => {
    const isSuccess = outcome.toUpperCase() === "SUCCESS";
    const isBlock = ["REJECTED", "BLOCKED"].includes(outcome.toUpperCase());
    if (isBlock) {
      return <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/30">BLOCKED</span>;
    }
    if (isSuccess) {
      return <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">SUCCESS</span>;
    }
    return <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">FAILED</span>;
  };

  const hasActiveFilters = Boolean(logsSearch || logsAction || logsOutcome || logsSeverity || logsCategory);
  const totalPages = Math.max(1, Math.ceil(logsTotal / logsLimit));

  return (
    <div className="flex flex-col gap-6 p-2 sm:p-5 max-w-[1400px] mx-auto w-full text-zinc-100">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl border font-mono text-xs font-semibold shadow-2xl backdrop-blur-xl"
            style={
              toastMessage.type === "success"
                ? { background: "rgba(204,255,0,0.08)", borderColor: "rgba(204,255,0,0.3)", color: "#CCFF00" }
                : toastMessage.type === "error"
                ? { background: "rgba(255,0,60,0.08)", borderColor: "rgba(255,0,60,0.3)", color: "#FF003C" }
                : { background: "rgba(0,245,212,0.08)", borderColor: "rgba(0,245,212,0.3)", color: "#00F5D4" }
            }
          >
            {toastMessage.type === "success" && <CheckCircle className="w-4 h-4" />}
            {toastMessage.type === "error" && <XCircle className="w-4 h-4" />}
            {toastMessage.type === "info" && <Activity className="w-4 h-4" />}
            {toastMessage.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HEADER BANNER ── */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#0A101D] to-[#040810] p-5 sm:p-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#CCFF00]/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-[#00F5D4]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-[#CCFF00]/10 border border-[#CCFF00]/30 text-[#CCFF00]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00] animate-pulse" />
                ENTERPRISE LEVEL 2 AUDIT CORE
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                OWASP ASVS Hardened
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-800 text-zinc-400">
                v2.5.0-PROD
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white flex items-center gap-3">
              MAINTENANCE &amp; <span className="text-[#CCFF00]">FORENSIC TELEMETRY</span>
            </h1>
            <p className="text-xs text-zinc-400 font-mono mt-1">
              Live zero-trust event telemetry, automated IDS/WAF threat blocking, and audit verification.
            </p>
          </div>

          {/* Quick Global Action Tools */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                if (activeTab === "logs") void fetchLogs();
                else if (activeTab === "overview") void fetchOverview();
                else if (activeTab === "firewall") void fetchFirewallRules();
                else if (activeTab === "security") void fetchSecurity();
                else if (activeTab === "database") void fetchDatabase();
                else if (activeTab === "bugs") void fetchBugsAndSettings();
                showToast("Telemetry synced with server", "info");
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold bg-white/[0.04] border border-white/[0.1] text-zinc-300 hover:text-white hover:bg-white/[0.08] transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? "animate-spin text-[#CCFF00]" : ""}`} />
              SYNC LOGS
            </button>

            <button
              onClick={() => void handleToggleMaintenance()}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all border ${
                maintenanceSettings.enabled
                  ? "bg-red-500/20 border-red-500 text-red-400 shadow-[0_0_20px_rgba(255,0,60,0.3)] animate-pulse"
                  : "bg-black/60 border-white/[0.12] text-zinc-300 hover:text-red-400 hover:border-red-500/40"
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              {maintenanceSettings.enabled ? "MAINTENANCE ACTIVE" : "PORTAL LOCKDOWN"}
            </button>
          </div>
        </div>
      </div>

      {/* ── NAVIGATION TABS ── */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-black/60 border border-white/[0.08] backdrop-blur-md">
        {[
          { id: "logs" as TabType, label: "MAINTENANCE LOGS", icon: TerminalSquare, badge: logsTotal > 0 ? `${logsTotal}` : undefined },
          { id: "overview" as TabType, label: "SYSTEM OVERVIEW", icon: Activity },
          { id: "firewall" as TabType, label: "FIREWALL POLICIES", icon: ShieldCheck, badge: `${firewallRules.length || 7}` },
          { id: "security" as TabType, label: "IP & THREAT INTEL", icon: Ban },
          { id: "database" as TabType, label: "DATA METRICS", icon: Database },
          { id: "bugs" as TabType, label: "INCIDENT REPORTS", icon: Bug, badge: bugs.length > 0 ? `${bugs.length}` : undefined },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase transition-all relative ${
                isActive
                  ? "bg-[#CCFF00]/12 border border-[#CCFF00]/40 text-[#CCFF00] shadow-[0_0_16px_rgba(204,255,0,0.15)]"
                  : "text-zinc-400 hover:text-zinc-200 border border-transparent hover:bg-white/[0.03]"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold ${
                    isActive ? "bg-[#CCFF00] text-black" : "bg-zinc-800 text-zinc-300"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 1: MAINTENANCE & FORENSIC LOGS ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "logs" && (
        <div className="space-y-5">
          {/* Live Telemetry Summary Ribbon */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-xl p-4 bg-[#0A101D]/90 border border-white/[0.08] backdrop-blur-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">TOTAL EVENT VOLUME</span>
                <Terminal className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-black font-mono text-cyan-400 mt-2">
                {logsTotal.toLocaleString()}
              </p>
              <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-500 mt-1">
                <span>Page {logsPage} of {totalPages}</span>
              </div>
            </div>

            <div className="rounded-xl p-4 bg-[#0A101D]/90 border border-red-500/20 backdrop-blur-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-red-400">SECURITY BLOCKS / DROPS</span>
                <ShieldAlert className="w-4 h-4 text-red-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-black font-mono text-red-400 mt-2">
                {logStats.securityBlocksCount.toLocaleString()}
              </p>
              <div className="flex items-center gap-1 text-[10px] font-mono text-red-400/80 mt-1">
                <span>WAF &amp; IDS Enforcement</span>
              </div>
            </div>

            <div className="rounded-xl p-4 bg-[#0A101D]/90 border border-yellow-500/20 backdrop-blur-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-yellow-400">FLAGGED WARNINGS</span>
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-black font-mono text-yellow-400 mt-2">
                {logStats.warningsCount.toLocaleString()}
              </p>
              <div className="flex items-center gap-1 text-[10px] font-mono text-yellow-400/80 mt-1">
                <span>Failed auth &amp; anomalies</span>
              </div>
            </div>

            <div className="rounded-xl p-4 bg-[#0A101D]/90 border border-[#CCFF00]/20 backdrop-blur-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#CCFF00]">STREAM RADAR</span>
                <span className="flex h-2 w-2 relative">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${autoRefreshLogs ? "bg-[#CCFF00]" : "bg-zinc-600"}`} />
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${autoRefreshLogs ? "bg-[#CCFF00]" : "bg-zinc-500"}`} />
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl sm:text-3xl font-black font-mono text-[#CCFF00]">
                  {autoRefreshLogs ? "LIVE" : "PAUSED"}
                </span>
                <span className="text-xs font-mono text-zinc-400">{autoRefreshLogs ? "(5s sync)" : "Manual"}</span>
              </div>
              <div className="text-[10px] font-mono text-zinc-500 mt-1">
                OWASP Level 2 Telemetry Feed
              </div>
            </div>
          </div>

          {/* Master Logs Control Matrix */}
          <div className="rounded-2xl bg-black/60 border border-white/[0.08] p-4 backdrop-blur-md space-y-3">
            {/* Top Bar: Search, View Mode, Live Stream Toggle, Export */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-[260px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  value={logsSearch}
                  onChange={(e) => {
                    setLogsSearch(e.target.value);
                    setLogsPage(1);
                  }}
                  placeholder="Search user, email, public/private IP, rule ID, action..."
                  className="w-full pl-10 pr-9 py-2 rounded-xl bg-black/60 border border-white/[0.1] text-xs font-mono text-white placeholder-zinc-500 outline-none focus:border-[#CCFF00]/50 transition-all shadow-inner"
                />
                {logsSearch && (
                  <button
                    onClick={() => {
                      setLogsSearch("");
                      setLogsPage(1);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs font-mono"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* View Mode Switcher */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                {[
                  { mode: "table" as LogViewMode, icon: List, label: "Table" },
                  { mode: "terminal" as LogViewMode, icon: Terminal, label: "CRT Stream" },
                  { mode: "timeline" as LogViewMode, icon: Clock, label: "Timeline" },
                  { mode: "analytics" as LogViewMode, icon: BarChart2, label: "Metrics" },
                ].map((vm) => {
                  const Icon = vm.icon;
                  const isSelected = logsViewMode === vm.mode;
                  return (
                    <button
                      key={vm.mode}
                      onClick={() => setLogsViewMode(vm.mode)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                        isSelected
                          ? "bg-[#CCFF00] text-black shadow-[0_0_10px_rgba(204,255,0,0.3)]"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{vm.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Live Stream & Exports */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAutoRefreshLogs(!autoRefreshLogs)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold border transition-all ${
                    autoRefreshLogs
                      ? "bg-[#CCFF00]/15 border-[#CCFF00]/40 text-[#CCFF00] shadow-[0_0_12px_rgba(204,255,0,0.2)]"
                      : "bg-white/[0.03] border-white/[0.08] text-zinc-400 hover:text-white"
                  }`}
                >
                  <Radio className={`w-3.5 h-3.5 ${autoRefreshLogs ? "animate-pulse" : ""}`} />
                  <span>{autoRefreshLogs ? "LIVE ON" : "LIVE OFF"}</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={handleExportJSON}
                    title="Export Logs as JSON"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold bg-white/[0.03] border border-white/[0.08] text-zinc-300 hover:text-white hover:border-[#CCFF00]/30 transition-all"
                  >
                    <Download className="w-3.5 h-3.5 text-[#CCFF00]" />
                    <span className="hidden md:inline">JSON</span>
                  </button>
                  <button
                    onClick={handleExportCSV}
                    title="Export Logs as CSV"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold bg-white/[0.03] border border-white/[0.08] text-zinc-300 hover:text-white hover:border-cyan-400/30 transition-all"
                  >
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="hidden md:inline">CSV</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Dropdowns Row */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/[0.06]">
              {/* Severity Filter */}
              <div className="flex items-center gap-1 text-xs font-mono text-zinc-400">
                <span className="text-[10px] text-zinc-500 uppercase">Severity:</span>
                <select
                  value={logsSeverity}
                  onChange={(e) => {
                    setLogsSeverity(e.target.value);
                    setLogsPage(1);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-black/60 border border-white/[0.08] text-xs font-mono text-zinc-200 outline-none focus:border-[#CCFF00]/40"
                >
                  <option value="">All Severities</option>
                  <option value="SECURITY_BLOCK">🛡️ Security Block</option>
                  <option value="EMERGENCY">⚡ Emergency</option>
                  <option value="CRITICAL">⚠️ Critical</option>
                  <option value="WARN">⚡ Warning</option>
                  <option value="INFO">ℹ️ Info</option>
                </select>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1 text-xs font-mono text-zinc-400">
                <span className="text-[10px] text-zinc-500 uppercase">Category:</span>
                <select
                  value={logsCategory}
                  onChange={(e) => {
                    setLogsCategory(e.target.value);
                    setLogsPage(1);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-black/60 border border-white/[0.08] text-xs font-mono text-zinc-200 outline-none focus:border-[#CCFF00]/40"
                >
                  <option value="">All Categories</option>
                  <option value="FIREWALL">Firewall &amp; WAF</option>
                  <option value="AUTH">Authentication</option>
                  <option value="SYSTEM">System &amp; Settings</option>
                  <option value="EVENTS">Events &amp; Attendance</option>
                </select>
              </div>

              {/* Outcome Filter */}
              <div className="flex items-center gap-1 text-xs font-mono text-zinc-400">
                <span className="text-[10px] text-zinc-500 uppercase">Outcome:</span>
                <select
                  value={logsOutcome}
                  onChange={(e) => {
                    setLogsOutcome(e.target.value);
                    setLogsPage(1);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-black/60 border border-white/[0.08] text-xs font-mono text-zinc-200 outline-none focus:border-[#CCFF00]/40"
                >
                  <option value="">All Outcomes</option>
                  <option value="SUCCESS">Success</option>
                  <option value="FAILED">Failed</option>
                  <option value="REJECTED">Rejected / Blocked</option>
                </select>
              </div>

              {/* Action Preset Buttons */}
              <div className="hidden xl:flex items-center gap-1 ml-auto">
                <span className="text-[10px] font-mono text-zinc-500 uppercase mr-1">Quick Presets:</span>
                {[
                  { label: "Failed Logins", action: "USER_LOGIN_FAILED" },
                  { label: "WAF Blocks", action: "WAF_ATTACK_BLOCKED" },
                  { label: "Firewall Rule", action: "FIREWALL" },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => {
                      setLogsAction(logsAction === preset.action ? "" : preset.action);
                      setLogsPage(1);
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all ${
                      logsAction === preset.action
                        ? "bg-[#CCFF00]/20 border-[#CCFF00]/50 text-[#CCFF00]"
                        : "bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Clear All Filters Button */}
              {hasActiveFilters && (
                <button
                  onClick={resetAllFilters}
                  className="px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono hover:bg-red-500/20 transition-all ml-auto"
                >
                  Clear Filters ✕
                </button>
              )}
            </div>
          </div>

          {/* ── LOGS VIEW MODE 1: STRUCTURED ENTERPRISE TABLE ── */}
          {logsViewMode === "table" && (
            <div className="rounded-2xl bg-[#0A101D]/90 border border-white/[0.08] shadow-2xl overflow-hidden backdrop-blur-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-white/[0.08] bg-black/60 text-zinc-400 uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">TIMESTAMP</th>
                      <th className="py-3 px-4">SEVERITY</th>
                      <th className="py-3 px-4">EVENT ACTION</th>
                      <th className="py-3 px-4">CATEGORY</th>
                      <th className="py-3 px-4">PUBLIC IP (GATEWAY)</th>
                      <th className="py-3 px-4">LAN PRIVATE IP</th>
                      <th className="py-3 px-4">ACTOR / IDENTITY</th>
                      <th className="py-3 px-4">OUTCOME</th>
                      <th className="py-3 px-4 text-right">FORENSIC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {loadingLogs ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-zinc-400">
                          <div className="flex flex-col items-center justify-center gap-3">
                            <RefreshCw className="w-6 h-6 animate-spin text-[#CCFF00]" />
                            <span className="font-mono text-xs text-zinc-300">Fetching Level 2 Forensic Telemetry Stream...</span>
                          </div>
                        </td>
                      </tr>
                    ) : logs.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-zinc-500">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <AlertCircle className="w-6 h-6 text-zinc-600" />
                            <p className="font-mono text-sm text-zinc-300 font-bold">No telemetry logs matched filter criteria.</p>
                            <p className="text-xs text-zinc-500 font-mono">Try adjusting your search keywords, severity, or category filters.</p>
                            {hasActiveFilters && (
                              <button
                                onClick={resetAllFilters}
                                className="mt-2 px-3 py-1.5 rounded-lg bg-[#CCFF00]/10 border border-[#CCFF00]/30 text-[#CCFF00] text-xs font-mono"
                              >
                                Reset All Filters
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => {
                        const isExpanded = expandedLogId === log.id;
                        const dateObj = new Date(log.createdAt);
                        const timeStr = dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
                        const dateStr = dateObj.toLocaleDateString([], { month: "short", day: "numeric" });

                        return (
                          <React.Fragment key={log.id}>
                            <tr
                              className={`hover:bg-white/[0.03] transition-colors cursor-pointer ${
                                isExpanded ? "bg-white/[0.04]" : ""
                              }`}
                              onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                            >
                              {/* Timestamp */}
                              <td className="py-3 px-4 whitespace-nowrap text-zinc-400">
                                <div className="flex flex-col">
                                  <span className="text-white font-bold">{timeStr}</span>
                                  <span className="text-[10px] text-zinc-500">{dateStr}</span>
                                </div>
                              </td>

                              {/* Severity */}
                              <td className="py-3 px-4 whitespace-nowrap">
                                {getSeverityBadge(log.severity)}
                              </td>

                              {/* Action & Rule */}
                              <td className="py-3 px-4">
                                <div className="flex flex-col">
                                  <span className="font-bold text-white truncate max-w-[200px]" title={log.action}>
                                    {log.action}
                                  </span>
                                  {log.ruleId && (
                                    <span className="text-[9px] text-[#CCFF00] font-mono mt-0.5">
                                      Rule: {log.ruleId}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Category */}
                              <td className="py-3 px-4 whitespace-nowrap">
                                {getCategoryBadge(log.category)}
                              </td>

                              {/* Public IP */}
                              <td className="py-3 px-4 text-zinc-300 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                  <span className="font-mono">{log.publicIp || log.ipAddress || "127.0.0.1"}</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyToClipboard(log.publicIp || log.ipAddress || "127.0.0.1", "Public IP");
                                    }}
                                    className="p-1 rounded text-zinc-500 hover:text-white"
                                    title="Copy IP"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>

                              {/* LAN Private IP */}
                              <td className="py-3 px-4 text-zinc-400 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <Wifi className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                  <span className="font-mono">{log.privateIp || log.localIp || "192.168.1.100"}</span>
                                </div>
                              </td>

                              {/* Actor / Identity */}
                              <td className="py-3 px-4">
                                {log.user ? (
                                  <div className="flex flex-col min-w-0 max-w-[140px]">
                                    <span className="text-white font-bold truncate" title={log.user.name}>
                                      {log.user.name}
                                    </span>
                                    <span className="text-[10px] text-zinc-400 truncate font-mono" title={log.user.email}>
                                      {log.user.email}
                                    </span>
                                    <span className="text-[9px] text-[#CCFF00] font-mono uppercase">
                                      {log.user.role} {log.user.role === "FACULTY" && log.user.employeeId ? `· EMP: ${log.user.employeeId}` : log.user.studentId ? `· ID: ${log.user.studentId}` : ""}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-zinc-500 text-[11px] italic">Anonymous Gateway</span>
                                )}
                              </td>

                              {/* Outcome */}
                              <td className="py-3 px-4 whitespace-nowrap">
                                {getOutcomeBadge(log.outcome)}
                              </td>

                              {/* Forensic Button */}
                              <td className="py-3 px-4 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedRawLog(log);
                                    }}
                                    className="p-1.5 rounded-lg bg-black/60 border border-white/[0.08] text-zinc-300 hover:text-white hover:border-[#CCFF00]/40 transition-all"
                                    title="View Raw JSON"
                                  >
                                    <Code className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedLogId(isExpanded ? null : log.id);
                                    }}
                                    className={`px-2.5 py-1 rounded-lg border text-[10px] font-mono font-bold transition-all ${
                                      isExpanded
                                        ? "bg-[#CCFF00] text-black border-[#CCFF00]"
                                        : "bg-black/60 border-white/[0.1] text-zinc-300 hover:text-white"
                                    }`}
                                  >
                                    {isExpanded ? "COLLAPSE" : "INSPECT"}
                                  </button>
                                </div>
                              </td>
                            </tr>

                            {/* Expanded Forensic Drawer */}
                            {isExpanded && (
                              <tr className="bg-black/80 border-y border-[#CCFF00]/20">
                                <td colSpan={9} className="p-4 sm:p-5">
                                  <motion.div
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-4"
                                  >
                                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
                                      <div className="flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-[#CCFF00]" />
                                        <span className="text-xs font-mono font-bold text-[#CCFF00] uppercase tracking-wider">
                                          FORENSIC TELEMETRY CONTEXT &amp; HARDENED AUDIT TRAIL
                                        </span>
                                        <span className="text-[10px] font-mono text-zinc-500">ID: {log.id}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => copyToClipboard(JSON.stringify(log, null, 2), "Complete Log")}
                                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/[0.05] border border-white/[0.1] text-[10px] text-zinc-300 hover:text-white"
                                        >
                                          <Copy className="w-3 h-3" /> Copy Log JSON
                                        </button>
                                      </div>
                                    </div>

                                    {/* Forensic Info Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
                                      <div className="p-3 rounded-xl bg-black/60 border border-white/[0.06]">
                                        <span className="text-[10px] text-zinc-500 block uppercase">CLIENT ENVIRONMENT</span>
                                        <div className="text-zinc-200 mt-1 space-y-0.5">
                                          <p>OS: <span className="text-white font-bold">{log.os || "Unknown"}</span></p>
                                          <p>Browser: <span className="text-white font-bold">{log.browser || "Unknown"}</span></p>
                                          <p>Device: <span className="text-white font-bold">{log.device || "Desktop/Workstation"}</span></p>
                                        </div>
                                      </div>

                                      <div className="p-3 rounded-xl bg-black/60 border border-white/[0.06]">
                                        <span className="text-[10px] text-zinc-500 block uppercase">NETWORK ORIGIN</span>
                                        <div className="text-zinc-200 mt-1 space-y-0.5">
                                          <p>Public IP: <span className="text-cyan-400 font-bold">{log.publicIp || log.ipAddress || "127.0.0.1"}</span></p>
                                          <p>Private LAN: <span className="text-emerald-400 font-bold">{log.privateIp || log.localIp || "192.168.1.100"}</span></p>
                                          <p>Gateway: <span className="text-zinc-400">Campus Egress Gateway</span></p>
                                        </div>
                                      </div>

                                      <div className="p-3 rounded-xl bg-black/60 border border-white/[0.06]">
                                        <span className="text-[10px] text-zinc-500 block uppercase">AUTHENTICATED IDENTITY</span>
                                        <div className="text-zinc-200 mt-1 space-y-0.5">
                                          <p>Name: <span className="text-white font-bold">{log.user?.name || "Anonymous Gateway"}</span></p>
                                          <p>Role: <span className="text-[#CCFF00] font-bold">{log.user?.role || "NONE"}</span></p>
                                          <p>ID: <span className="text-zinc-400">{log.user?.role === "FACULTY" ? log.user.employeeId || "EMP-N/A" : log.user?.studentId || log.user?.id?.slice(0, 8) || "N/A"}</span></p>
                                        </div>
                                      </div>

                                      <div className="p-3 rounded-xl bg-black/60 border border-white/[0.06] flex flex-col justify-between">
                                        <div>
                                          <span className="text-[10px] text-zinc-500 block uppercase">SECURITY ACTIONS</span>
                                          <p className="text-[11px] text-zinc-400 mt-1">
                                            Outcome: <span className="font-bold text-white">{log.outcome}</span>
                                          </p>
                                        </div>
                                        {log.publicIp && log.publicIp !== "127.0.0.1" && (
                                          <button
                                            onClick={() => void handleToggleBlockIp(log.publicIp!, false)}
                                            className="mt-2 w-full py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-[10px] font-mono font-bold hover:bg-red-500/25 transition-all flex items-center justify-center gap-1.5"
                                          >
                                            <Ban className="w-3 h-3" /> Ban Public IP ({log.publicIp})
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    {/* Raw Payload Context */}
                                    <div className="space-y-1.5">
                                      <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                                        <span className="font-bold text-zinc-300">REQUEST CONTEXT &amp; PAYLOAD LOG</span>
                                        <span>User-Agent: {log.userAgent || "N/A"}</span>
                                      </div>
                                      <pre className="p-3.5 rounded-xl bg-[#05080E] border border-white/[0.08] text-[11px] text-[#00F5D4] font-mono overflow-x-auto max-h-60 leading-relaxed shadow-inner">
                                        {JSON.stringify(log.payloadContext || log.context || {}, null, 2)}
                                      </pre>
                                    </div>
                                  </motion.div>
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

              {/* Pagination Controls */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-t border-white/[0.08] bg-black/60 font-mono text-xs">
                <div className="flex items-center gap-3 text-zinc-400">
                  <span>
                    Showing <strong className="text-white">{logs.length > 0 ? (logsPage - 1) * logsLimit + 1 : 0}</strong> to{" "}
                    <strong className="text-white">{Math.min(logsPage * logsLimit, logsTotal)}</strong> of{" "}
                    <strong className="text-[#CCFF00]">{logsTotal.toLocaleString()}</strong> events
                  </span>

                  <div className="flex items-center gap-1.5 ml-2">
                    <span className="text-[10px] text-zinc-500 uppercase">Page Size:</span>
                    <select
                      value={logsLimit}
                      onChange={(e) => {
                        setLogsLimit(Number(e.target.value));
                        setLogsPage(1);
                      }}
                      className="px-2 py-1 rounded bg-black/80 border border-white/[0.1] text-zinc-300 text-xs outline-none"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setLogsPage(1)}
                    disabled={logsPage <= 1 || loadingLogs}
                    className="px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/[0.08] text-zinc-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none"
                  >
                    First
                  </button>
                  <button
                    onClick={() => setLogsPage((prev) => Math.max(1, prev - 1))}
                    disabled={logsPage <= 1 || loadingLogs}
                    className="p-1.5 rounded-lg bg-black/60 border border-white/[0.08] text-zinc-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="px-3 py-1 rounded-lg bg-[#CCFF00]/10 border border-[#CCFF00]/30 text-[#CCFF00] font-bold">
                    {logsPage} / {totalPages}
                  </div>

                  <button
                    onClick={() => setLogsPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={logsPage >= totalPages || loadingLogs}
                    className="p-1.5 rounded-lg bg-black/60 border border-white/[0.08] text-zinc-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setLogsPage(totalPages)}
                    disabled={logsPage >= totalPages || loadingLogs}
                    className="px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/[0.08] text-zinc-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none"
                  >
                    Last
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── LOGS VIEW MODE 2: CRT CYBER TERMINAL STREAM ── */}
          {logsViewMode === "terminal" && (
            <div className="rounded-2xl bg-[#03060C] border border-[#00F5D4]/20 shadow-2xl overflow-hidden font-mono text-xs">
              {/* Terminal Header */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-black/80 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-zinc-400 text-[11px] ml-2">sentinal-telemetry-l2: ~ /audit/stream.log</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setTerminalAutoscroll(!terminalAutoscroll)}
                    className={`text-[10px] px-2 py-0.5 rounded border transition-all ${
                      terminalAutoscroll
                        ? "bg-[#00F5D4]/20 border-[#00F5D4]/40 text-[#00F5D4]"
                        : "border-white/[0.1] text-zinc-500"
                    }`}
                  >
                    Auto-Scroll: {terminalAutoscroll ? "ON" : "OFF"}
                  </button>
                  <span className="text-[10px] text-zinc-500">Lines: {logs.length}</span>
                </div>
              </div>

              {/* Terminal Body */}
              <div className="p-4 overflow-y-auto max-h-[580px] space-y-1 bg-[#020408] text-zinc-300 font-mono text-[11px] leading-relaxed">
                {logs.length === 0 ? (
                  <div className="py-8 text-center text-zinc-600">
                    &gt; No stream events in current buffer.
                  </div>
                ) : (
                  logs.map((log, index) => {
                    const isBlock = log.severity === "SECURITY_BLOCK" || ["REJECTED", "BLOCKED"].includes(log.outcome);
                    const isWarn = log.severity === "WARN" || log.outcome === "FAILED";

                    return (
                      <div
                        key={log.id}
                        onClick={() => setSelectedRawLog(log)}
                        className={`group flex items-start gap-2 py-1 px-2 rounded hover:bg-white/[0.05] cursor-pointer transition-colors ${
                          isBlock ? "text-red-400 bg-red-500/5" : isWarn ? "text-yellow-400 bg-yellow-500/5" : "text-zinc-300"
                        }`}
                      >
                        <span className="text-zinc-600 select-none w-7 shrink-0 text-right">{index + 1}</span>
                        <span className="text-zinc-500 select-none">[{new Date(log.createdAt).toISOString().slice(11, 19)}]</span>
                        <span
                          className={`font-bold shrink-0 ${
                            isBlock ? "text-red-400" : isWarn ? "text-yellow-400" : "text-cyan-400"
                          }`}
                        >
                          [{log.severity || (isBlock ? "SEC_BLOCK" : isWarn ? "WARN" : "INFO")}]
                        </span>
                        <span className="text-white font-bold">{log.action}</span>
                        <span className="text-zinc-500">| IP:</span>
                        <span className="text-cyan-300">{log.publicIp || log.ipAddress || "127.0.0.1"}</span>
                        <span className="text-zinc-500">| User:</span>
                        <span className="text-emerald-400">{log.user?.email || "anonymous"}</span>
                        <span className="text-zinc-500">| Outcome:</span>
                        <span className={`font-bold ${isBlock ? "text-red-400" : log.outcome === "SUCCESS" ? "text-emerald-400" : "text-yellow-400"}`}>
                          {log.outcome}
                        </span>
                        <span className="ml-auto opacity-0 group-hover:opacity-100 text-[10px] text-[#CCFF00]">
                          [INSPECT]
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={terminalEndRef} />
              </div>
            </div>
          )}

          {/* ── LOGS VIEW MODE 3: CHRONO TIMELINE ── */}
          {logsViewMode === "timeline" && (
            <div className="rounded-2xl bg-[#0A101D]/90 border border-white/[0.08] p-5 shadow-2xl backdrop-blur-md">
              <div className="relative border-l-2 border-white/[0.1] ml-4 sm:ml-6 space-y-6">
                {logs.length === 0 ? (
                  <div className="py-8 text-center text-zinc-500">No events to display on timeline.</div>
                ) : (
                  logs.map((log) => {
                    const isBlock = log.severity === "SECURITY_BLOCK" || ["REJECTED", "BLOCKED"].includes(log.outcome);
                    const isWarn = log.severity === "WARN" || log.outcome === "FAILED";

                    return (
                      <div key={log.id} className="relative pl-6 sm:pl-8 group">
                        {/* Dot indicator */}
                        <div
                          className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 border-[#0A101D] transition-transform group-hover:scale-125 ${
                            isBlock
                              ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                              : isWarn
                              ? "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.8)]"
                              : "bg-[#CCFF00] shadow-[0_0_8px_rgba(204,255,0,0.8)]"
                          }`}
                        />

                        <div className="p-4 rounded-xl bg-black/60 border border-white/[0.06] hover:border-white/[0.15] transition-all space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {getSeverityBadge(log.severity)}
                              <span className="font-bold text-white font-mono text-sm">{log.action}</span>
                            </div>
                            <span className="text-xs font-mono text-zinc-400">
                              {new Date(log.createdAt).toLocaleString()}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-zinc-300 pt-1 border-t border-white/[0.04]">
                            <div className="flex items-center gap-1.5">
                              <Globe className="w-3.5 h-3.5 text-cyan-400" />
                              <span>{log.publicIp || log.ipAddress || "127.0.0.1"}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-emerald-400" />
                              <span>{log.user ? `${log.user.name} (${log.user.role})` : "Anonymous"}</span>
                            </div>
                            <div className="ml-auto">
                              {getOutcomeBadge(log.outcome)}
                            </div>
                          </div>

                          {log.context && Object.keys(log.context).length > 0 && (
                            <pre className="mt-2 p-2 rounded bg-black/80 border border-white/[0.04] text-[10px] text-[#00F5D4] font-mono overflow-x-auto truncate">
                              {JSON.stringify(log.context)}
                            </pre>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ── LOGS VIEW MODE 4: FORENSIC ANALYTICS MATRIX ── */}
          {logsViewMode === "analytics" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-[#0A101D]/90 border border-white/[0.08] shadow-2xl backdrop-blur-md space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-400" />
                    SEVERITY PROFILE DISTRIBUTION
                  </h3>
                  <span className="text-[10px] font-mono text-zinc-500">Current View Filter</span>
                </div>
                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <div className="flex justify-between text-zinc-300 mb-1">
                      <span>Security Blocks / Drops</span>
                      <span className="text-red-400 font-bold">{logStats.securityBlocksCount}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-black/60 overflow-hidden">
                      <div
                        className="h-full bg-red-500 rounded-full"
                        style={{ width: `${logsTotal > 0 ? (logStats.securityBlocksCount / logsTotal) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-zinc-300 mb-1">
                      <span>Flagged Warnings / Fails</span>
                      <span className="text-yellow-400 font-bold">{logStats.warningsCount}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-black/60 overflow-hidden">
                      <div
                        className="h-full bg-yellow-500 rounded-full"
                        style={{ width: `${logsTotal > 0 ? (logStats.warningsCount / logsTotal) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-zinc-300 mb-1">
                      <span>Success / Info Events</span>
                      <span className="text-emerald-400 font-bold">{logStats.successCount}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-black/60 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${logsTotal > 0 ? (logStats.successCount / logsTotal) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#0A101D]/90 border border-white/[0.08] shadow-2xl backdrop-blur-md space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    RECENT NETWORK EGRESS ORIGINS
                  </h3>
                  <span className="text-[10px] font-mono text-zinc-500">Live Sample</span>
                </div>
                <div className="space-y-2 font-mono text-xs">
                  {Array.from(new Set(logs.map((l) => l.publicIp || l.ipAddress || "127.0.0.1")))
                    .slice(0, 5)
                    .map((ip) => {
                      const count = logs.filter((l) => (l.publicIp || l.ipAddress || "127.0.0.1") === ip).length;
                      return (
                        <div
                          key={ip}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-black/50 border border-white/[0.04]"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-cyan-400" />
                            <span className="text-white font-bold">{ip}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-400">{count} hits</span>
                            <button
                              onClick={() => {
                                setLogsSearch(ip);
                                setLogsViewMode("table");
                              }}
                              className="px-2 py-0.5 rounded bg-white/[0.05] text-[10px] text-[#CCFF00] hover:bg-[#CCFF00]/10"
                            >
                              Filter IP
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 2: OVERVIEW ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl bg-[#0A101D]/90 border border-white/[0.08] p-5 backdrop-blur-md">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">24H BLOCKED THREATS</span>
              <p className="text-2xl sm:text-3xl font-black font-mono text-red-400 mt-2">
                {telemetry?.attacksBlocked24h || 0}
              </p>
            </div>
            <div className="rounded-2xl bg-[#0A101D]/90 border border-white/[0.08] p-5 backdrop-blur-md">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">ACTIVE FIREWALL POLICIES</span>
              <p className="text-2xl sm:text-3xl font-black font-mono text-[#CCFF00] mt-2">
                {telemetry?.activeFirewallRulesCount || 7}
              </p>
            </div>
            <div className="rounded-2xl bg-[#0A101D]/90 border border-white/[0.08] p-5 backdrop-blur-md">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">BLOCKED PUBLIC IPS</span>
              <p className="text-2xl sm:text-3xl font-black font-mono text-orange-400 mt-2">
                {telemetry?.blockedIpsCount || 0}
              </p>
            </div>
            <div className="rounded-2xl bg-[#0A101D]/90 border border-white/[0.08] p-5 backdrop-blur-md">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">TELEMETRY LOG VOLUME</span>
              <p className="text-2xl sm:text-3xl font-black font-mono text-cyan-400 mt-2">
                {telemetry?.totalAuditLogs || 0}
              </p>
            </div>
          </div>

          {/* System Environment Telemetry */}
          <div className="rounded-2xl bg-[#0A101D]/90 border border-white/[0.08] p-6 backdrop-blur-md space-y-4">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-[#CCFF00]" />
              <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                HOST ENVIRONMENT &amp; OWASP ASVS LEVEL 2 TELEMETRY
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06]">
                <p className="text-zinc-500">SERVER UPTIME</p>
                <p className="text-white font-bold mt-1 text-sm">
                  {Math.floor((systemMetrics?.uptimeSeconds || 0) / 3600)}h {Math.floor(((systemMetrics?.uptimeSeconds || 0) % 3600) / 60)}m
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06]">
                <p className="text-zinc-500">MEMORY CONSUMPTION</p>
                <p className="text-white font-bold mt-1 text-sm">{systemMetrics?.rssMB || 0} MB RSS</p>
              </div>
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06]">
                <p className="text-zinc-500">ENGINE RUNTIME</p>
                <p className="text-white font-bold mt-1 text-sm">{systemMetrics?.nodeVersion} ({systemMetrics?.platform})</p>
              </div>
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06]">
                <p className="text-zinc-500">SECURITY COMPLIANCE</p>
                <p className="text-[#CCFF00] font-bold mt-1 text-sm">100% Level 2 OWASP</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 3: FIREWALL RULES POLICY ENGINE ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "firewall" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-5 rounded-2xl bg-[#0A101D]/90 border border-white/[0.08] backdrop-blur-md">
            <div>
              <h2 className="text-sm font-mono font-bold uppercase text-white">
                DYNAMIC FIREWALL POLICY RULES (LEVEL 2)
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Active real-time security rules evaluated across API routes, payloads, and public network IPs.
              </p>
            </div>
            <button
              onClick={() => setShowAddRuleModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#CCFF00] text-black text-xs font-mono font-bold hover:bg-[#CCFF00]/90 transition-all shadow-[0_0_12px_rgba(204,255,0,0.2)]"
            >
              <Plus className="w-4 h-4" />
              CREATE POLICY RULE
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {firewallRules.map((rule) => (
              <div
                key={rule.id}
                className="p-5 rounded-2xl bg-[#0A101D]/90 border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-md"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-white font-mono">{rule.name}</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-zinc-800 text-zinc-300">
                      {rule.id}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-purple-500/10 border border-purple-500/30 text-purple-400">
                      {rule.category}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-red-500/10 text-red-400 font-bold">
                      {rule.action}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-mono">{rule.description}</p>
                  {rule.pattern && (
                    <div className="p-2 rounded-lg bg-black/80 border border-white/[0.06] text-[10px] font-mono text-[#CCFF00] truncate max-w-2xl">
                      Pattern: {rule.pattern}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 shrink-0 font-mono">
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-500 uppercase block">THREAT HITS</span>
                    <span className="text-base font-black text-red-400">{rule.hitsCount || 0}</span>
                  </div>
                  <button
                    onClick={() => void handleToggleFirewallRule(rule.id, rule.enabled)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all ${
                      rule.enabled
                        ? "bg-[#CCFF00]/15 border-[#CCFF00]/40 text-[#CCFF00]"
                        : "bg-zinc-900 border-zinc-700 text-zinc-500"
                    }`}
                  >
                    {rule.enabled ? "ACTIVE" : "DISABLED"}
                  </button>
                  {rule.id.startsWith("FW-RULE-") && rule.category === "CUSTOM" && (
                    <button
                      onClick={() => void handleDeleteRule(rule.id)}
                      className="p-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10"
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
                className="p-6 rounded-2xl bg-[#0A101D] border border-white/[0.12] w-full max-w-xl space-y-4 shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
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
                        onChange={(e) => setNewRuleTarget(e.target.value as FirewallRule["target"])}
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
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-zinc-400 mb-1">ACTION</label>
                      <select
                        value={newRuleAction}
                        onChange={(e) => setNewRuleAction(e.target.value as FirewallRule["action"])}
                        className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/[0.08] text-white outline-none"
                      >
                        <option value="BLOCK">Block Request</option>
                        <option value="CHALLENGE">Challenge</option>
                        <option value="RATE_LIMIT">Rate Limit</option>
                        <option value="LOG_ONLY">Log Only</option>
                        <option value="ALLOW">Allow</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-zinc-400 mb-1">SEVERITY</label>
                      <select
                        value={newRuleSeverity}
                        onChange={(e) => setNewRuleSeverity(e.target.value as FirewallRule["severity"])}
                        className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/[0.08] text-white outline-none"
                      >
                        <option value="SECURITY_BLOCK">Security Block</option>
                        <option value="EMERGENCY">Emergency</option>
                        <option value="CRITICAL">Critical</option>
                        <option value="WARN">Warning</option>
                        <option value="INFO">Info</option>
                      </select>
                    </div>
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

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 4: IP SECURITY & ATTACKS ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "security" && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-[#0A101D]/90 border border-white/[0.08] backdrop-blur-md">
            <h2 className="text-sm font-mono font-bold uppercase text-white">
              PUBLIC NETWORK IP MANAGEMENT &amp; HARDENING
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Identifies public network egress gateways, private device LAN addresses, and enforces automated lockout.
            </p>
          </div>

          <div className="rounded-2xl bg-[#0A101D]/90 border border-white/[0.08] overflow-hidden backdrop-blur-md shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-black/60 text-zinc-400 uppercase text-[10px]">
                    <th className="py-3 px-4">PUBLIC NETWORK IP</th>
                    <th className="py-3 px-4">PRIVATE DEVICE LAN IP</th>
                    <th className="py-3 px-4">REQUEST COUNT</th>
                    <th className="py-3 px-4">LAST IDENTITY</th>
                    <th className="py-3 px-4">STATUS</th>
                    <th className="py-3 px-4 text-right">ACTION</th>
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
                        <td className="py-3.5 px-4 font-bold text-white">
                          <div className="flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span>{ip.publicIp || ip.ipAddress}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-zinc-300">
                          <div className="flex items-center gap-1.5">
                            <Wifi className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>{ip.privateIp || ip.localIp || "192.168.1.100"}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-zinc-400">{ip.requestCount} requests</td>
                        <td className="py-3.5 px-4 text-zinc-300">
                          {ip.lastUser ? `${ip.lastUser.name} (${ip.lastUser.role})` : "Anonymous"}
                        </td>
                        <td className="py-3.5 px-4">
                          {ip.isBlocked ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-red-500/15 border border-red-500/40 text-red-400">
                              BLOCKED BY FIREWALL
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              CLEAN
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => void handleToggleBlockIp(ip.ipAddress, ip.isBlocked)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
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

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 5: DATABASE TABLES ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "database" && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-[#0A101D]/90 border border-white/[0.08] backdrop-blur-md">
            <h2 className="text-sm font-mono font-bold uppercase text-white">
              PRISMA DATABASE SCHEMA &amp; STORAGE METRICS
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {dbTables.map((t) => (
              <div key={t.name} className="p-5 rounded-2xl bg-[#0A101D]/90 border border-white/[0.08] space-y-2 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-white">{t.name}</span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
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

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 6: SYSTEM BUGS ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "bugs" && (
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-[#0A101D]/90 border border-white/[0.08] backdrop-blur-md space-y-4">
            <h2 className="text-sm font-mono font-bold uppercase text-white">
              REPORT SYSTEM ISSUE / INCIDENT (LEVEL 2 AUDIT)
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
                  <label className="block text-zinc-400 mb-1">CATEGORY</label>
                  <select
                    value={newBugCategory}
                    onChange={(e) => setNewBugCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/[0.08] text-white outline-none"
                  >
                    <option value="PORTAL_CORE">Portal Core</option>
                    <option value="FIREWALL">Firewall / WAF</option>
                    <option value="AUTH">Authentication</option>
                    <option value="DATABASE">Database</option>
                    <option value="UI">UI / UX</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">SEVERITY</label>
                  <select
                    value={newBugSeverity}
                    onChange={(e) => setNewBugSeverity(e.target.value as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL")}
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
                <label className="block text-zinc-400 mb-1">TECHNICAL OBSERVATIONS &amp; LOGS</label>
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
                className="px-5 py-2.5 rounded-xl bg-[#CCFF00] text-black font-bold hover:bg-[#CCFF00]/90 transition-all shadow-[0_0_12px_rgba(204,255,0,0.2)]"
              >
                {submittingBug ? "Logging..." : "Submit Technical Bug Report"}
              </button>
            </form>
          </div>

          <div className="space-y-2">
            {bugs.map((b) => (
              <div key={b.id} className="p-4 rounded-xl bg-[#0A101D]/90 border border-white/[0.06] space-y-1.5">
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

      {/* ── RAW JSON INSPECTOR MODAL ── */}
      {selectedRawLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-2xl bg-[#0A101D] border border-white/[0.12] w-full max-w-2xl space-y-4 shadow-2xl font-mono"
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-[#CCFF00]" />
                <span className="text-xs font-bold text-white uppercase">RAW FORENSIC TELEMETRY JSON</span>
              </div>
              <button
                onClick={() => setSelectedRawLog(null)}
                className="text-zinc-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-black/90 border border-white/[0.06] text-xs text-[#00F5D4] overflow-x-auto max-h-[460px] leading-relaxed shadow-inner">
              {JSON.stringify(selectedRawLog, null, 2)}
            </pre>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => copyToClipboard(JSON.stringify(selectedRawLog, null, 2), "Raw JSON")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.1] text-xs text-zinc-200 hover:text-white"
              >
                <Copy className="w-3.5 h-3.5" /> Copy JSON
              </button>
              <button
                onClick={() => setSelectedRawLog(null)}
                className="px-4 py-1.5 rounded-lg bg-[#CCFF00] text-black font-bold text-xs"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
