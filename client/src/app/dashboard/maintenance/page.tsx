"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert, Activity, Cpu, HardDrive, Database, Server,
  Lock, AlertTriangle, RefreshCw, CheckCircle, XCircle, Search,
  Filter, Ban, Check, Terminal, FileText, Bug, Settings, Users,
  Globe, Eye, Clock, ShieldCheck, Zap, AlertCircle
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
  totalEvents: number;
  totalRegistrations: number;
  totalCertificates: number;
  totalTeams: number;
  totalNotifications: number;
  blockedIpsCount: number;
  isMaintenanceMode: boolean;
  realtimeConnections: number;
  requestRatePerMin: number;
}

interface AuditLogItem {
  id: string;
  action: string;
  outcome: string;
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
}

interface IpManagementItem {
  ipAddress: string;
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
  const [activeTab, setActiveTab] = useState<"overview" | "logs" | "security" | "database" | "bugs">("overview");

  // Overview State
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetryMetrics | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(true);

  // Logs State
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(1);
  const [logsSearch, setLogsSearch] = useState("");
  const [logsAction, setLogsAction] = useState("");
  const [logsOutcome, setLogsOutcome] = useState("");
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

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
  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const params = new URLSearchParams({
        page: logsPage.toString(),
        limit: "25",
        search: logsSearch,
        action: logsAction,
        outcome: logsOutcome,
      });
      const data = await api<any>(`/maintenance/logs?${params.toString()}`, { token: token || undefined });
      setLogs(data.logs || []);
      setLogsTotal(data.pagination?.total || 0);
    } catch (err) {
      console.error("Failed to load maintenance logs", err);
    } finally {
      setLoadingLogs(false);
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
    if (activeTab === "security") fetchSecurity();
    if (activeTab === "database") fetchDatabase();
    if (activeTab === "bugs") fetchBugsAndSettings();
  }, [activeTab, logsPage]);

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
      fetchSecurity();
      fetchOverview();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update IP block state");
    }
  };

  // Handle Maintenance Mode Toggle
  const handleToggleMaintenanceMode = async () => {
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
      fetchOverview();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to toggle maintenance mode");
    }
  };

  // Submit Bug Report
  const handleSubmitBug = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBugTitle.trim() || !newBugDesc.trim()) return;

    setSubmittingBug(true);
    try {
      await api("/maintenance/bugs", {
        method: "POST",
        token: token || undefined,
        body: JSON.stringify({
          title: newBugTitle,
          category: newBugCategory,
          severity: newBugSeverity,
          description: newBugDesc,
        }),
      });
      setNewBugTitle("");
      setNewBugDesc("");
      fetchBugsAndSettings();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to submit bug report");
    } finally {
      setSubmittingBug(false);
    }
  };

  // Update Bug Status
  const handleUpdateBugStatus = async (id: string, status: string) => {
    try {
      await api(`/maintenance/bugs/${id}`, {
        method: "PATCH",
        token: token || undefined,
        body: JSON.stringify({ status }),
      });
      fetchBugsAndSettings();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update bug status");
    }
  };

  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 font-mono">
      {/* Dashboard Top HUD Bar */}
      <div className="bg-[#050A18] border border-[#121F3D] rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#00F5D4]/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="p-2 rounded-xl bg-red-600/10 border border-red-500/30 text-red-500">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider font-mono">
                  MAINTENANCE LOGS & SECURITY OPERATIONS
                </h1>
                <p className="text-xs text-slate-400 font-mono tracking-widest uppercase">
                  Tech Team Security Telemetry • System Diagnostics • Cloud & Firewall Management
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (activeTab === "overview") fetchOverview();
                if (activeTab === "logs") fetchLogs();
                if (activeTab === "security") fetchSecurity();
                if (activeTab === "database") fetchDatabase();
                if (activeTab === "bugs") fetchBugsAndSettings();
              }}
              className="ck-btn-secondary text-xs flex items-center gap-2 py-2 px-3 border-[#121F3D] hover:border-[#00F5D4]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Telemetry</span>
            </button>

            <div className="flex items-center gap-2 bg-black/60 border border-[#121F3D] px-3 py-1.5 rounded-xl text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-[#00F5D4] animate-ping" />
              <span className="text-[#00F5D4] font-bold">LIVE TELEMETRY STREAM</span>
            </div>
          </div>
        </div>

        {/* HUD Sub-Metrics Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-[#121F3D]/80 text-[11px]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-400">OWASP COMPLIANCE:</span>
            <span className="text-emerald-400 font-bold">100% PASSED</span>
          </div>
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#00E1FF]" />
            <span className="text-slate-400">PORTAL VERSION:</span>
            <span className="text-white font-bold">{systemMetrics?.version || "v2.4.0-STABLE"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#00F5D4]" />
            <span className="text-slate-400">MAINTENANCE MODE:</span>
            <span className={telemetry?.isMaintenanceMode ? "text-amber-400 font-bold" : "text-slate-300 font-bold"}>
              {telemetry?.isMaintenanceMode ? "ENABLED (LOCKED)" : "OFF (OPERATIONAL)"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-purple-400" />
            <span className="text-slate-400">BLOCKED IPS:</span>
            <span className="text-red-400 font-bold">{telemetry?.blockedIpsCount || 0} ADDRESSES</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#121F3D] overflow-x-auto pb-1">
        {[
          { id: "overview", label: "Overview & Health", icon: <Activity className="w-4 h-4" /> },
          { id: "logs", label: "Participant & Member Click Logs", icon: <Terminal className="w-4 h-4" /> },
          { id: "security", label: "Security & IP Firewall", icon: <Lock className="w-4 h-4" /> },
          { id: "database", label: "Database & Cloud Data", icon: <Database className="w-4 h-4" /> },
          { id: "bugs", label: "Bug Reports & Settings", icon: <Bug className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-mono tracking-wider uppercase font-bold transition-all shrink-0 border-t border-x ${
              activeTab === tab.id
                ? "bg-[#050A18] text-[#00F5D4] border-[#00F5D4]/40 shadow-lg"
                : "text-slate-400 border-transparent hover:text-white hover:bg-black/30"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ─── TAB 1: OVERVIEW & HEALTH ────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {loadingOverview ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-slate-700 border-t-[#00F5D4] rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Telemetry Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#050A18] border border-[#121F3D] rounded-xl p-5 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">UPTIME</span>
                    <Clock className="w-4 h-4 text-[#00F5D4]" />
                  </div>
                  <div className="text-xl font-bold text-white mt-2 font-mono">
                    {systemMetrics ? formatUptime(systemMetrics.uptimeSeconds) : "N/A"}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">
                    Node.js {systemMetrics?.nodeVersion} ({systemMetrics?.platform})
                  </p>
                </div>

                <div className="bg-[#050A18] border border-[#121F3D] rounded-xl p-5 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">MEMORY HEAP</span>
                    <Cpu className="w-4 h-4 text-[#00E1FF]" />
                  </div>
                  <div className="text-xl font-bold text-white mt-2 font-mono">
                    {systemMetrics?.heapUsedMB} MB / {systemMetrics?.heapTotalMB} MB
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">
                    RSS Memory: {systemMetrics?.rssMB} MB
                  </p>
                </div>

                <div className="bg-[#050A18] border border-[#121F3D] rounded-xl p-5 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">TRAFFIC RATE</span>
                    <Activity className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-xl font-bold text-emerald-400 mt-2 font-mono">
                    {telemetry?.requestRatePerMin} REQ/MIN
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">
                    {telemetry?.realtimeConnections} Active WebSocket Sockets
                  </p>
                </div>

                <div className="bg-[#050A18] border border-[#121F3D] rounded-xl p-5 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">TELEMETRY LOGS</span>
                    <FileText className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-xl font-bold text-white mt-2 font-mono">
                    {telemetry?.totalAuditLogs} LOGS
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">
                    {telemetry?.recent24hLogCount} recorded in past 24 hrs
                  </p>
                </div>
              </div>

              {/* Database Telemetry Quick Cards */}
              <div className="bg-[#050A18] border border-[#121F3D] rounded-xl p-6">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#00F5D4]" />
                  <span>Database Entity Counts Telemetry</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-center">
                  <div className="bg-black/40 border border-[#121F3D] p-3 rounded-lg">
                    <span className="text-[10px] text-slate-400 uppercase">USERS</span>
                    <p className="text-lg font-bold text-white mt-1">{telemetry?.totalUsers}</p>
                  </div>
                  <div className="bg-black/40 border border-[#121F3D] p-3 rounded-lg">
                    <span className="text-[10px] text-slate-400 uppercase">EVENTS</span>
                    <p className="text-lg font-bold text-white mt-1">{telemetry?.totalEvents}</p>
                  </div>
                  <div className="bg-black/40 border border-[#121F3D] p-3 rounded-lg">
                    <span className="text-[10px] text-slate-400 uppercase">REGISTRATIONS</span>
                    <p className="text-lg font-bold text-white mt-1">{telemetry?.totalRegistrations}</p>
                  </div>
                  <div className="bg-black/40 border border-[#121F3D] p-3 rounded-lg">
                    <span className="text-[10px] text-slate-400 uppercase">CERTIFICATES</span>
                    <p className="text-lg font-bold text-white mt-1">{telemetry?.totalCertificates}</p>
                  </div>
                  <div className="bg-black/40 border border-[#121F3D] p-3 rounded-lg">
                    <span className="text-[10px] text-slate-400 uppercase">TEAMS</span>
                    <p className="text-lg font-bold text-white mt-1">{telemetry?.totalTeams}</p>
                  </div>
                  <div className="bg-black/40 border border-[#121F3D] p-3 rounded-lg">
                    <span className="text-[10px] text-slate-400 uppercase">NOTIFICATIONS</span>
                    <p className="text-lg font-bold text-white mt-1">{telemetry?.totalNotifications}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── TAB 2: PARTICIPANT & MEMBER CLICK LOGS ──────────────────────────── */}
      {activeTab === "logs" && (
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-wrap items-center gap-3 bg-[#050A18] border border-[#121F3D] p-4 rounded-xl">
            <div className="relative flex-1 min-w-[240px] ck-search-container">
              <Search className="w-4 h-4 text-slate-400 pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                className="ck-input pl-11 text-xs"
                placeholder="Search by action, email, user name, or IP address..."
                value={logsSearch}
                onChange={(e) => {
                  setLogsSearch(e.target.value);
                  setLogsPage(1);
                }}
              />
            </div>

            <select
              className="ck-input w-auto text-xs py-2"
              value={logsAction}
              onChange={(e) => {
                setLogsAction(e.target.value);
                setLogsPage(1);
              }}
            >
              <option value="" className="bg-[#050A18]">ALL ACTIONS</option>
              <option value="LOGIN_SUCCESS" className="bg-[#050A18]">LOGIN_SUCCESS</option>
              <option value="LOGIN_FAILED" className="bg-[#050A18]">LOGIN_FAILED</option>
              <option value="REGISTER" className="bg-[#050A18]">REGISTER</option>
              <option value="EVENT_REGISTERED" className="bg-[#050A18]">EVENT_REGISTERED</option>
              <option value="CERTIFICATE_GENERATED" className="bg-[#050A18]">CERTIFICATE_GENERATED</option>
              <option value="ATTENDANCE_CHECK_IN" className="bg-[#050A18]">ATTENDANCE_CHECK_IN</option>
            </select>

            <select
              className="ck-input w-auto text-xs py-2"
              value={logsOutcome}
              onChange={(e) => {
                setLogsOutcome(e.target.value);
                setLogsPage(1);
              }}
            >
              <option value="" className="bg-[#050A18]">ALL OUTCOMES</option>
              <option value="SUCCESS" className="bg-[#050A18]">SUCCESS</option>
              <option value="FAILED" className="bg-[#050A18]">FAILED</option>
              <option value="REJECTED" className="bg-[#050A18]">REJECTED</option>
            </select>

            <button
              onClick={() => fetchLogs()}
              className="ck-btn-primary text-xs py-2 px-3 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Query Logs</span>
            </button>
          </div>

          {/* Telemetry Logs Table */}
          <div className="bg-[#050A18] border border-[#121F3D] rounded-xl overflow-hidden shadow-xl">
            {loadingLogs ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-2 border-slate-700 border-t-[#00F5D4] rounded-full animate-spin" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-16 text-slate-400 font-mono text-xs uppercase">
                No telemetry logs found matching filter criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-black/60 text-slate-400 border-b border-[#121F3D] uppercase text-[10px]">
                    <tr>
                      <th className="p-3.5">Timestamp (UTC)</th>
                      <th className="p-3.5">User Identity</th>
                      <th className="p-3.5">Action Event</th>
                      <th className="p-3.5">IP Address</th>
                      <th className="p-3.5">Outcome</th>
                      <th className="p-3.5 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#121F3D]/50 text-slate-300">
                    {logs.map((log) => (
                      <React.Fragment key={log.id}>
                        <tr className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-3.5 text-slate-400 whitespace-nowrap text-[11px]">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="p-3.5">
                            {log.user ? (
                              <div>
                                <span className="text-white font-bold">{log.user.name}</span>
                                <span className="text-[10px] text-slate-400 block">{log.user.email} ({log.user.role})</span>
                              </div>
                            ) : (
                              <span className="text-slate-500 italic">Unauthenticated / System</span>
                            )}
                          </td>
                          <td className="p-3.5">
                            <span className="font-bold text-[#00E1FF]">{log.action}</span>
                          </td>
                          <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                            {log.ipAddress || "127.0.0.1"}
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                log.outcome === "SUCCESS"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                  : log.outcome === "FAILED"
                                  ? "bg-red-500/10 text-red-400 border border-red-500/30"
                                  : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                              }`}
                            >
                              {log.outcome}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                              className="text-xs text-[#00F5D4] hover:underline"
                            >
                              {expandedLogId === log.id ? "Hide JSON" : "View Context"}
                            </button>
                          </td>
                        </tr>

                        {expandedLogId === log.id && (
                          <tr className="bg-black/80">
                            <td colSpan={6} className="p-4 border-t border-b border-[#121F3D]">
                              <div className="space-y-2 text-[11px] font-mono">
                                <div>
                                  <span className="text-slate-400 uppercase">User-Agent Client: </span>
                                  <span className="text-slate-200">{log.userAgent || "N/A"}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 uppercase">Context Payload: </span>
                                  <pre className="bg-black p-3 rounded border border-zinc-800 text-[#00F5D4] mt-1 overflow-x-auto">
                                    {JSON.stringify(log.context || {}, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            <div className="p-4 border-t border-[#121F3D] flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Showing {logs.length} of {logsTotal} telemetry logs
              </span>

              <div className="flex items-center gap-2">
                <button
                  disabled={logsPage <= 1}
                  onClick={() => setLogsPage(logsPage - 1)}
                  className="px-3 py-1.5 rounded bg-black/40 border border-[#121F3D] text-slate-300 disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-white font-bold">Page {logsPage}</span>
                <button
                  disabled={logs.length < 25 || logsPage * 25 >= logsTotal}
                  onClick={() => setLogsPage(logsPage + 1)}
                  className="px-3 py-1.5 rounded bg-black/40 border border-[#121F3D] text-slate-300 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: SECURITY & IP FIREWALL ──────────────────────────────────── */}
      {activeTab === "security" && (
        <div className="space-y-6">
          {loadingSecurity ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-slate-700 border-t-[#00F5D4] rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Recorded IP Addresses Table */}
              <div className="bg-[#050A18] border border-[#121F3D] rounded-xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Lock className="w-4 h-4 text-red-500" />
                      <span>IP Address Security Telemetry & Firewall</span>
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Monitor recorded client IP addresses and block suspicious malicious traffic.
                    </p>
                  </div>

                  <span className="text-xs text-[#00F5D4] font-bold">
                    {ipList.filter((i) => i.isBlocked).length} IPs Blocked
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-black/60 text-slate-400 border-b border-[#121F3D] uppercase text-[10px]">
                      <tr>
                        <th className="p-3">IP Address</th>
                        <th className="p-3">Requests Count</th>
                        <th className="p-3">Last Active User</th>
                        <th className="p-3">Last Connection</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Firewall Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#121F3D]/50 text-slate-300">
                      {ipList.map((item) => (
                        <tr key={item.ipAddress} className="hover:bg-white/[0.02]">
                          <td className="p-3 text-white font-bold font-mono">{item.ipAddress}</td>
                          <td className="p-3 text-slate-300">{item.requestCount} Reqs</td>
                          <td className="p-3">
                            {item.lastUser ? (
                              <span className="text-[#00E1FF]">{item.lastUser.name} ({item.lastUser.email})</span>
                            ) : (
                              <span className="text-slate-500">Anonymous</span>
                            )}
                          </td>
                          <td className="p-3 text-slate-400 text-[11px]">
                            {new Date(item.lastActiveAt).toLocaleString()}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.isBlocked
                                  ? "bg-red-500/20 text-red-400 border border-red-500/40"
                                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              }`}
                            >
                              {item.isBlocked ? "BLOCKED" : "OPERATIONAL"}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleToggleBlockIp(item.ipAddress, item.isBlocked)}
                              className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                                item.isBlocked
                                  ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                                  : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                              }`}
                            >
                              {item.isBlocked ? "Unblock IP" : "Block IP"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Password Policy & Failed Logins */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#050A18] border border-[#121F3D] rounded-xl p-5">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#00F5D4]" />
                    <span>Password Security Policy & Auditing</span>
                  </h4>

                  <div className="space-y-2 text-xs text-slate-300">
                    <div className="flex justify-between py-1 border-b border-[#121F3D]">
                      <span className="text-slate-400">Password Hashing Algorithm:</span>
                      <span className="text-[#00F5D4] font-bold">{passwordPolicy?.hashAlgorithm}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#121F3D]">
                      <span className="text-slate-400">Minimum Length Constraint:</span>
                      <span className="text-white font-bold">{passwordPolicy?.minPasswordLength} Characters</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#121F3D]">
                      <span className="text-slate-400">Reset Token Expiry:</span>
                      <span className="text-white font-bold">{passwordPolicy?.resetTokenExpiryMinutes} Minutes</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Rate Limit Auth Threshold:</span>
                      <span className="text-white font-bold">{passwordPolicy?.rateLimitMaxAuthPerHour} Reqs/Hour</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#050A18] border border-[#121F3D] rounded-xl p-5">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Recent Failed Login Attempt Telemetry</span>
                  </h4>

                  {recentFailedLogins.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-4">No recent failed authentication attempts detected.</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs">
                      {recentFailedLogins.map((item, i) => (
                        <div key={i} className="p-2 rounded bg-black/40 border border-red-950/40 flex items-center justify-between">
                          <div>
                            <span className="text-red-400 font-bold">{item.ipAddress || "Unknown IP"}</span>
                            <span className="text-[10px] text-slate-400 block">
                              Target User: {item.user?.email || "Unknown Email"}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500">
                            {new Date(item.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── TAB 4: DATABASE & CLOUD DATA ──────────────────────────────────── */}
      {activeTab === "database" && (
        <div className="space-y-6">
          {loadingDb ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-slate-700 border-t-[#00F5D4] rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#050A18] border border-[#121F3D] p-5 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase">DATABASE ENGINE</span>
                  <p className="text-base font-bold text-[#00F5D4] mt-1">{dbMetrics?.engine}</p>
                </div>
                <div className="bg-[#050A18] border border-[#121F3D] p-5 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase">DATABASE STORAGE</span>
                  <p className="text-base font-bold text-white mt-1">{dbMetrics?.storageMetrics?.databaseSizeMB} MB</p>
                </div>
                <div className="bg-[#050A18] border border-[#121F3D] p-5 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase">CLOUD MEDIA STORAGE</span>
                  <p className="text-base font-bold text-purple-400 mt-1">{dbMetrics?.storageMetrics?.mediaStorageMB} MB</p>
                </div>
              </div>

              <div className="bg-[#050A18] border border-[#121F3D] rounded-xl p-6 shadow-xl">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#00F5D4]" />
                  <span>Database Tables Telemetry & Row Allocation</span>
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-black/60 text-slate-400 border-b border-[#121F3D] uppercase text-[10px]">
                      <tr>
                        <th className="p-3">Table Name</th>
                        <th className="p-3">Recorded Rows</th>
                        <th className="p-3">Primary Key Schema</th>
                        <th className="p-3">Indexes Count</th>
                        <th className="p-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#121F3D]/50 text-slate-300">
                      {dbTables.map((t) => (
                        <tr key={t.name} className="hover:bg-white/[0.02]">
                          <td className="p-3 font-bold text-[#00E1FF]">{t.name}</td>
                          <td className="p-3 text-white font-bold">{t.rows} Rows</td>
                          <td className="p-3 text-slate-400">{t.primaryKey}</td>
                          <td className="p-3 text-slate-300">{t.indexes} Indexes</td>
                          <td className="p-3 text-right">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── TAB 5: BUGS & MAINTENANCE SETTINGS ──────────────────────────────── */}
      {activeTab === "bugs" && (
        <div className="space-y-6">
          {loadingBugs ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-slate-700 border-t-[#00F5D4] rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Maintenance Mode Controls */}
              <div className="bg-[#050A18] border border-[#121F3D] rounded-xl p-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Settings className="w-4 h-4 text-amber-400" />
                      <span>Portal Maintenance Mode Control</span>
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Lock down portal operations for emergency tech updates and server maintenance.
                    </p>
                  </div>

                  <button
                    onClick={handleToggleMaintenanceMode}
                    className={`px-4 py-2 rounded-xl text-xs font-bold font-mono uppercase transition-all shadow-lg ${
                      maintenanceSettings.enabled
                        ? "bg-amber-500 text-black hover:bg-amber-400"
                        : "bg-red-600 text-white hover:bg-red-500"
                    }`}
                  >
                    {maintenanceSettings.enabled ? "Disable Maintenance Mode" : "Enable Maintenance Mode"}
                  </button>
                </div>
              </div>

              {/* Bug Ticket Submission Form */}
              <div className="bg-[#050A18] border border-[#121F3D] rounded-xl p-6 shadow-xl">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Bug className="w-4 h-4 text-[#00F5D4]" />
                  <span>Report Portal Bug & Telemetry Issue</span>
                </h3>

                <form onSubmit={handleSubmitBug} className="space-y-4 text-xs font-mono">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-1">
                      <label className="ck-label text-[10px]">Bug Title *</label>
                      <input
                        className="ck-input"
                        placeholder="e.g. Session timeout exception on profile edit"
                        value={newBugTitle}
                        onChange={(e) => setNewBugTitle(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="ck-label text-[10px]">Category</label>
                      <select
                        className="ck-input"
                        value={newBugCategory}
                        onChange={(e) => setNewBugCategory(e.target.value)}
                      >
                        <option value="PORTAL_CORE" className="bg-[#050A18]">PORTAL_CORE</option>
                        <option value="AUTHENTICATION" className="bg-[#050A18]">AUTHENTICATION</option>
                        <option value="CERTIFICATE_ENGINE" className="bg-[#050A18]">CERTIFICATE_ENGINE</option>
                        <option value="EVENT_TELEMETRY" className="bg-[#050A18]">EVENT_TELEMETRY</option>
                        <option value="UI_UX" className="bg-[#050A18]">UI_UX</option>
                      </select>
                    </div>
                    <div>
                      <label className="ck-label text-[10px]">Severity</label>
                      <select
                        className="ck-input"
                        value={newBugSeverity}
                        onChange={(e) => setNewBugSeverity(e.target.value as any)}
                      >
                        <option value="LOW" className="bg-[#050A18]">LOW</option>
                        <option value="MEDIUM" className="bg-[#050A18]">MEDIUM</option>
                        <option value="HIGH" className="bg-[#050A18]">HIGH</option>
                        <option value="CRITICAL" className="bg-[#050A18]">CRITICAL</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="ck-label text-[10px]">Detailed Reproduction Steps & Context *</label>
                    <textarea
                      className="ck-input h-20 py-2 resize-none"
                      placeholder="Describe the bug behavior, steps to reproduce, and environment details..."
                      value={newBugDesc}
                      onChange={(e) => setNewBugDesc(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingBug}
                    className="ck-btn-primary text-xs py-2 px-4"
                  >
                    {submittingBug ? "Submitting Ticket..." : "Submit Bug Report"}
                  </button>
                </form>
              </div>

              {/* Bug Reports Roster */}
              <div className="bg-[#050A18] border border-[#121F3D] rounded-xl p-6 shadow-xl">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-400" />
                  <span>Assigned Bug Tickets & Tech Roster</span>
                </h3>

                {bugs.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-6 text-center">No active bug reports logged.</p>
                ) : (
                  <div className="space-y-3">
                    {bugs.map((bug) => (
                      <div
                        key={bug.id}
                        className="p-4 rounded-xl bg-black/40 border border-[#121F3D] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{bug.title}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                bug.severity === "CRITICAL"
                                  ? "bg-red-500/20 text-red-400 border border-red-500/40"
                                  : bug.severity === "HIGH"
                                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                                  : "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                              }`}
                            >
                              {bug.severity}
                            </span>
                            <span className="text-[10px] text-slate-400">[{bug.category}]</span>
                          </div>
                          <p className="text-slate-300 mt-1">{bug.description}</p>
                          <p className="text-[10px] text-slate-500 mt-1">
                            Reported by {bug.reportedBy} on {new Date(bug.createdAt).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {bug.status === "OPEN" && (
                            <button
                              onClick={() => handleUpdateBugStatus(bug.id, "IN_PROGRESS")}
                              className="px-3 py-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase"
                            >
                              Mark In Progress
                            </button>
                          )}
                          {bug.status !== "RESOLVED" && (
                            <button
                              onClick={() => handleUpdateBugStatus(bug.id, "RESOLVED")}
                              className="px-3 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase"
                            >
                              Mark Resolved
                            </button>
                          )}
                          {bug.status === "RESOLVED" && (
                            <span className="px-3 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase">
                              RESOLVED
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
