"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, getFileUrl, SERVER_BASE_URL } from "@/lib/api";
import { DefaultAvatar } from "@/components/default-avatar";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import {
  Users, Clock, UserCheck, UserMinus, AlertTriangle,
  QrCode, Camera, Download, Search, ArrowLeft,
  Activity, CheckCircle, XCircle, ChevronRight, Radio,
  Wifi, WifiOff, Zap, RotateCcw, UserPlus, Eye,
  BarChart2, Shield, Pencil, X
} from "lucide-react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { io, Socket } from "socket.io-client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EventItem {
  id: string; title: string; description?: string;
  type: string; startDate: string; endDate?: string; venue?: string;
}

interface AttendanceUser {
  id?: string; name?: string; email?: string;
  avatarUrl?: string; role?: string; employeeId?: string;
}

interface AttendanceRecordItem {
  id: string; type: "CHECK_IN" | "CHECK_OUT"; timestamp: string;
  user?: AttendanceUser; teamCode?: string;
  isLate?: boolean; isEarly?: boolean; isManual?: boolean;
}

interface AttendanceStats {
  currentlyPresent: number; totalRegistered: number; totalCheckedOut: number;
  pendingArrival: number; lateArrivals?: number; earlyExits?: number;
  uniqueAttendees?: number; anomalies?: number;
}

interface TimelineEntry { hour: string; count: number; }

interface PresenceUser extends AttendanceUser { lastSeen?: string; }

interface PresenceData {
  present: PresenceUser[]; absent: PresenceUser[]; checkedOut: PresenceUser[];
  counts: { present: number; absent: number; checkedOut: number; total: number; };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getEventStatus(ev: EventItem) {
  const now = new Date(), start = new Date(ev.startDate), end = new Date(ev.endDate || ev.startDate);
  if (now >= start && now <= end) return { label: "LIVE", color: "#00F5D4", dot: true };
  if (now < start) return { label: "UPCOMING", color: "#FFD700", dot: false };
  return { label: "ENDED", color: "#4B6382", dot: false };
}

function fmtTime(ts: string) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function fmtDate(ts: string) {
  return new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatTile({ label, value, icon, accent, pulse = false }: {
  label: string; value: number; icon: React.ReactNode; accent: string; pulse?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="ck-stat-card group relative overflow-hidden"
      style={{ "--accent-color": accent } as React.CSSProperties}
    >
      {pulse && (
        <span className="absolute top-2 right-2 w-2 h-2 rounded-full animate-ping"
          style={{ background: accent, opacity: 0.6 }} />
      )}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#4B5563]">{label}</span>
        <span style={{ color: accent }} className="opacity-70 group-hover:opacity-100 transition-opacity">{icon}</span>
      </div>
      <motion.p className="text-3xl font-black font-mono" style={{ color: accent }}
        key={value}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        {String(value).padStart(2, "0")}
      </motion.p>
    </motion.div>
  );
}

// Sparkline SVG chart for timeline
function TimelineChart({ data }: { data: TimelineEntry[] }) {
  if (!data.length) return null;
  const maxVal = Math.max(...data.map(d => d.count), 1);
  const W = 280, H = 60, pad = 4;
  const pts = data.map((d, i) => {
    const x = pad + (i / Math.max(data.length - 1, 1)) * (W - pad * 2);
    const y = H - pad - ((d.count / maxVal) * (H - pad * 2));
    return `${x},${y}`;
  });
  const polyline = pts.join(" ");
  const area = `${pad},${H} ${polyline} ${W - pad},${H}`;
  return (
    <div className="w-full">
      <p className="text-[9px] font-mono text-[#4B5563] uppercase tracking-widest mb-1.5 flex items-center gap-1">
        <BarChart2 className="w-3 h-3" /> CHECK-IN ACTIVITY TIMELINE
      </p>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="overflow-visible">
        <defs>
          <linearGradient id="tl-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#CCFF00" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#CCFF00" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#tl-grad)" />
        <polyline points={polyline} fill="none" stroke="#CCFF00" strokeWidth="1.5"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ filter: "drop-shadow(0 0 4px rgba(204,255,0,0.5))" }} />
        {data.map((d, i) => {
          const x = pad + (i / Math.max(data.length - 1, 1)) * (W - pad * 2);
          const y = H - pad - ((d.count / maxVal) * (H - pad * 2));
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="3" fill="#CCFF00" opacity={0.9} />
              <title>{new Date(d.hour).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} — {d.count}</title>
            </g>
          );
        })}
      </svg>
      <div className="flex justify-between text-[8px] font-mono text-[#4B5563] mt-1">
        {data.length > 0 && <span>{new Date(data[0].hour).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
        {data.length > 1 && <span>{new Date(data[data.length - 1].hour).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
      </div>
    </div>
  );
}

// Presence panel showing who is inside / absent
function PresencePanel({ data, loading }: { data: PresenceData | null; loading: boolean }) {
  const [tab, setTab] = useState<"present" | "absent" | "out">("present");
  const [search, setSearch] = useState("");
  if (!data) return null;

  const list = tab === "present" ? data.present : tab === "absent" ? data.absent : data.checkedOut;
  const filtered = list.filter(u =>
    !search || u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="ck-glass-card overflow-hidden flex flex-col" style={{ minHeight: 320 }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04] bg-black/30">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4" style={{ color: "#00F5D4" }} />
          <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--ck-text)] font-bold">LIVE PRESENCE</span>
        </div>
        {loading && <div className="w-3 h-3 border border-[#CCFF00]/40 border-t-[#CCFF00] rounded-full animate-spin" />}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-white/[0.04]">
        {([
          { key: "present", label: `INSIDE (${data.counts.present})`, color: "#00F5D4" },
          { key: "absent", label: `MISSING (${data.counts.absent})`, color: "#FFD700" },
          { key: "out", label: `LEFT (${data.counts.checkedOut})`, color: "#8892A4" },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="flex-1 py-2 text-[9px] font-mono uppercase tracking-wide transition-all border-b-2"
            style={tab === t.key
              ? { color: t.color, borderColor: t.color, background: "rgba(255,255,255,0.02)" }
              : { color: "#4B5563", borderColor: "transparent" }
            }
          >{t.label}</button>
        ))}
      </div>

      {/* Search */}
      <div className="relative px-3 py-2">
        <Search className="absolute left-5.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#4B5563]" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Filter by name or email..."
          className="w-full bg-black/30 border border-white/[0.04] rounded-lg text-[11px] font-mono text-[var(--ck-text)] pl-7 pr-3 py-1.5 outline-none focus:border-[rgba(204,255,0,0.2)] placeholder-[#4B5563]" />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1 custom-scrollbar" style={{ maxHeight: 240 }}>
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-[10px] font-mono text-[#4B5563] uppercase">No entries</p>
          </div>
        ) : (
          filtered.map((u, i) => (
            <motion.div key={u.id || i}
              initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
              className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-white/[0.02]"
            >
              <DefaultAvatar src={u.avatarUrl ? getFileUrl(u.avatarUrl) : null} alt={u.name} className="w-6 h-6 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-[var(--ck-text)] truncate">{u.name || "—"}</p>
                <p className="text-[9px] font-mono text-[#4B5563] truncate">{u.email}</p>
              </div>
              {(u as PresenceUser).lastSeen && (
                <span className="text-[8px] font-mono text-[#4B5563] shrink-0">
                  {fmtTime((u as PresenceUser).lastSeen!)}
                </span>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

// Manual override modal for adding attendance without QR
function ManualOverridePanel({
  eventId, onSuccess
}: {
  eventId: string;
  onSuccess: (record: AttendanceRecordItem) => void;
}) {
  const { token } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AttendanceUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AttendanceUser | null>(null);
  const [manualType, setManualType] = useState<"CHECK_IN" | "CHECK_OUT">("CHECK_IN");
  const [submitting, setSubmitting] = useState(false);
  const [note, setNote] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);


  useEffect(() => {
    if (!query.trim() || query.length < 2) { setResults([]); return; }
    if (debounceRef.current !== undefined) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {

      setSearching(true);
      try {
        const data = await api<{ users: AttendanceUser[] }>(
          `/attendance/search-registered/${eventId}?q=${encodeURIComponent(query)}`,
          { token: token || undefined }
        );
        setResults(data.users || []);
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 350);
  }, [query, eventId, token]);

  const handleSubmit = async () => {
    if (!selectedUser?.id) return;
    setSubmitting(true);
    try {
      const data = await api<{ attendance: AttendanceRecordItem }>(
        "/attendance/manual",
        {
          method: "POST",
          token: token || undefined,
          body: JSON.stringify({ eventId, userId: selectedUser.id, type: manualType, note }),
        }
      );
      onSuccess(data.attendance);
      setSelectedUser(null);
      setQuery("");
      setNote("");
    } catch (err) {
      // error handled by parent toast
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ck-glass-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.04] bg-black/30">
        <UserPlus className="w-4 h-4" style={{ color: "#A855F7" }} />
        <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--ck-text)] font-bold">MANUAL OVERRIDE</span>
        <span className="ml-auto text-[8px] font-mono px-1.5 py-0.5 rounded-full border border-purple-500/20 text-purple-400 bg-purple-500/[0.05]">COORDINATOR</span>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {/* User search */}
        <div>
          <p className="text-[9px] font-mono text-[#4B5563] uppercase tracking-widest mb-1.5">SEARCH REGISTERED MEMBER</p>
          {selectedUser ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-purple-500/20 bg-purple-500/[0.04]">
              <DefaultAvatar src={selectedUser.avatarUrl ? getFileUrl(selectedUser.avatarUrl) : null} alt={selectedUser.name} className="w-6 h-6 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-[var(--ck-text)] truncate">{selectedUser.name}</p>
                <p className="text-[9px] font-mono text-[#4B5563] truncate">{selectedUser.email}</p>
              </div>
              <button onClick={() => { setSelectedUser(null); setQuery(""); }}
                className="text-[#4B5563] hover:text-red-400 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-[#4B5563]" />
              <input value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Name, email, or employee ID..."
                className="w-full bg-black/40 border border-white/[0.06] rounded-lg text-[11px] font-mono text-[var(--ck-text)] pl-7 pr-3 py-2.5 outline-none focus:border-purple-500/40 placeholder-[#4B5563]" />
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 border border-purple-500/40 border-t-purple-400 rounded-full animate-spin" />
              )}
            </div>
          )}

          {/* Results dropdown */}
          <AnimatePresence>
            {results.length > 0 && !selectedUser && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mt-1 rounded-lg border border-white/[0.06] bg-[#0D0F14] overflow-hidden z-10 shadow-xl">
                {results.map((u) => (
                  <button key={u.id} onClick={() => { setSelectedUser(u); setResults([]); setQuery(u.name || ""); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/[0.04] text-left transition-colors">
                    <DefaultAvatar src={u.avatarUrl ? getFileUrl(u.avatarUrl) : null} alt={u.name} className="w-6 h-6 shrink-0" />
                    <div>
                      <p className="text-[11px] font-semibold text-[var(--ck-text)]">{u.name}</p>
                      <p className="text-[9px] font-mono text-[#4B5563]">{u.email}</p>
                    </div>
                    {u.employeeId && <span className="ml-auto text-[8px] font-mono text-[#4B5563]">{u.employeeId}</span>}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Type toggle */}
        <div className="flex gap-1 p-1 rounded-lg bg-black/40 border border-white/[0.04]">
          {(["CHECK_IN", "CHECK_OUT"] as const).map(t => (
            <button key={t} onClick={() => setManualType(t)}
              className="flex-1 py-2 rounded-md text-[10px] font-mono uppercase font-bold transition-all"
              style={manualType === t
                ? { background: t === "CHECK_IN" ? "rgba(168,85,247,0.1)" : "rgba(255,77,0,0.08)", color: t === "CHECK_IN" ? "#A855F7" : "#FF4D00", border: `1px solid ${t === "CHECK_IN" ? "rgba(168,85,247,0.25)" : "rgba(255,77,0,0.2)"}` }
                : { color: "#4B5563", border: "1px solid transparent" }
              }
            >{t === "CHECK_IN" ? "→ CHECK IN" : "← CHECK OUT"}</button>
          ))}
        </div>

        {/* Note */}
        <input value={note} onChange={e => setNote(e.target.value)}
          placeholder="Reason / note (optional)"
          maxLength={200}
          className="w-full bg-black/40 border border-white/[0.06] rounded-lg text-[11px] font-mono text-[var(--ck-text)] px-3 py-2 outline-none focus:border-purple-500/40 placeholder-[#4B5563]" />

        <button
          onClick={handleSubmit}
          disabled={!selectedUser || submitting}
          className="w-full py-2.5 rounded-xl text-[11px] font-mono font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.3)", color: "#A855F7" }}
        >
          {submitting ? <div className="w-3.5 h-3.5 border border-purple-500/40 border-t-purple-400 rounded-full animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
          CONFIRM MANUAL OVERRIDE
        </button>
      </div>
    </div>
  );
}

// ─── QR reader CSS ────────────────────────────────────────────────────────────

const QR_STYLE = `
  #qr-reader { border: none !important; }
  #qr-reader__dashboard_section_csr button {
    background: #CCFF00 !important; color: #000 !important;
    padding: 5px 10px !important; border: none !important;
    border-radius: 4px !important; font-size: 11px !important;
    font-family: 'JetBrains Mono', monospace !important;
    font-weight: 700 !important; cursor: pointer !important;
    text-transform: uppercase !important;
  }
  #qr-reader select {
    background: #0D0F14 !important; border: 1px solid #1A1E26 !important;
    color: #F0F4FF !important; padding: 5px !important;
    border-radius: 4px !important; font-family: 'JetBrains Mono', monospace !important;
    font-size: 11px !important; outline: none !important;
  }
  @keyframes qr-scan { 0%{top:4%} 50%{top:92%} 100%{top:4%} }
  .qr-scan-line { animation: qr-scan 2.5s ease-in-out infinite; }
`;

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AttendancePage() {
  const { user, token } = useAuth();
  const searchParams = useSearchParams();
  const queryEventId = searchParams?.get("eventId") || "";

  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [records, setRecords] = useState<AttendanceRecordItem[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [presence, setPresence] = useState<PresenceData | null>(null);
  const [presenceLoading, setPresenceLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [qrInput, setQrInput] = useState("");
  const [checkinType, setCheckinType] = useState<"CHECK_IN" | "CHECK_OUT">("CHECK_IN");
  const [searchQuery, setSearchQuery] = useState("");
  const [logSearchQuery, setLogSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "CHECK_IN" | "CHECK_OUT" | "WARNINGS">("ALL");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [showPresence, setShowPresence] = useState(false);
  const [lastRecordId, setLastRecordId] = useState<string | null>(null);

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const isCoord = Boolean(user && ["FACULTY", "STUDENT_COORDINATOR", "TECH"].includes(user.role));

  // Participant states
  const [participantCheckedIn, setParticipantCheckedIn] = useState(false);
  const [submittingAttendance, setSubmittingAttendance] = useState(false);
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState("");
  const [agreeAttended, setAgreeAttended] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);

  // PWA offline
  const [isOnline, setIsOnline] = useState(typeof window !== "undefined" ? navigator.onLine : true);
  const [offlineCount, setOfflineCount] = useState(0);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const loadAttendance = useCallback(async (eventId: string) => {
    if (!eventId) return;
    setLoading(true);
    try {
      const data = await api<{
        records: AttendanceRecordItem[];
        stats: AttendanceStats;
        timeline: TimelineEntry[];
      }>(`/attendance/event/${eventId}?limit=100`, { token: token || undefined });
      setStats(data.stats);
      setRecords(data.records);
      setTimeline(data.timeline || []);
      if (data.records.length > 0) setLastRecordId(data.records[0].id);
    } catch {
      showToast("FAILED TO LOAD ATTENDANCE DATA", "error");
    } finally { setLoading(false); }
  }, [token, showToast]);

  const loadPresence = useCallback(async (eventId: string) => {
    if (!eventId) return;
    setPresenceLoading(true);
    try {
      const data = await api<PresenceData>(`/attendance/presence/${eventId}`, { token: token || undefined });
      setPresence(data);
    } catch {
      // Silent — presence is supplementary
    } finally { setPresenceLoading(false); }
  }, [token]);

  const checkMyStatus = useCallback(async (eventId: string) => {
    if (!token) return;
    setLoadingStatus(true);
    try {
      const data = await api<{ checkedIn: boolean }>(`/attendance/my-status/${eventId}`, { token });
      setParticipantCheckedIn(data.checkedIn);
    } catch { /* silent */ }
    finally { setLoadingStatus(false); }
  }, [token]);

  const handleUndoLastScan = useCallback(async () => {
    if (!lastRecordId) return;
    try {
      await api(`/attendance/${lastRecordId}`, {
        method: "DELETE",
        token: token || undefined,
      });
      setRecords(prev => prev.filter(r => r.id !== lastRecordId));
      setLastRecordId(records.find(r => r.id !== lastRecordId)?.id || null);
      showToast("LAST SCAN VOIDED", "success");
      if (selectedEvent) loadAttendance(selectedEvent);
    } catch {
      showToast("FAILED TO VOID SCAN", "error");
    }
  }, [lastRecordId, records, token, selectedEvent, loadAttendance, showToast]);

  const syncOfflineCheckins = useCallback(async () => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("ck_offline_checkins");
    if (!saved) return;
    try {
      const queue = JSON.parse(saved);
      if (!Array.isArray(queue) || queue.length === 0) return;
      let successCount = 0;
      for (const item of queue) {
        try {
          await api("/attendance", {
            method: "POST", token: token || undefined,
            body: JSON.stringify({ eventId: item.eventId, type: item.type, teamCode: item.teamCode }),
          });
          successCount++;
        } catch { /* skip failed items */ }
      }
      localStorage.removeItem("ck_offline_checkins");
      setOfflineCount(0);
      showToast(`SYNCED ${successCount} OFFLINE CHECK-INS`, "success");
      if (selectedEvent) loadAttendance(selectedEvent);
    } catch { /* silent */ }
  }, [token, selectedEvent, loadAttendance, showToast]);

  const handleCheckIn = useCallback(async (override?: string) => {
    const code = override || qrInput;
    if (!code && !qrInput.trim()) return;

    const payload = { eventId: selectedEvent, type: checkinType, teamCode: code || undefined, timestamp: new Date().toISOString() };

    if (!isOnline) {
      const saved = localStorage.getItem("ck_offline_checkins") || "[]";
      const queue = JSON.parse(saved);
      queue.push(payload);
      localStorage.setItem("ck_offline_checkins", JSON.stringify(queue));
      setOfflineCount(queue.length);
      setQrInput("");
      showToast(`OFFLINE: ${queue.length} check-in(s) cached`, "success");
      return;
    }

    try {
      const body: Record<string, string> = { eventId: selectedEvent, type: checkinType };
      if (code) body.teamCode = code;
      const res = await api<{ attendance?: AttendanceRecordItem }>(
        "/attendance", { method: "POST", token: token || undefined, body: JSON.stringify(body) }
      );
      setQrInput("");
      if (res.attendance?.id) setLastRecordId(res.attendance.id);
      showToast(`${checkinType === "CHECK_IN" ? "✓ CHECK-IN" : "✓ CHECK-OUT"} RECORDED`, "success");
      if (!override) loadAttendance(selectedEvent);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "SCAN FAILED", "error");
      if (override) throw err;
    }
  }, [qrInput, selectedEvent, checkinType, isOnline, token, loadAttendance, showToast]);

  // Online/offline detection
  useEffect(() => {
    const update = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    const saved = localStorage.getItem("ck_offline_checkins");
    if (saved) try { setOfflineCount(JSON.parse(saved).length); } catch { /* */ }
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);

  // Sync when back online
  useEffect(() => {
    if (isOnline && token) syncOfflineCheckins();
  }, [isOnline, token, syncOfflineCheckins]);

  // Participant: check my status
  useEffect(() => {
    if (selectedEvent && !isCoord && token) {
      const t = setTimeout(() => checkMyStatus(selectedEvent), 50);
      return () => clearTimeout(t);
    }
  }, [selectedEvent, isCoord, token, checkMyStatus]);

  // Load events
  useEffect(() => {
    if (!token) return;
    const endpoint = isCoord ? "/events/all" : "/events/registered";
    api<{ events: EventItem[] }>(endpoint, { token })
      .then(d => {
        setEvents(d.events || []);
        if (queryEventId && d.events?.some(e => e.id === queryEventId)) setSelectedEvent(queryEventId);
      })
      .catch(() => { /* silent */ });
  }, [token, isCoord, queryEventId]);

  // Load attendance + socket on event select
  useEffect(() => {
    if (!selectedEvent || !token) return;
    const t = setTimeout(() => {
      loadAttendance(selectedEvent);
      if (isCoord) loadPresence(selectedEvent);
    }, 50);

    socketRef.current = io(SERVER_BASE_URL, { auth: { token } });
    socketRef.current.emit("join-event", selectedEvent);

    socketRef.current.on("attendance:new", (record: AttendanceRecordItem) => {
      setRecords(prev => [record, ...prev]);
      setLastRecordId(record.id);
      setStats(prev => prev ? {
        ...prev,
        currentlyPresent: record.type === "CHECK_IN" ? (prev.currentlyPresent || 0) + 1 : Math.max(0, (prev.currentlyPresent || 0) - 1),
        totalCheckedOut: record.type === "CHECK_OUT" ? (prev.totalCheckedOut || 0) + 1 : prev.totalCheckedOut,
      } : prev);
      // Refresh presence after each event
      if (isCoord) loadPresence(selectedEvent);
    });

    socketRef.current.on("attendance:voided", ({ id }: { id: string }) => {
      setRecords(prev => prev.filter(r => r.id !== id));
      if (isCoord) loadPresence(selectedEvent);
    });

    socketRef.current.on("attendance:team", () => {
      loadAttendance(selectedEvent);
      if (isCoord) loadPresence(selectedEvent);
    });

    return () => {
      clearTimeout(t);
      if (socketRef.current) {
        socketRef.current.emit("leave-event", selectedEvent);
        socketRef.current.disconnect();
      }
    };
  }, [selectedEvent, token, isCoord, loadAttendance, loadPresence]);

  // QR scanner lifecycle
  useEffect(() => {
    if (showScanner && selectedEvent) {
      scannerRef.current = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: { width: 240, height: 240 } }, false);
      scannerRef.current.render(
        async (decoded) => {
          if (scannerRef.current) scannerRef.current.pause();
          try { await handleCheckIn(decoded); } catch { }
          finally { setTimeout(() => { if (scannerRef.current) scannerRef.current.resume(); }, 2000); }
        },
        () => { }
      );
    } else {
      scannerRef.current?.clear().catch(() => { });
      scannerRef.current = null;
    }
    return () => { scannerRef.current?.clear().catch(() => { }); };
  }, [showScanner, selectedEvent, handleCheckIn]);

  const handleExportCSV = useCallback(() => {
    if (!records.length) return;
    const ev = events.find(e => e.id === selectedEvent);
    const headers = ["Name", "Employee ID", "Email", "Role", "Type", "Timestamp", "Late", "Early Exit", "Manual"];
    const rows = records.map(r => [
      r.user?.name || "", r.user?.employeeId || "", r.user?.email || "",
      r.user?.role || "", r.type,
      new Date(r.timestamp).toLocaleString("en-IN"),
      r.isLate ? "Y" : "N", r.isEarly ? "Y" : "N", r.isManual ? "Y" : "N",
    ]);
    const csv = [headers, ...rows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `attendance_${ev?.title || "event"}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    showToast("CSV EXPORTED", "success");
  }, [records, events, selectedEvent, showToast]);

  const handleSubmitAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeAttended) { showToast("PLEASE CONFIRM THE ATTENDANCE CHECKBOX", "error"); return; }
    setSubmittingAttendance(true);
    try {
      await api("/attendance", {
        method: "POST", token: token || undefined,
        body: JSON.stringify({ eventId: selectedEvent, type: "CHECK_IN" }),
      });
      showToast("ATTENDANCE SUBMITTED SUCCESSFULLY", "success");
      setParticipantCheckedIn(true);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "SUBMISSION FAILED", "error");
    } finally { setSubmittingAttendance(false); }
  };

  const completionRate = stats && stats.totalRegistered > 0
    ? Math.round(((stats.currentlyPresent + stats.totalCheckedOut) / stats.totalRegistered) * 100) : 0;

  const rateColor = completionRate >= 75 ? "#00F5D4" : completionRate >= 50 ? "#FFD700" : "#FF4D00";

  const filteredRecords = records.filter(r => {
    const q = logSearchQuery.toLowerCase();
    const match = !q || r.user?.name?.toLowerCase().includes(q) || r.user?.email?.toLowerCase().includes(q) || r.teamCode?.toLowerCase().includes(q);
    if (filterType === "CHECK_IN") return match && r.type === "CHECK_IN";
    if (filterType === "CHECK_OUT") return match && r.type === "CHECK_OUT";
    if (filterType === "WARNINGS") return match && (r.isLate || r.isEarly);
    return match;
  });

  const filteredEvents = events.filter(ev => ev.title.toLowerCase().includes(searchQuery.toLowerCase()));

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5">
      <style>{QR_STYLE}</style>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl border text-sm font-mono font-semibold shadow-2xl backdrop-blur-lg"
            style={toast.type === "success"
              ? { background: "rgba(204,255,0,0.06)", borderColor: "rgba(204,255,0,0.25)", color: "#CCFF00" }
              : { background: "rgba(255,0,60,0.06)", borderColor: "rgba(255,0,60,0.25)", color: "#FF003C" }}
          >
            {toast.type === "success" ? <CheckCircle className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <Radio className="w-3.5 h-3.5" style={{ color: "#CCFF00" }} />
            <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "#CCFF00" }}>
              {selectedEvent ? "MISSION ACTIVE" : "SELECT MISSION"}
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-[var(--ck-text)]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            ATTENDANCE <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#CCFF00] to-[#99BF00]">STREAM</span>
          </h1>
        </div>
        {selectedEvent && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl border border-[#CCFF00]/15 bg-[#CCFF00]/[0.03] backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#CCFF00", boxShadow: "0 0 10px #CCFF00" }} />
            <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "#CCFF00" }}>LIVE · SOCKET ACTIVE</span>
          </motion.div>
        )}
      </motion.div>

      {/* Network status bar */}
      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className={`ck-glass-card flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 text-xs font-mono font-bold ${!isOnline ? "border-red-500/20" : ""}`}>
        <div className="flex items-center gap-2.5">
          {isOnline ? <Wifi className="w-4 h-4 text-[var(--ck-primary)]" /> : <WifiOff className="w-4 h-4 text-[var(--ck-danger)]" />}
          <div className={`w-2 h-2 rounded-full ${!isOnline || offlineCount > 0 ? "animate-pulse" : ""}`}
            style={{ background: isOnline ? "#CCFF00" : "#FF003C", boxShadow: `0 0 8px ${isOnline ? "#CCFF00" : "#FF003C"}` }} />
          <span className={isOnline ? "text-[var(--ck-text)]" : "text-red-400"}>
            NETWORK: {isOnline ? "ONLINE" : "OFFLINE"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {offlineCount > 0 && (
            <span className="text-[10px] px-2.5 py-1 bg-yellow-500/[0.06] border border-yellow-500/20 text-yellow-400 rounded-full">
              {offlineCount} PENDING SYNC
            </span>
          )}
          <span className="text-[10px] text-[var(--ck-text-muted)]">
            {isOnline ? "Real-time sync active" : "Entries cached locally"}
          </span>
        </div>
      </motion.div>

      {/* ── No event selected — event picker ── */}
      {!selectedEvent ? (
        <div className="flex flex-col gap-5">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#4B5563" }} />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search events..." className="ck-input ck-input-with-icon" />
          </div>

          {filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-16 h-16 rounded-2xl border border-white/[0.04] bg-white/[0.02] flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-[var(--ck-text-muted)]" />
              </div>
              <p className="text-sm font-mono text-[var(--ck-text-muted)] uppercase tracking-widest">NO EVENTS FOUND</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Top events */}
              <div>
                <div className="flex items-center gap-2 mb-3 text-xs font-mono font-bold uppercase tracking-widest text-[#00F5D4]">
                  <Zap className="w-3.5 h-3.5" /><span>TOP ACTIVE EVENTS</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredEvents.slice(0, 3).map((ev, i) => {
                    const status = getEventStatus(ev);
                    return (
                      <motion.button key={ev.id}
                        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        whileHover={{ y: -3, scale: 1.01 }} onClick={() => setSelectedEvent(ev.id)}
                        className="text-left p-5 rounded-xl ck-glass-card group cursor-pointer border border-[#00F5D4]/30 hover:border-[#00F5D4] shadow-[0_0_15px_rgba(0,245,212,0.08)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 px-2 py-0.5 bg-[#00F5D4]/10 border-b border-l border-[#00F5D4]/30 text-[8px] font-mono font-bold text-[#00F5D4]">TOP {i + 1}</div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-1.5">
                            {status.dot && (
                              <motion.span className="w-1.5 h-1.5 rounded-full"
                                style={{ background: status.color, boxShadow: `0 0 8px ${status.color}` }}
                                animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
                            )}
                            <span className="text-[9px] font-mono font-bold uppercase tracking-widest" style={{ color: status.color }}>{status.label}</span>
                          </div>
                          <span className="text-[9px] font-mono text-[#4B5563]">{ev.type === "TEAM" ? "TEAM" : "SOLO"}</span>
                        </div>
                        <h3 className="font-bold text-[var(--ck-text)] mb-2 line-clamp-2 leading-snug group-hover:text-[var(--ck-primary)] transition-colors" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{ev.title}</h3>
                        <p className="text-xs text-[#4B5563] line-clamp-2 mb-4 font-mono">{ev.description || "No description."}</p>
                        <div className="flex items-center justify-between border-t border-white/[0.04] pt-3">
                          <span className="text-[10px] font-mono text-[#4B5563]">{fmtDate(ev.startDate)}</span>
                          {ev.venue && <span className="text-[9px] font-mono text-[#4B5563] truncate max-w-[120px]">📍 {ev.venue}</span>}
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" style={{ color: "#CCFF00" }} />
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Other events */}
              {filteredEvents.length > 3 && (
                <div>
                  <div className="flex items-center gap-2 mb-3 text-xs font-mono font-bold uppercase tracking-widest text-[#8892A4]">
                    <Activity className="w-3.5 h-3.5" /><span>OTHER EVENTS ({filteredEvents.length - 3})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredEvents.slice(3).map((ev, i) => {
                      const status = getEventStatus(ev);
                      return (
                        <motion.button key={ev.id}
                          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                          whileHover={{ y: -3 }} onClick={() => setSelectedEvent(ev.id)}
                          className="text-left p-5 rounded-xl ck-glass-card group cursor-pointer opacity-90 hover:opacity-100">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-1.5">
                              {status.dot && <span className="w-1.5 h-1.5 rounded-full" style={{ background: status.color }} />}
                              <span className="text-[9px] font-mono font-bold uppercase tracking-widest" style={{ color: status.color }}>{status.label}</span>
                            </div>
                          </div>
                          <h3 className="font-bold text-[var(--ck-text)] mb-1 line-clamp-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{ev.title}</h3>
                          <div className="flex items-center justify-between border-t border-white/[0.04] pt-3 mt-3">
                            <span className="text-[10px] font-mono text-[#4B5563]">{fmtDate(ev.startDate)}</span>
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" style={{ color: "#CCFF00" }} />
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      ) : !isCoord ? (
        /* ── Participant view ── */
        <div className="flex flex-col gap-4">
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
            className="ck-glass-card flex items-center justify-between flex-wrap gap-3 p-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setSelectedEvent("")}
                className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/[0.06] bg-black/40 text-[#8892A4] hover:border-[rgba(204,255,0,0.3)] hover:text-[var(--ck-primary)] transition-all">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <p className="text-[9px] font-mono uppercase tracking-widest" style={{ color: "#CCFF00" }}>MY REGISTERED MISSION</p>
                <h2 className="font-bold text-[var(--ck-text)] text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {events.find(e => e.id === selectedEvent)?.title}
                </h2>
              </div>
            </div>
            <button onClick={() => setSelectedEvent("")} className="ck-btn-secondary text-[10px] py-1.5 px-3">SWITCH</button>
          </motion.div>

          {loadingStatus ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="ck-spinner" />
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#8892A4]">Retrieving clearance status...</p>
            </div>
          ) : participantCheckedIn ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="ck-glass-card p-8 text-center flex flex-col items-center justify-center max-w-xl mx-auto gap-4"
              style={{ borderColor: "rgba(204,255,0,0.2)" }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br from-[#CCFF00]/20 to-[#99BF00]/20 border border-[#CCFF00]/40"
                style={{ boxShadow: "0 0 20px rgba(204,255,0,0.15)" }}>
                <CheckCircle className="w-8 h-8" style={{ color: "#CCFF00" }} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--ck-text)] uppercase font-mono tracking-wider">Attendance Verified</h3>
                <p className="text-xs text-[#8892A4] mt-2 leading-relaxed">
                  Your attendance has been successfully recorded. Thank you for participating!
                </p>
              </div>
              <button onClick={() => setSelectedEvent("")} className="ck-btn-secondary py-2 px-6 text-xs font-mono uppercase mt-2">
                Return to List
              </button>
            </motion.div>
          ) : (() => {
            const activeEvent = events.find(e => e.id === selectedEvent);
            const hasEnded = activeEvent?.endDate ? new Date() >= new Date(activeEvent.endDate) : false;

            if (!hasEnded) return (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="ck-glass-card p-8 text-center flex flex-col items-center justify-center max-w-xl mx-auto gap-4"
                style={{ borderColor: "rgba(255,77,0,0.2)" }}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br from-[#FF4D00]/20 to-[#CC3D00]/20 border border-[#FF4D00]/40 animate-pulse"
                  style={{ boxShadow: "0 0 20px rgba(255,77,0,0.15)" }}>
                  <Clock className="w-8 h-8" style={{ color: "#FF4D00" }} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--ck-text)] uppercase font-mono tracking-wider">Attendance Portal Locked</h3>
                  <p className="text-xs text-[#8892A4] mt-2 leading-relaxed">
                    This form will unlock automatically once the event concludes.
                  </p>
                  {activeEvent && (
                    <div className="mt-4 p-3 rounded-lg bg-black/40 border border-white/[0.04] text-[11px] font-mono text-left space-y-1 max-w-sm mx-auto">
                      <p className="text-[var(--ck-text)]"><span className="text-[var(--ck-accent)]">START:</span> {new Date(activeEvent.startDate).toLocaleString()}</p>
                      <p className="text-[var(--ck-text)]"><span className="text-[var(--ck-accent)]">END:</span> {activeEvent.endDate ? new Date(activeEvent.endDate).toLocaleString() : "TBD"}</p>
                      {activeEvent.venue && <p className="text-[var(--ck-text)]"><span className="text-[var(--ck-accent)]">VENUE:</span> {activeEvent.venue}</p>}
                    </div>
                  )}
                </div>
                <button onClick={() => setSelectedEvent("")} className="ck-btn-secondary py-2 px-6 text-xs font-mono uppercase mt-2">Return to List</button>
              </motion.div>
            );

            return (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                className="ck-glass-card p-6 max-w-xl mx-auto w-full">
                <div className="border-b border-white/[0.04] pb-4 mb-5">
                  <h3 className="text-base font-bold text-[var(--ck-text)] font-mono uppercase tracking-wide">Submit Attendance Clearance</h3>
                  <p className="text-xs text-[#8892A4] mt-1">Confirm your attendance and provide event feedback.</p>
                </div>
                <form onSubmit={handleSubmitAttendance} className="space-y-5">
                  <div className="p-3.5 rounded-xl border border-[#CCFF00]/15 bg-[#CCFF00]/[0.02] text-xs font-mono space-y-1.5">
                    <p className="text-[var(--ck-text)]"><span className="text-[rgba(204,255,0,0.7)]">EVENT:</span> {activeEvent?.title}</p>
                    <p className="text-[var(--ck-text)]"><span className="text-[rgba(204,255,0,0.7)]">CONCLUDED:</span> {activeEvent?.endDate ? new Date(activeEvent.endDate).toLocaleString() : "Recently"}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-widest text-[#8892A4] mb-2 block">Event Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button key={star} type="button" onClick={() => setRating(star)}
                          className="w-10 h-10 rounded-lg border border-white/[0.06] bg-black/30 flex items-center justify-center transition-all hover:scale-105 hover:border-[#CCFF00]/40"
                          style={{ color: rating >= star ? "#CCFF00" : "#4B5563" }}>
                          <Zap className="w-5 h-5 fill-current" />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-widest text-[#8892A4] mb-2 block">Key Learnings & Feedback</label>
                    <textarea rows={4} value={comments} onChange={e => setComments(e.target.value)}
                      placeholder="What did you learn? Any feedback..." className="ck-input w-full" required />
                  </div>
                  <label className="flex items-start gap-3 p-3.5 rounded-xl border border-white/[0.04] bg-white/[0.01] cursor-pointer hover:bg-white/[0.02] transition-colors select-none">
                    <input type="checkbox" checked={agreeAttended} onChange={e => setAgreeAttended(e.target.checked)}
                      className="w-4 h-4 mt-0.5 cursor-pointer" style={{ accentColor: "#CCFF00" }} />
                    <span className="text-xs text-[var(--ck-text)] leading-relaxed">
                      I confirm that I attended this event and my feedback is accurate.
                    </span>
                  </label>
                  <button type="submit" disabled={submittingAttendance || !agreeAttended}
                    className="w-full ck-btn-primary py-3 text-xs flex items-center justify-center gap-2 font-mono uppercase font-bold tracking-widest">
                    {submittingAttendance
                      ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      : <><Zap className="w-4 h-4" /> SUBMIT ATTENDANCE CLEARANCE</>}
                  </button>
                </form>
              </motion.div>
            );
          })()}
        </div>

      ) : (
        /* ── Coordinator dashboard ── */
        <div className="flex flex-col gap-4">
          {/* Header bar */}
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
            className="ck-glass-card flex items-center justify-between flex-wrap gap-3 p-4">
            <div className="flex items-center gap-3">
              <button onClick={() => { setSelectedEvent(""); setStats(null); setRecords([]); setPresence(null); }}
                className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/[0.06] bg-black/40 text-[#8892A4] hover:border-[rgba(204,255,0,0.3)] hover:text-[var(--ck-primary)] transition-all">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <p className="text-[9px] font-mono uppercase tracking-widest" style={{ color: "#CCFF00" }}>ACTIVE MISSION</p>
                <h2 className="font-bold text-[var(--ck-text)] text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {events.find(e => e.id === selectedEvent)?.title}
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* View toggles */}
              <button onClick={() => setShowPresence(!showPresence)}
                className="flex items-center gap-1.5 text-[9px] font-mono uppercase px-2.5 py-1.5 rounded-lg border transition-all"
                style={showPresence
                  ? { color: "#00F5D4", borderColor: "rgba(0,245,212,0.25)", background: "rgba(0,245,212,0.06)" }
                  : { color: "#4B5563", borderColor: "rgba(255,255,255,0.06)" }}>
                <Eye className="w-3 h-3" /> PRESENCE
              </button>
              <button onClick={() => setShowManual(!showManual)}
                className="flex items-center gap-1.5 text-[9px] font-mono uppercase px-2.5 py-1.5 rounded-lg border transition-all"
                style={showManual
                  ? { color: "#A855F7", borderColor: "rgba(168,85,247,0.25)", background: "rgba(168,85,247,0.06)" }
                  : { color: "#4B5563", borderColor: "rgba(255,255,255,0.06)" }}>
                <Pencil className="w-3 h-3" /> OVERRIDE
              </button>
              <button onClick={() => { setSelectedEvent(""); setStats(null); setRecords([]); }}
                className="ck-btn-secondary text-[10px] py-1.5 px-3">SWITCH</button>
            </div>
          </motion.div>

          {/* Main 2-column layout */}
          <div className="flex flex-col lg:flex-row gap-4">

            {/* ── LEFT: Stats + Timeline + Log ── */}
            <div className="flex flex-col gap-4 flex-1 min-w-0">

              {/* Completion ring + timeline */}
              {stats && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="ck-glass-card p-5 flex flex-col sm:flex-row items-start sm:items-center gap-5">
                  {/* SVG ring */}
                  <div className="relative shrink-0" style={{ width: 80, height: 80 }}>
                    <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90">
                      <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="6" />
                      <motion.circle cx="40" cy="40" r="32" fill="none"
                        stroke={rateColor} strokeWidth="6" strokeLinecap="round"
                        strokeDasharray={201}
                        initial={{ strokeDashoffset: 201 }}
                        animate={{ strokeDashoffset: 201 - (completionRate / 100) * 201 }}
                        transition={{ duration: 1.4, ease: "easeOut" }}
                        style={{ filter: `drop-shadow(0 0 8px ${rateColor}60)` }} />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-black font-mono" style={{ color: rateColor }}>{completionRate}%</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-[#4B5563] mb-1">ATTENDANCE RATE</p>
                    <p className="text-sm font-bold text-[var(--ck-text)]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {stats.currentlyPresent + stats.totalCheckedOut} / {stats.totalRegistered}{" "}
                      <span className="text-[#4B5563] font-normal">registered</span>
                    </p>
                    {((stats.lateArrivals ?? 0) > 0 || (stats.earlyExits ?? 0) > 0) && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(stats.lateArrivals ?? 0) > 0 && (
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full border"
                            style={{ color: "#FF4D00", borderColor: "rgba(255,77,0,0.2)", background: "rgba(255,77,0,0.05)" }}>
                            LATE: {stats.lateArrivals}
                          </span>
                        )}
                        {(stats.earlyExits ?? 0) > 0 && (
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full border"
                            style={{ color: "#FF003C", borderColor: "rgba(255,0,60,0.2)", background: "rgba(255,0,60,0.05)" }}>
                            EARLY EXIT: {stats.earlyExits}
                          </span>
                        )}
                      </div>
                    )}
                    {/* Timeline sparkline */}
                    {timeline.length > 1 && (
                      <div className="mt-3 border-t border-white/[0.04] pt-3">
                        <TimelineChart data={timeline} />
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Stat grid */}
              {stats && (
                <div className="space-y-3">
                  <div className="text-[10px] font-mono text-[#00F5D4] uppercase tracking-widest flex items-center gap-1.5 font-bold">
                    <Zap className="w-3 h-3" /><span>PRIMARY METRICS</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <StatTile label="PRESENT" value={stats.currentlyPresent} icon={<UserCheck className="w-4 h-4" />} accent="#00F5D4" pulse={stats.currentlyPresent > 0} />
                    <StatTile label="TOTAL REGISTERED" value={stats.totalRegistered} icon={<Users className="w-4 h-4" />} accent="#00E1FF" />
                    <StatTile label="CHECKED OUT" value={stats.totalCheckedOut} icon={<UserMinus className="w-4 h-4" />} accent="#8892A4" />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatTile label="PENDING" value={stats.pendingArrival} icon={<Clock className="w-4 h-4" />} accent="#FFD700" />
                    <StatTile label="LATE" value={stats.lateArrivals || 0} icon={<AlertTriangle className="w-4 h-4" />} accent="#FF4D00" />
                    <StatTile label="EARLY EXIT" value={stats.earlyExits || 0} icon={<Clock className="w-4 h-4" />} accent="#FF003C" />
                    <StatTile label="ANOMALIES" value={(stats.lateArrivals || 0) + (stats.earlyExits || 0)} icon={<Zap className="w-4 h-4" />} accent="#A855F7" />
                  </div>
                </div>
              )}

              {/* Presence panel (toggle) */}
              <AnimatePresence>
                {showPresence && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                    <PresencePanel data={presence} loading={presenceLoading} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Manual override panel (toggle) */}
              <AnimatePresence>
                {showManual && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                    <ManualOverridePanel
                      eventId={selectedEvent}
                      onSuccess={(record) => {
                        setRecords(prev => [record, ...prev]);
                        setLastRecordId(record.id);
                        showToast("MANUAL ATTENDANCE RECORDED", "success");
                        loadAttendance(selectedEvent);
                        loadPresence(selectedEvent);
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Live log terminal */}
              <div className="flex flex-col ck-glass-card overflow-hidden" style={{ minHeight: 380 }}>
                {/* Terminal chrome */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04] bg-black/30">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FF003C]/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FF4D00]/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#CCFF00]/80" />
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--ck-text)] font-semibold">LIVE LOG STREAM</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-mono text-[#4B5563]">{filteredRecords.length} / {records.length}</span>
                    {lastRecordId && (
                      <button onClick={handleUndoLastScan}
                        className="flex items-center gap-1 text-[9px] font-mono px-2 py-1 rounded-lg border border-white/[0.06] text-[#8892A4] hover:border-red-500/30 hover:text-red-400 transition-all">
                        <RotateCcw className="w-3 h-3" /> UNDO
                      </button>
                    )}
                  </div>
                </div>

                {/* Filters */}
                <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 border-b border-white/[0.04] bg-black/20">
                  <div className="flex gap-0.5 p-0.5 rounded-lg bg-black/40 border border-white/[0.04]">
                    {(["ALL", "CHECK_IN", "CHECK_OUT", "WARNINGS"] as const).map(f => (
                      <button key={f} onClick={() => setFilterType(f)}
                        className="px-2.5 py-1.5 rounded-md text-[9px] font-mono uppercase tracking-wide transition-all"
                        style={filterType === f
                          ? { background: "rgba(204,255,0,0.08)", color: "#CCFF00", border: "1px solid rgba(204,255,0,0.15)" }
                          : { color: "#4B5563", border: "1px solid transparent" }}>
                        {f === "ALL" ? "ALL" : f.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                  <div className="relative w-48">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#4B5563]" />
                    <input value={logSearchQuery} onChange={e => setLogSearchQuery(e.target.value)}
                      placeholder="Filter logs..." className="w-full bg-black/40 border border-white/[0.04] rounded-lg text-[11px] font-mono text-[var(--ck-text)] pl-7 pr-3 py-1.5 outline-none focus:border-[rgba(204,255,0,0.2)] placeholder-[#4B5563]" />
                  </div>
                </div>

                {/* Entries */}
                <div className="flex-1 overflow-y-auto p-3 space-y-0.5 custom-scrollbar" style={{ maxHeight: 320 }}>
                  {loading ? (
                    <div className="flex items-center justify-center h-full py-10"><div className="ck-spinner" /></div>
                  ) : filteredRecords.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-10 gap-2">
                      <Activity className="w-8 h-8 text-zinc-700" />
                      <p className="text-[10px] font-mono text-[#4B5563] uppercase tracking-widest">NO LOG ENTRIES</p>
                    </div>
                  ) : (
                    filteredRecords.map((r, idx) => (
                      <motion.div key={r.id || idx}
                        initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(idx * 0.02, 0.3) }}
                        className="flex items-center gap-2.5 py-2 px-2.5 rounded-lg hover:bg-white/[0.02] transition-colors group">
                        <span className="text-[9px] font-mono text-[#4B5563] shrink-0 w-16">{fmtTime(r.timestamp)}</span>
                        <span className="text-[10px] font-mono font-bold shrink-0 w-14 px-1.5 py-0.5 rounded text-center"
                          style={{ color: r.type === "CHECK_IN" ? "#CCFF00" : "#FF4D00", background: r.type === "CHECK_IN" ? "rgba(204,255,0,0.06)" : "rgba(255,77,0,0.06)" }}>
                          {r.type === "CHECK_IN" ? "→ IN" : "← OUT"}
                        </span>
                        <DefaultAvatar src={r.user?.avatarUrl ? getFileUrl(r.user.avatarUrl) : null} alt={r.user?.name} className="w-6 h-6 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-[11px] text-[var(--ck-text)] font-semibold truncate block">{r.user?.name || "Unknown"}</span>
                          <span className="text-[9px] text-[#4B5563] truncate block hidden sm:block">{r.user?.email}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {r.isManual && <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full border" style={{ color: "#A855F7", borderColor: "rgba(168,85,247,0.2)", background: "rgba(168,85,247,0.04)" }}>MANUAL</span>}
                          {r.teamCode && <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full border hidden sm:block" style={{ color: "#00E1FF", borderColor: "rgba(0,225,255,0.2)", background: "rgba(0,225,255,0.04)" }}>T</span>}
                          {r.isLate && <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full border" style={{ color: "#FF4D00", borderColor: "rgba(255,77,0,0.2)", background: "rgba(255,77,0,0.04)" }}>LATE</span>}
                          {r.isEarly && <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full border" style={{ color: "#FF003C", borderColor: "rgba(255,0,60,0.2)", background: "rgba(255,0,60,0.04)" }}>EARLY</span>}
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>

                <div className="flex justify-end px-3.5 py-3 border-t border-white/[0.04] bg-black/20">
                  <button onClick={handleExportCSV} disabled={!records.length}
                    className="ck-btn-secondary text-[10px] py-1.5 px-3 flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5" /> EXPORT CSV
                  </button>
                </div>
              </div>
            </div>

            {/* ── RIGHT: Scan controller + counter ── */}
            <div className="w-full lg:w-72 shrink-0">
              <div className="sticky top-4 flex flex-col gap-4">
                <div className="ck-glass-card overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-4 h-4" style={{ color: "#CCFF00" }} />
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--ck-text)] font-bold">SCAN CORE</span>
                    </div>
                    <button onClick={() => setShowScanner(!showScanner)}
                      className="flex items-center gap-1.5 text-[9px] font-mono uppercase px-2.5 py-1.5 rounded-lg border transition-all"
                      style={showScanner
                        ? { color: "#CCFF00", borderColor: "rgba(204,255,0,0.25)", background: "rgba(204,255,0,0.06)" }
                        : { color: "#4B5563", borderColor: "rgba(255,255,255,0.06)" }}>
                      <Camera className="w-3 h-3" />
                      {showScanner ? "ACTIVE" : "START"}
                    </button>
                  </div>

                  <div className="p-4 flex flex-col gap-3">
                    {/* IN / OUT toggle */}
                    <div className="flex gap-1 p-1 rounded-lg bg-black/40 border border-white/[0.04]">
                      {(["CHECK_IN", "CHECK_OUT"] as const).map(t => (
                        <button key={t} onClick={() => setCheckinType(t)}
                          className="flex-1 py-2 rounded-md text-[10px] font-mono uppercase font-bold transition-all"
                          style={checkinType === t
                            ? { background: t === "CHECK_IN" ? "rgba(204,255,0,0.08)" : "rgba(255,77,0,0.08)", color: t === "CHECK_IN" ? "#CCFF00" : "#FF4D00", border: `1px solid ${t === "CHECK_IN" ? "rgba(204,255,0,0.2)" : "rgba(255,77,0,0.2)"}` }
                            : { color: "#4B5563", border: "1px solid transparent" }}>
                          {t === "CHECK_IN" ? "→ IN" : "← OUT"}
                        </button>
                      ))}
                    </div>

                    {/* QR scanner */}
                    {showScanner && (
                      <div className="relative rounded-xl border overflow-hidden bg-[var(--ck-bg)]" style={{ borderColor: "rgba(204,255,0,0.15)" }}>
                        {["tl", "tr", "bl", "br"].map(c => (
                          <div key={c} className="absolute w-3.5 h-3.5" style={{
                            top: c.startsWith("t") ? 4 : undefined, bottom: c.startsWith("b") ? 4 : undefined,
                            left: c.endsWith("l") ? 4 : undefined, right: c.endsWith("r") ? 4 : undefined,
                            borderTop: c.startsWith("t") ? "2px solid #CCFF00" : undefined,
                            borderBottom: c.startsWith("b") ? "2px solid #CCFF00" : undefined,
                            borderLeft: c.endsWith("l") ? "2px solid #CCFF00" : undefined,
                            borderRight: c.endsWith("r") ? "2px solid #CCFF00" : undefined,
                            zIndex: 10,
                          }} />
                        ))}
                        <div className="qr-scan-line absolute left-0 right-0 h-0.5 z-10"
                          style={{ background: "linear-gradient(90deg, transparent, #CCFF00, transparent)", boxShadow: "0 0 12px rgba(204,255,0,0.8)", top: "4%" }} />
                        <div id="qr-reader" className="w-full" />
                      </div>
                    )}

                    {/* Manual input */}
                    <div>
                      <p className="text-[9px] font-mono text-[#4B5563] uppercase tracking-widest mb-2">MANUAL ENTRY</p>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold" style={{ color: "#CCFF00" }}>&gt;</span>
                        <input value={qrInput} onChange={e => setQrInput(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter" && qrInput.trim()) handleCheckIn(); }}
                          placeholder="Team code or member ID..."
                          className="w-full bg-black/40 border border-white/[0.04] rounded-lg text-[11px] font-mono text-[var(--ck-text)] pl-8 pr-3 py-2.5 outline-none focus:border-[rgba(204,255,0,0.2)] placeholder-[#4B5563]" />
                      </div>
                    </div>

                    <button onClick={() => handleCheckIn()} disabled={!qrInput.trim()}
                      className="ck-btn-primary w-full py-2.5 text-xs">
                      <Zap className="w-3.5 h-3.5" />
                      {checkinType === "CHECK_IN" ? "RECORD CHECK-IN" : "RECORD CHECK-OUT"}
                    </button>
                  </div>
                </div>

                {/* Live counter */}
                {stats && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="ck-glass-card ck-breathe p-5 text-center"
                    style={{ borderColor: "rgba(204,255,0,0.1)" }}>
                    <p className="text-[9px] font-mono uppercase tracking-widest text-[#4B5563] mb-2">CURRENTLY INSIDE</p>
                    <motion.p className="text-5xl font-black font-mono"
                      key={stats.currentlyPresent}
                      initial={{ opacity: 0, scale: 0.7, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      style={{ color: rateColor, textShadow: `0 0 30px ${rateColor}60` }}>
                      {String(stats.currentlyPresent).padStart(2, "0")}
                    </motion.p>
                    <div className="mt-3 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                      <motion.div className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, ${rateColor}, ${rateColor}90)` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${stats.totalRegistered > 0 ? (stats.currentlyPresent / stats.totalRegistered) * 100 : 0}%` }}
                        transition={{ duration: 1, ease: "easeOut" }} />
                    </div>
                    <p className="text-[10px] font-mono text-[#4B5563] mt-2">OF {stats.totalRegistered} REGISTERED</p>
                    <div className="mt-3 pt-3 border-t border-white/[0.04] grid grid-cols-2 gap-2">
                      <div className="text-center">
                        <p className="text-[8px] font-mono text-[#4B5563] uppercase">Pending</p>
                        <p className="text-base font-black font-mono" style={{ color: "#FFD700" }}>
                          {String(stats.pendingArrival).padStart(2, "0")}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-[8px] font-mono text-[#4B5563] uppercase">Left</p>
                        <p className="text-base font-black font-mono" style={{ color: "#8892A4" }}>
                          {String(stats.totalCheckedOut).padStart(2, "0")}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
