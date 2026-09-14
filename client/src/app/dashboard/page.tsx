"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, getFileUrl } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Users,
  Calendar,
  FileCheck,
  Award,
  TrendingUp,
  ClipboardList,
  Clock,
  UsersRound,
  Activity,
  ChevronRight,
  Star,
  Zap,
  Sparkles,
  Shield,
  ArrowRight,
  MapPin,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  Database,
  FileText,
  CheckCircle,
  Eye,
  LogIn,
  Crosshair,
  Sun,
  Terminal,
  Bug,
  Trophy,
  Mic,
  Lightbulb,
  Key,
  Network,
  GraduationCap,
  Code,
  Flame,
  Crown,
  Ghost,
  Radio,
  Moon
} from "lucide-react";
import { CountUp } from "@/components/effects";

interface ClubAnalytics {
  overview: Record<string, number>;
  roleDistribution: { role: string; count: number }[];
  recentEvents: { id: string; title: string; startDate: string; _count: { registrations: number } }[];
  approvalStats: { status: string; count: number }[];
}

interface AttendanceRecord {
  id: string;
  timestamp: string;
  user: { name: string };
  event: { title: string };
}

interface OpsData {
  pendingApprovals: number;
  pendingUsers: number;
  upcomingEvents: { id: string; title: string; startDate: string; _count: { registrations: number; attendance: number } }[];
  recentAttendance: AttendanceRecord[];
}

interface MemberHistory {
  totalPoints: number;
  eventParticipation: number;
  badges: { id: string; badge: { name: string; icon: string; description?: string } }[];
  points: { id: string; category: string; reason?: string; points: number; createdAt: string; giver?: { name: string } }[];
}

interface PublicEvent {
  id: string;
  title: string;
  slug: string;
  startDate: string;
  endDate: string;
  eventType: string;
  venue?: string;
  posterUrl?: string;
  description?: string;
  maxCapacity?: number;
  documentUrl?: string;
  _count: { registrations: number };
}

// Trend / stat helpers
const STAT_ICONS: Record<string, React.ReactNode> = {
  totalUsers: <Users className="w-5 h-5" />,
  totalEvents: <Calendar className="w-5 h-5" />,
  totalCertificates: <FileCheck className="w-5 h-5" />,
  totalApprovals: <ClipboardList className="w-5 h-5" />,
  totalRegistrations: <Award className="w-5 h-5" />,
  totalTeams: <UsersRound className="w-5 h-5" />,
  totalPoints: <TrendingUp className="w-5 h-5" />,
  totalBadges: <Award className="w-5 h-5" />,
};

const STAT_ACCENTS = [
  { text: "#00F5D4", border: "border-[#00F5D4]/40", bg: "bg-[#00F5D4]/10", iconColor: "text-[#00F5D4]" },
  { text: "#00E1FF", border: "border-[#00E1FF]/40", bg: "bg-[#00E1FF]/10", iconColor: "text-[#00E1FF]" },
  { text: "#38BDF8", border: "border-[#38BDF8]/40", bg: "bg-[#38BDF8]/10", iconColor: "text-[#38BDF8]" },
  { text: "#00F5D4", border: "border-[#00F5D4]/40", bg: "bg-[#00F5D4]/10", iconColor: "text-[#00F5D4]" },
  { text: "#F59E0B", border: "border-[#F59E0B]/40", bg: "bg-[#F59E0B]/10", iconColor: "text-[#F59E0B]" },
  { text: "#10B981", border: "border-[#10B981]/40", bg: "bg-[#10B981]/10", iconColor: "text-[#10B981]" },
  { text: "#00E1FF", border: "border-[#00E1FF]/40", bg: "bg-[#00E1FF]/10", iconColor: "text-[#00E1FF]" },
  { text: "#94A3B8", border: "border-[#94A3B8]/40", bg: "bg-[#94A3B8]/10", iconColor: "text-[#94A3B8]" }];

// Unique Badge Visuals (Lucide icon themed per badge - ZERO emojis)
interface BadgeTheme {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  gradient: string;
  glow: string;
  label?: string;
}

const BADGE_THEME_MAP: Record<string, BadgeTheme> = {
  // --- Achievement badges ---
  "first blood":       { icon: Crosshair, gradient: "from-red-700 to-rose-900",     glow: "rgba(220,38,38,0.35)" },
  "early bird":        { icon: Sun, gradient: "from-amber-500 to-orange-700",  glow: "rgba(245,158,11,0.35)" },
  "hacker":            { icon: Terminal, gradient: "from-emerald-600 to-teal-800", glow: "rgba(34,197,94,0.35)" },
  "bug hunter":        { icon: Bug, gradient: "from-yellow-500 to-lime-700",   glow: "rgba(132,204,22,0.35)" },
  "ctf champion":      { icon: Trophy, gradient: "from-yellow-400 to-amber-600",  glow: "rgba(251,191,36,0.45)" },
  "team player":       { icon: Users, gradient: "from-blue-600 to-indigo-800",   glow: "rgba(99,102,241,0.35)" },
  "presenter":         { icon: Mic, gradient: "from-violet-600 to-purple-800", glow: "rgba(139,92,246,0.35)" },
  "innovator":         { icon: Lightbulb, gradient: "from-yellow-400 to-orange-500", glow: "rgba(251,146,60,0.35)" },
  "security guard":    { icon: Shield, gradient: "from-blue-700 to-cyan-900",     glow: "rgba(6,182,212,0.35)" },
  "crypto master":     { icon: Key, gradient: "from-teal-600 to-emerald-800",  glow: "rgba(20,184,166,0.35)" },
  "network ninja":     { icon: Network, gradient: "from-slate-600 to-zinc-800",    glow: "rgba(148,163,184,0.3)" },
  "top scorer":        { icon: Star, gradient: "from-yellow-300 to-amber-500",  glow: "rgba(252,211,77,0.5)" },
  "workshop guru":     { icon: GraduationCap, gradient: "from-indigo-600 to-blue-800",   glow: "rgba(99,102,241,0.35)" },
  "contributor":       { icon: Code, gradient: "from-cyan-600 to-blue-800",     glow: "rgba(34,211,238,0.35)" },
  "speedster":         { icon: Zap, gradient: "from-[#00F5D4] to-[#00B4D8]",   glow: "rgba(0,245,212,0.4)" },
  "phoenix":           { icon: Flame, gradient: "from-orange-600 to-red-800",    glow: "rgba(249,115,22,0.4)" },
  "legend":            { icon: Crown, gradient: "from-amber-400 to-yellow-600",  glow: "rgba(251,191,36,0.5)" },
  "ghost":             { icon: Ghost, gradient: "from-slate-500 to-gray-700",    glow: "rgba(148,163,184,0.3)" },
  "social butterfly":  { icon: Radio, gradient: "from-pink-500 to-rose-700",     glow: "rgba(244,63,94,0.35)" },
  "night owl":         { icon: Moon, gradient: "from-indigo-800 to-slate-900",  glow: "rgba(67,56,202,0.35)" },
  // --- Default fallback ---
  "_default":          { icon: Award, gradient: "from-zinc-700 to-zinc-900",     glow: "rgba(161,161,170,0.3)" },
};

function getBadgeTheme(badgeName: string): BadgeTheme {
  const key = badgeName.toLowerCase().trim();
  if (BADGE_THEME_MAP[key]) return BADGE_THEME_MAP[key];
  for (const [k, v] of Object.entries(BADGE_THEME_MAP)) {
    if (k !== "_default" && (key.includes(k) || k.includes(key))) return v;
  }
  return BADGE_THEME_MAP["_default"];
}



const STAT_LABELS: Record<string, string> = {
  totalUsers: "Total Members",
  totalEvents: "Events Created",
  totalRegistrations: "Registrations",
  totalCertificates: "Certificates",
  totalApprovals: "Approval Requests",
  totalTeams: "Teams",
  totalPoints: "Total Points",
  totalBadges: "Badges Awarded",
};

// Mock trend percentages for each stat key
const STAT_TRENDS: Record<string, { value: number; direction: "up" | "down" | "neutral" }> = {
  totalUsers: { value: 12, direction: "up" },
  totalEvents: { value: 8, direction: "up" },
  totalRegistrations: { value: 24, direction: "up" },
  totalCertificates: { value: 5, direction: "up" },
  totalApprovals: { value: 3, direction: "down" },
  totalTeams: { value: 0, direction: "neutral" },
  totalPoints: { value: 18, direction: "up" },
  totalBadges: { value: 15, direction: "up" },
};

// ── Mock data for data table ──
interface MemberRow {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive" | "pending";
  joinedDate: string;
  points: number;
}

const MOCK_MEMBERS: MemberRow[] = [];

type SortKey = keyof MemberRow;
type SortDir = "asc" | "desc";

const ROWS_PER_PAGE = 8;

export default function DashboardPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [clubData, setClubData] = useState<ClubAnalytics | null>(null);
  const [opsData, setOpsData] = useState<OpsData | null>(null);
  const [memberHistory, setMemberHistory] = useState<MemberHistory | null>(null);
  const [memberEvents, setMemberEvents] = useState<PublicEvent[]>([]);
  const [registeredEvents, setRegisteredEvents] = useState<PublicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("Welcome back");
  const [livePulse, setLivePulse] = useState(true);
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // ── Data table state ──
  const [tableSearch, setTableSearch] = useState("");
  const [tableRoleFilter, setTableRoleFilter] = useState("all");
  const [tableSortKey, setTableSortKey] = useState<SortKey>("id");
  const [tableSortDir, setTableSortDir] = useState<SortDir>("asc");
  const [tablePage, setTablePage] = useState(1);

  const [dbMembers, setDbMembers] = useState<MemberRow[]>([]);

  // Time greeting inside useEffect to prevent hydration mismatches
  useEffect(() => {
    const hr = new Date().getHours();
    let computedGreeting = "Good evening";
    if (hr < 12) computedGreeting = "Good morning";
    else if (hr < 17) computedGreeting = "Good afternoon";
    const timeout = setTimeout(() => {
      setGreeting(computedGreeting);
    }, 50);
    return () => clearTimeout(timeout);
  }, []);

  // Blinking green dot effect to simulate active scanning feed updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLivePulse((prev) => !prev);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

const DEFAULT_CLUB_DATA: ClubAnalytics = {
  overview: {
    totalUsers: 0,
    totalEvents: 0,
    totalCertificates: 0,
    totalBadges: 0,
    pendingApprovals: 0,
    activeAttendanceRate: 0,
  },
  roleDistribution: [],
  recentEvents: [],
  approvalStats: [],
};

const DEFAULT_OPS_DATA: OpsData = {
  pendingApprovals: 0,
  pendingUsers: 0,
  upcomingEvents: [],
  recentAttendance: [],
};

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        if (["FACULTY_COORDINATOR", "DEVELOPMENT_TEAM", "STUDENT_COORDINATOR"].includes(user.role)) {
          const [clubRes, opsRes, usersRes] = await Promise.all([
            api<ClubAnalytics>("/analytics/sentinel", { token: token || undefined }).catch((err) => {
              console.warn("Sentinel analytics notice:", err);
              return null;
            }),
            api<OpsData>("/analytics/operations", { token: token || undefined }).catch((err) => {
              console.warn("Ops analytics notice:", err);
              return null;
            }),
            api<{ users: any[] }>("/users?approved=true", { token: token || undefined }).catch((err) => {
              console.warn("Users fetch notice:", err);
              return null;
            })
          ]);
          setClubData(clubRes || DEFAULT_CLUB_DATA);
          setOpsData(opsRes || DEFAULT_OPS_DATA);
          if (usersRes && usersRes.users) {
            setDbMembers(
              usersRes.users.map((u, idx) => ({
                id: u.studentId || `CK-${String(idx + 1).padStart(3, "0")}`,
                name: u.name,
                email: u.email,
                role: u.role ? u.role.replace(/_/g, " ") : "Member",
                status: !u.isApproved ? "pending" : u.isActive ? "active" : "inactive",
                joinedDate: u.createdAt,
                points: 0,
              }))
            );
          }
        } else {
          // Fetch personal stats for regular member
          const [historyRes, eventsRes, regRes] = await Promise.all([
            api<MemberHistory>(`/appreciation/user/${user.id}/history`, { token: token || undefined }).catch((err) => {
              console.warn("Appreciation history notice:", err);
              return null;
            }),
            api<{ events: PublicEvent[] }>("/events", { token: token || undefined }).catch((err) => {
              console.warn("Events list notice:", err);
              return null;
            }),
            api<{ events: PublicEvent[] }>("/events/registered", { token: token || undefined }).catch((err) => {
              console.warn("Registered events list notice:", err);
              return null;
            })
          ]);
          if (historyRes) setMemberHistory(historyRes);
          if (eventsRes && eventsRes.events) {
            // Keep all active, live, and upcoming events (events that haven't concluded)
            const activeAndUpcoming = eventsRes.events.filter(
              (e) => new Date(e.endDate || e.startDate) >= new Date()
            );
            setMemberEvents(activeAndUpcoming);
          }
          if (regRes && regRes.events) {
            setRegisteredEvents(regRes.events);
          }
        }
      } catch (err) {
        console.warn("Dashboard load notice:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, user]);

  // ── Data table logic ──
  const filteredMembers = useMemo(() => {
    let data = [...dbMembers];

    // Search
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      data = data.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          m.id.toLowerCase().includes(q) ||
          m.role.toLowerCase().includes(q)
      );
    }

    // Role filter
    if (tableRoleFilter !== "all") {
      data = data.filter((m) => m.role.toLowerCase() === tableRoleFilter.toLowerCase());
    }

    // Sort
    data.sort((a, b) => {
      const aVal = a[tableSortKey];
      const bVal = b[tableSortKey];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return tableSortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      if (aStr < bStr) return tableSortDir === "asc" ? -1 : 1;
      if (aStr > bStr) return tableSortDir === "asc" ? 1 : -1;
      return 0;
    });

    return data;
  }, [dbMembers, tableSearch, tableRoleFilter, tableSortKey, tableSortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / ROWS_PER_PAGE));
  const paginatedMembers = filteredMembers.slice((tablePage - 1) * ROWS_PER_PAGE, tablePage * ROWS_PER_PAGE);
  
  // Reset page when filters change
  useEffect(() => {
    const timeout = setTimeout(() => {
      setTablePage(1);
    }, 50);
    return () => clearTimeout(timeout);
  }, [tableSearch, tableRoleFilter]);

  const handleSort = (key: SortKey) => {
    if (tableSortKey === key) {
      setTableSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setTableSortKey(key);
      setTableSortDir("asc");
    }
  };

  const renderSortIcon = (colKey: SortKey) => {
    if (tableSortKey !== colKey) return <ChevronsUpDown className="w-3 h-3 sort-icon" />;
    return tableSortDir === "asc"
      ? <ChevronUp className="w-3 h-3 sort-icon" />
      : <ChevronDown className="w-3 h-3 sort-icon" />;
  };

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleQuickRegister = async (eventId: string, eventTitle: string) => {
    if (!token) return;
    setRegisteringId(eventId);
    try {
      await api(`/events/${eventId}/register`, { method: "POST", token });
      showNotification(`Successfully registered for ${eventTitle}!`, "success");
      
      // Update registration status local state immediately
      setMemberEvents((prev) =>
        prev.map((e) =>
          e.id === eventId
            ? { ...e, _count: { registrations: (e._count?.registrations || 0) + 1 } }
            : e
        )
      );

      // Immediately synchronize registeredEvents state
      const targetEvent = memberEvents.find((e) => e.id === eventId);
      if (targetEvent) {
        setRegisteredEvents((prev) => {
          if (prev.some((r) => r.id === eventId)) return prev;
          return [{ ...targetEvent, _count: { registrations: (targetEvent._count?.registrations || 0) + 1 } }, ...prev];
        });
      }

      // Proactively refresh registered events list in background
      api<{ events: PublicEvent[] }>("/events/registered", { token })
        .then((regRes) => {
          if (regRes && regRes.events) {
            setRegisteredEvents(regRes.events);
          }
        })
        .catch(() => {});
    } catch (err: unknown) {
      console.warn("Register error notice:", err);
      const msg = err instanceof Error ? err.message : "Failed to register.";
      showNotification(msg, "error");
    } finally {
      setRegisteringId(null);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  } as const;
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100 } }
  } as const;

  // Helper to format date beautifully
  const formatDateBadge = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
    return { day, month };
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const getRegEventStatus = (ev: PublicEvent) => {
    const now = new Date();
    const start = new Date(ev.startDate);
    const end = new Date(ev.endDate || ev.startDate);
    if (now >= start && now <= end) return { label: "LIVE", color: "#00F5D4", dot: true };
    if (now < start) return { label: "UPCOMING", color: "#FF4D00", dot: false };
    return { label: "ENDED", color: "#4B5563", dot: false };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="ck-spinner" />
        <p className="text-xs uppercase tracking-widest font-mono text-[var(--ck-text-secondary)]">Initializing Operative Interface...</p>
      </div>
    );
  }

  const isCoordinator = ["FACULTY_COORDINATOR", "DEVELOPMENT_TEAM", "STUDENT_COORDINATOR"].includes(user?.role || "");

  return (
    <div className="space-y-6">
      {/* Toast Alert Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl border shadow-2xl font-mono text-xs uppercase tracking-wider"
            style={{
              background: notification.type === "success" ? "rgba(0,245,212,0.08)" : "rgba(255,0,60,0.08)",
              borderColor: notification.type === "success" ? "rgba(0,245,212,0.3)" : "rgba(255,0,60,0.3)",
              color: notification.type === "success" ? "#00F5D4" : "#FF003C",
              backdropFilter: "blur(16px)",
            }}
          >
            <Activity className="w-4 h-4 animate-pulse" />
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Cybernetic Greeting Banner ═══ */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl ck-glass-card ck-mesh-bg p-5 sm:p-7 lg:p-8"
      >
        {/* Animated gradient border accent at top */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00F5D4] to-transparent opacity-60" />

        {/* Scanlines overlay */}
        <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,245,212,0.008)_2px,rgba(0,245,212,0.008)_4px)] pointer-events-none z-[1]" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 text-[10px] tracking-widest uppercase font-mono mb-2.5" style={{ color: "#00F5D4" }}>
              <span className={`inline-block w-2 h-2 rounded-full transition-all duration-500 ${livePulse ? "opacity-100 scale-100" : "opacity-30 scale-75"}`} style={{ backgroundColor: "#00F5D4", boxShadow: "0 0 12px #00F5D4" }} />
              SYSTEM STATUS: SYNCED // OPERATIVE
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F5D4] via-[#00E1FF] to-white">{user?.name}</span>
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-300 font-mono">
              Welcome back to your SENTINEL Operations Command Portal. Managed clearances: <span className="font-semibold uppercase text-white font-mono">{user?.role?.replace(/_/g, " ")}</span>.
            </p>
          </div>
          <div className="rounded border border-slate-800 bg-[#070E1A] p-3.5 flex flex-col justify-center min-w-[140px] font-mono text-center shrink-0 self-start sm:self-auto shadow-sm">
            <span className="text-[10px] uppercase text-slate-400 tracking-wider">Operative Date</span>
            <span className="text-sm font-bold text-white mt-0.5">{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
            <span className="text-[10px] mt-0.5 uppercase tracking-widest font-semibold text-[#00F5D4]">{new Date().toLocaleDateString("en-US", { weekday: "long" })}</span>
          </div>
        </div>
      </motion.div>

      {isCoordinator ? (
        /* ==================== COORDINATOR / FACULTY DASHBOARD ==================== */
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
          {/* ═══ Stats Grid ═══ */}
          {clubData?.overview && (
            <motion.div variants={itemVariants} className="ck-cards-grid">
              {Object.entries(clubData.overview).map(([key, value], i) => {
                const trend = STAT_TRENDS[key] || { value: 0, direction: "neutral" as const };
                const accent = STAT_ACCENTS[i % STAT_ACCENTS.length];
                return (
                  <motion.div
                    key={key}
                    whileHover={{ scale: 1.02, y: -2 }}
                    transition={{ duration: 0.2 }}
                    className="ck-stat-card group cursor-default"
                    style={{ "--accent-color": accent.text } as React.CSSProperties}
                  >
                    <div className="flex items-start justify-between mb-3 relative z-[3]">
                      <div className={`w-8 h-8 rounded border ${accent.border} ${accent.bg} flex items-center justify-center ${accent.iconColor} shrink-0`}>
                        {STAT_ICONS[key] || <TrendingUp className="w-4 h-4" strokeWidth={1.75} />}
                      </div>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                        trend.direction === "up" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        trend.direction === "down" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                        "bg-slate-800/40 text-slate-400 border-slate-700/30"
                      }`}>
                        {trend.direction === "up" && "↑"}
                        {trend.direction === "down" && "↓"}
                        {trend.direction === "neutral" && "—"}
                        {trend.value > 0 ? ` ${trend.value}%` : ""}
                      </span>
                    </div>
                    <p className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-white relative z-[3]">
                      <CountUp end={Number(value) || 0} durationMs={1200} />
                    </p>
                    <p className="text-[10px] mt-1.5 uppercase font-mono font-bold tracking-widest text-slate-400 relative z-[3]">
                      {STAT_LABELS[key] || key}
                    </p>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* ═══ Main Grid: Events + Stream | Pending + Distro ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Upcoming Events & Live Scanner log */}
            <div className="lg:col-span-2 space-y-6">
              {/* Upcoming Events */}
              {opsData && (
                <motion.div variants={itemVariants} className="ck-glass-card p-5 sm:p-6">
                  <div className="ck-section-header">
                    <Calendar className="w-4.5 h-4.5" style={{ color: "#00F5D4" }} />
                    <h2 className="text-sm sm:text-base font-bold uppercase tracking-tight text-[var(--ck-text)] font-mono">Upcoming events</h2>
                    <span className="ml-auto text-[10px] font-mono px-2.5 py-1 rounded-full" style={{ backgroundColor: "rgba(0,245,212,0.08)", border: "1px solid rgba(0,245,212,0.2)", color: "#00F5D4" }}>
                      {opsData.upcomingEvents.length} Active
                    </span>
                  </div>

                  {opsData.upcomingEvents.length === 0 ? (
                    <div className="text-center py-10">
                      <Calendar className="w-10 h-10 text-[var(--ck-text-muted)] mx-auto mb-3 opacity-30" />
                      <p className="text-xs uppercase font-mono text-[var(--ck-text-secondary)]">No upcoming cyber operations</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {opsData.upcomingEvents.slice(0, 5).map((event, idx) => {
                        const { day, month } = formatDateBadge(event.startDate);
                        return (
                          <motion.div
                            key={event.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.06 }}
                            onClick={() => router.push(`/event/${event.id}`)}
                            className="flex items-center justify-between p-3.5 rounded-xl border border-white/[0.04] hover:border-[rgba(0,245,212,0.2)] bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300 group cursor-pointer"
                          >
                            <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-black/60 flex flex-col items-center justify-center shrink-0 border border-white/[0.06] font-mono group-hover:border-[rgba(0,245,212,0.2)] transition-colors">
                                <span className="text-xs font-bold leading-none" style={{ color: "#00F5D4" }}>{day}</span>
                                <span className="text-[9px] text-[var(--ck-text-muted)] mt-0.5 leading-none">{month}</span>
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-[var(--ck-text)] group-hover:text-[var(--ck-primary)] transition-colors truncate">{event.title}</p>
                                <p className="text-xs flex items-center gap-1.5 text-[var(--ck-text-muted)] mt-0.5">
                                  <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: "#00F5D4" }} />
                                  {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                              <div className="flex flex-col items-end">
                                <span className="ck-badge ck-badge-primary text-[10px] px-2 py-0.5">{event._count.registrations} REG</span>
                                {event._count.attendance > 0 && (
                                  <span className="text-[9px] font-mono mt-0.5" style={{ color: "#00F5D4" }}>{event._count.attendance} ATTENDED</span>
                                )}
                              </div>
                              <ChevronRight className="w-4 h-4 text-[var(--ck-text-muted)] group-hover:text-[var(--ck-primary)] group-hover:translate-x-0.5 transition-all hidden sm:block" />
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ═══ Live Attendance Stream ═══ */}
              {opsData && (
                <motion.div variants={itemVariants} className="ck-glass-card overflow-hidden">
                  {/* Terminal chrome header */}
                  <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.04] bg-black/30">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#FF003C]/80" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[#FF4D00]/80" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[#00F5D4]/80" />
                      </div>
                      <h2 className="text-xs font-bold flex items-center gap-2 uppercase tracking-wider text-[var(--ck-text)] font-mono">
                        <Activity className="w-3.5 h-3.5" style={{ color: "#00F5D4" }} /> LIVE ATTENDANCE STREAM
                      </h2>
                    </div>
                    <span className="flex items-center gap-2 text-[9px] font-mono px-2.5 py-1 rounded-full" style={{ backgroundColor: "rgba(0,245,212,0.06)", border: "1px solid rgba(0,245,212,0.15)", color: "#00F5D4" }}>
                      <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: "#00F5D4" }} />
                      MONITORING
                    </span>
                  </div>

                  <div className="p-4">
                    {!opsData.recentAttendance || opsData.recentAttendance.length === 0 ? (
                      <div className="text-center py-10">
                        <Activity className="w-10 h-10 text-[var(--ck-text-muted)] mx-auto mb-3 opacity-30" />
                        <p className="text-xs uppercase font-mono text-[var(--ck-text-secondary)]">Waiting for incoming scans...</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                        {opsData.recentAttendance.slice(0, 8).map((record, idx) => (
                          <motion.div
                            key={record.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.04 }}
                            className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-white/[0.02] transition-colors text-xs font-mono gap-2"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: "#00F5D4", boxShadow: "0 0 8px #00F5D4" }} />
                              <div className="min-w-0">
                                <span className="text-[var(--ck-text)] font-semibold">{record.user.name}</span>
                                <span className="text-[var(--ck-text-muted)] mx-1.5 hidden sm:inline">checked in to</span>
                                <span className="text-[var(--ck-text-muted)] mx-1 sm:hidden"> → </span>
                                <span style={{ color: "#00F5D4" }}>{record.event.title}</span>
                              </div>
                            </div>
                            <span className="text-[10px] text-[var(--ck-text-secondary)] shrink-0">
                              {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Right: Pending Actions & Team Distribution */}
            <div className="space-y-6">
              {/* ═══ Pending Actions ═══ */}
              {opsData && (
                <motion.div variants={itemVariants} className="ck-glass-card p-5 sm:p-6">
                  <div className="ck-section-header">
                    <ClipboardList className="w-4.5 h-4.5" style={{ color: "#FF4D00" }} />
                    <h2 className="text-sm font-bold uppercase tracking-tight text-[var(--ck-text)] font-mono">Pending Actions</h2>
                  </div>
                  <div className="space-y-3">
                    {/* Action 1: Pending Approvals */}
                    <div
                      onClick={() => router.push("/dashboard/approvals")}
                      className="group flex items-center gap-4 p-3.5 rounded border border-white/[0.06] hover:border-amber-500/40 cursor-pointer bg-[#070E1A] hover:bg-amber-500/[0.04] transition-all duration-200"
                    >
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded border border-amber-500/40 bg-amber-500/10 flex items-center justify-center text-amber-400 font-mono text-base font-extrabold">
                          {opsData.pendingApprovals}
                        </div>
                        {opsData.pendingApprovals > 0 && (
                          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors font-mono">Pending Approvals</p>
                        <p className="text-[11px] text-slate-400 mt-0.5 font-mono">Click to audit request logs</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-400 transform group-hover:translate-x-1 transition-all shrink-0" />
                    </div>

                    {/* Action 2: Pending Registration approvals */}
                    <div
                      onClick={() => router.push("/dashboard/users")}
                      className="group flex items-center gap-4 p-3.5 rounded border border-white/[0.06] hover:border-rose-500/40 cursor-pointer bg-[#070E1A] hover:bg-rose-500/[0.04] transition-all duration-200"
                    >
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded border border-rose-500/40 bg-rose-500/10 flex items-center justify-center text-rose-400 font-mono text-base font-extrabold">
                          {opsData.pendingUsers}
                        </div>
                        {opsData.pendingUsers > 0 && (
                          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[var(--ck-text)] group-hover:text-[var(--ck-danger)] transition-colors">User Registrations</p>
                        <p className="text-[11px] text-[var(--ck-text-muted)] mt-0.5">Approve new access permissions</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[var(--ck-text-muted)] group-hover:text-[var(--ck-text)] transform group-hover:translate-x-1 transition-all shrink-0" />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ═══ Team Distribution ═══ */}
              {clubData && (
                <motion.div variants={itemVariants} className="ck-glass-card p-5 sm:p-6">
                  <div className="ck-section-header">
                    <Users className="w-4.5 h-4.5" style={{ color: "#00F5D4" }} />
                    <h2 className="text-sm font-bold uppercase tracking-tight text-[var(--ck-text)] font-mono">Team Distribution</h2>
                  </div>
                  <div className="space-y-4">
                    {clubData.roleDistribution.map((r, idx) => {
                      const total = clubData.overview.totalUsers || 1;
                      const pct = Math.round((r.count / total) * 100);
                      const barColors = ["from-[#00F5D4] to-[#00BFA5]", "from-[#FF4D00] to-[#CC3D00]", "from-[#06b6d4] to-[#0891b2]", "from-[#8b5cf6] to-[#7c3aed]", "from-[#FF003C] to-[#CC002F]", "from-[#10b981] to-[#059669]"];
                      return (
                        <div key={r.role}>
                          <div className="flex justify-between text-xs font-mono mb-2">
                            <span className="text-[var(--ck-text-secondary)] font-semibold uppercase">{r.role.replace(/_/g, " ")}</span>
                            <span className="text-[var(--ck-text)] font-bold">{r.count} <span className="text-[var(--ck-text-muted)]">({pct}%)</span></span>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden bg-white/[0.03] border border-white/[0.04]">
                            <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ duration: 1, delay: 0.2 + idx * 0.1, ease: "easeOut" }}
                                  className={`h-full rounded-full bg-gradient-to-r ${barColors[idx % barColors.length]} relative overflow-hidden`}
                                >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" style={{ animation: "shimmer 2.5s ease-in-out infinite" }} />
                            </motion.div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* ═══ DATA TABLE SECTION ═══ */}
          <motion.div variants={itemVariants} className="ck-glass-card p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-2">
              <div className="ck-section-header mb-0 pb-0 border-b-0">
                <Database className="w-4.5 h-4.5" style={{ color: "#00F5D4" }} />
                <h2 className="text-sm sm:text-base font-bold uppercase tracking-tight text-[var(--ck-text)] font-mono">Member Directory</h2>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full self-start sm:self-auto" style={{ backgroundColor: "rgba(0,245,212,0.08)", border: "1px solid rgba(0,245,212,0.2)", color: "#00F5D4" }}>
                {filteredMembers.length} Records
              </span>
            </div>

            {/* Search & Filter Bar */}
            <div className="ck-filter-bar mb-4">
              <div className="ck-search-container flex-1" style={{ minWidth: "200px" }}>
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none" style={{ color: "#00F5D4" }} />
                <input
                  type="text"
                  placeholder="Search by name, email, ID..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="ck-input ck-search-input"
                  id="member-search"
                />
              </div>
              <select
                value={tableRoleFilter}
                onChange={(e) => setTableRoleFilter(e.target.value)}
                className="ck-filter-select"
                id="role-filter"
              >
                <option value="all">All Roles</option>
                <option value="Tech">Tech</option>
                <option value="Content">Content</option>
                <option value="Social Media">Social Media</option>
                <option value="Member">Member</option>
              </select>
            </div>

            {/* Data Table */}
            <div className="ck-table-wrapper" style={{ border: "1px solid rgba(255,255,255,0.04)", background: "rgba(0,0,0,0.2)" }}>
              <table className="ck-table ck-table-responsive" id="member-table">
                <thead>
                  <tr>
                    <th className={`sortable ${tableSortKey === "id" ? "sort-active" : ""}`} onClick={() => handleSort("id")}>
                      ID {renderSortIcon("id")}
                    </th>
                    <th className={`sortable ${tableSortKey === "name" ? "sort-active" : ""}`} onClick={() => handleSort("name")}>
                      Name {renderSortIcon("name")}
                    </th>
                    <th className={`sortable ${tableSortKey === "email" ? "sort-active" : ""}`} onClick={() => handleSort("email")}>
                      Email {renderSortIcon("email")}
                    </th>
                    <th className={`sortable ${tableSortKey === "role" ? "sort-active" : ""}`} onClick={() => handleSort("role")}>
                      Role {renderSortIcon("role")}
                    </th>
                    <th className={`sortable ${tableSortKey === "status" ? "sort-active" : ""}`} onClick={() => handleSort("status")}>
                      Status {renderSortIcon("status")}
                    </th>
                    <th className={`sortable ${tableSortKey === "points" ? "sort-active" : ""}`} onClick={() => handleSort("points")}>
                      Points {renderSortIcon("points")}
                    </th>
                    <th className={`sortable ${tableSortKey === "joinedDate" ? "sort-active" : ""}`} onClick={() => handleSort("joinedDate")}>
                      Joined {renderSortIcon("joinedDate")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedMembers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10">
                        <div className="flex flex-col items-center gap-2">
                          <Search className="w-8 h-8 text-[var(--ck-text-muted)] opacity-30" />
                          <p className="text-xs uppercase font-mono text-[var(--ck-text-secondary)]">No matching records found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedMembers.map((member) => (
                      <tr key={member.id}>
                        <td data-label="ID">
                          <span className="font-mono font-bold text-xs" style={{ color: "#00F5D4" }}>{member.id}</span>
                        </td>
                        <td data-label="Name">
                          <span className="font-semibold text-[var(--ck-text)]">{member.name}</span>
                        </td>
                        <td data-label="Email">
                          <span className="text-[var(--ck-text-secondary)] text-xs sm:text-sm">{member.email}</span>
                        </td>
                        <td data-label="Role">
                          <span className="ck-badge ck-badge-primary text-[10px]">{member.role}</span>
                        </td>
                        <td data-label="Status">
                          <span className={`ck-status ck-status-${member.status}`}>{member.status}</span>
                        </td>
                        <td data-label="Points">
                          <span className="font-mono font-bold text-[var(--ck-text)] text-sm">{member.points}</span>
                        </td>
                        <td data-label="Joined">
                          <span className="text-[var(--ck-text-muted)] text-xs font-mono">{formatDate(member.joinedDate)}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredMembers.length > 0 && (
              <div className="ck-pagination mt-4">
                <span className="ck-pagination-info">
                  Showing {(tablePage - 1) * ROWS_PER_PAGE + 1}–{Math.min(tablePage * ROWS_PER_PAGE, filteredMembers.length)} of {filteredMembers.length}
                </span>
                <div className="ck-pagination-controls">
                  <button
                    className="ck-page-btn"
                    disabled={tablePage <= 1}
                    onClick={() => setTablePage((p) => Math.max(1, p - 1))}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      className={`ck-page-btn ${tablePage === page ? "active" : ""}`}
                      onClick={() => setTablePage(page)}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    className="ck-page-btn"
                    disabled={tablePage >= totalPages}
                    onClick={() => setTablePage((p) => Math.min(totalPages, p + 1))}
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      ) : (
        /* ==================== STANDARD MEMBER DASHBOARD ==================== */
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
          {/* ═══ Member Personal Stats ═══ */}
          <motion.div variants={itemVariants} className="ck-cards-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
            {[
              { value: memberHistory?.totalPoints ?? 0, label: "Contribution Points", icon: <Star className="w-4 h-4" strokeWidth={1.75} />, accent: STAT_ACCENTS[0] },
              { value: memberHistory?.badges?.length ?? 0, label: "Badges Earned", icon: <Award className="w-4 h-4" strokeWidth={1.75} />, accent: STAT_ACCENTS[1] },
              { value: memberHistory?.eventParticipation ?? 0, label: "Events Participated", icon: <Calendar className="w-4 h-4" strokeWidth={1.75} />, accent: STAT_ACCENTS[2] }].map((stat) => (
              <motion.div
                key={stat.label}
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ duration: 0.2 }}
                className="ck-stat-card flex items-center gap-4 group"
                style={{ "--accent-color": stat.accent.text } as React.CSSProperties}
              >
                <div className={`w-9 h-9 rounded border ${stat.accent.border} ${stat.accent.bg} flex items-center justify-center ${stat.accent.iconColor} shrink-0`}>
                  {stat.icon}
                </div>
                <div className="min-w-0 relative z-[3]">
                  <p className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-white">
                    <CountUp end={Number(stat.value) || 0} durationMs={1200} />
                  </p>
                  <p className="text-[10px] uppercase font-mono tracking-widest text-slate-400 font-bold">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Col: Upcoming Events */}
            <div className="lg:col-span-2 space-y-6">
              {/* My Registered Events Section */}
              <motion.div variants={itemVariants} className="ck-glass-card p-5 sm:p-6">
                <div className="ck-section-header">
                  <Shield className="w-4.5 h-4.5 animate-pulse" style={{ color: "#00F5D4" }} />
                  <h2 className="text-sm sm:text-base font-bold uppercase tracking-tight text-[var(--ck-text)] font-mono">My Registered Events</h2>
                  <span className="ml-auto text-[10px] font-mono text-[var(--ck-text-muted)]">
                    {registeredEvents.length} Event{registeredEvents.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {registeredEvents.length === 0 ? (
                  <div className="text-center py-10">
                    <Shield className="w-10 h-10 text-[var(--ck-text-muted)] mx-auto mb-3 opacity-30" />
                    <p className="text-xs uppercase font-mono text-[var(--ck-text-secondary)]">No registered events yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    {registeredEvents.map((event) => {
                      const status = getRegEventStatus(event);
                      const isCoordinator = Boolean(user?.role && ["FACULTY_COORDINATOR", "DEVELOPMENT_TEAM", "STUDENT_COORDINATOR"].includes(user.role));
                      return (
                        <motion.div
                          key={event.id}
                          variants={itemVariants}
                          whileHover={{ y: -4, transition: { duration: 0.2 } }}
                          className="flex flex-col rounded-2xl border border-white/[0.04] bg-black/30 overflow-hidden hover:border-[rgba(0,245,212,0.2)] hover:shadow-[0_8px_32px_rgba(0,245,212,0.06)] transition-all duration-300 relative group"
                        >
                          {/* Image Poster with Status Badge */}
                          <div className="h-32 sm:h-40 relative overflow-hidden">
                            {event.posterUrl ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={getFileUrl(event.posterUrl)}
                                alt={event.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-[#1A1E26]/20 via-zinc-900 to-[#0D0F14]/20 flex items-center justify-center relative">
                                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(18,16,16,0.3)_1px,transparent_1px)] bg-[size:16px_16px] opacity-20" />
                                <Shield className="w-12 h-12 text-zinc-805" />
                              </div>
                            )}
                            <span
                              className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[9px] font-bold font-mono tracking-wider border uppercase backdrop-blur-sm flex items-center gap-1.5"
                              style={{
                                backgroundColor: `${status.color}15`,
                                borderColor: `${status.color}35`,
                                color: status.color,
                              }}
                            >
                              {status.dot && (
                                <span
                                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                                  style={{ backgroundColor: status.color, boxShadow: `0 0 8px ${status.color}` }}
                                />
                              )}
                              {status.label}
                            </span>
                          </div>

                          {/* Details */}
                          <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                            <div>
                              <h3 className="font-bold text-sm sm:text-base text-[var(--ck-text)] group-hover:text-[var(--ck-primary)] transition-colors line-clamp-1">
                                {event.title}
                              </h3>
                              {event.description && (
                                <p className="text-xs text-[var(--ck-text-muted)] mt-1.5 line-clamp-2 leading-relaxed">
                                  {event.description}
                                </p>
                              )}

                              <div className="mt-3 sm:mt-4 space-y-2 font-mono text-[10px] text-[var(--ck-text-secondary)]">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: "#00F5D4" }} />
                                  <span>
                                    {new Date(event.startDate).toLocaleDateString("en-IN", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })}
                                    {" · "}
                                    {new Date(event.startDate).toLocaleTimeString("en-IN", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                                {event.venue && (
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: "#00F5D4" }} />
                                    <span className="truncate">{event.venue}</span>
                                  </div>
                                )}
                                {event.documentUrl && (() => {
                                  let docs: string[] = [];
                                  if (event.documentUrl.startsWith("[")) {
                                    try { docs = JSON.parse(event.documentUrl); } catch { docs = [event.documentUrl]; }
                                  } else { docs = [event.documentUrl]; }
                                  return docs.length > 0 ? (
                                    <div className="flex flex-col gap-1.5 mt-2.5 pt-2 border-t border-zinc-900/40">
                                      {docs.map((doc, idx) => (
                                        <a
                                          key={idx}
                                          href={getFileUrl(doc)}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--ck-text-secondary)] hover:text-[var(--ck-primary)] transition truncate"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <FileText className="w-3.5 h-3.5 text-[var(--ck-accent)] shrink-0" />
                                          <span className="truncate">{doc.split("/").pop()}</span>
                                        </a>
                                      ))}
                                    </div>
                                  ) : null;
                                })()}
                              </div>
                            </div>

                            <div className="flex gap-2 mt-4 sm:mt-5">
                              <button
                                onClick={() => router.push(`/event/${event.slug}`)}
                                className="flex-1 ck-btn-secondary py-2 text-xs font-bold font-mono tracking-wider uppercase text-center cursor-pointer"
                              >
                                Details
                              </button>
                              {status.label === "LIVE" ? (
                                <button
                                  onClick={() => router.push(`/event/${event.slug}?openGateway=true`)}
                                  className="flex-1 py-2 text-xs font-black font-mono tracking-wider uppercase text-center rounded-lg bg-gradient-to-r from-[#00F5D4] via-[#00E1FF] to-[#00F5D4] text-black shadow-[0_0_20px_rgba(0,245,212,0.5)] hover:shadow-[0_0_30px_rgba(0,245,212,0.8)] animate-pulse transition cursor-pointer"
                                >
                                  ENTER TERMINAL →
                                </button>
                              ) : status.label === "ENDED" ? (
                                <button
                                  onClick={() => router.push(isCoordinator ? `/dashboard/attendance?eventId=${event.id}` : `/event/${event.slug || event.id}`)}
                                  className="flex-1 ck-btn-secondary py-2 text-xs font-bold font-mono tracking-wider uppercase text-center cursor-pointer"
                                >
                                  {isCoordinator ? "Attendance" : "Concluded"}
                                </button>
                              ) : (
                                <button
                                  onClick={() => router.push(`/event/${event.slug}`)}
                                  className="flex-1 py-2 text-xs font-bold font-mono tracking-wider uppercase text-center rounded-lg border border-red-500/30 bg-red-950/20 text-red-400 hover:bg-red-950/40 transition cursor-pointer"
                                >
                                  LOCKED
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>

              <motion.div variants={itemVariants} className="ck-glass-card p-5 sm:p-6">
                <div className="ck-section-header">
                  <Calendar className="w-4.5 h-4.5 animate-pulse" style={{ color: "#00F5D4" }} />
                  <h2 className="text-sm sm:text-base font-bold uppercase tracking-tight text-[var(--ck-text)] font-mono">Upcoming & Active Cyber Events</h2>
                  <span className="ml-auto text-[10px] font-mono text-[var(--ck-text-muted)]">Register to participate</span>
                </div>

                {memberEvents.length === 0 ? (
                  <div className="text-center py-10">
                    <Calendar className="w-10 h-10 text-[var(--ck-text-muted)] mx-auto mb-3 opacity-30" />
                    <p className="text-xs uppercase font-mono text-[var(--ck-text-secondary)]">No upcoming events listed</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    {memberEvents.map((event) => {
                      const isFacultyOrCoord = Boolean(user?.role && ["FACULTY_COORDINATOR", "DEVELOPMENT_TEAM", "STUDENT_COORDINATOR"].includes(user.role));
                      const isAlreadyRegistered = registeredEvents.some((r) => r.id === event.id);

                      return (
                        <motion.div
                          key={event.id}
                          variants={itemVariants}
                          whileHover={{ y: -4, transition: { duration: 0.2 } }}
                          className="flex flex-col rounded-2xl border border-white/[0.04] bg-black/30 overflow-hidden hover:border-[rgba(0,245,212,0.2)] hover:shadow-[0_8px_32px_rgba(0,245,212,0.06)] transition-all duration-300 relative group"
                        >
                          {/* Image Poster with Category Badge */}
                          <div className="h-32 sm:h-40 relative overflow-hidden">
                            {event.posterUrl ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={getFileUrl(event.posterUrl)}
                                alt={event.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-[#1A1E26]/20 via-zinc-900 to-[#0D0F14]/20 flex items-center justify-center relative">
                                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(18,16,16,0.3)_1px,transparent_1px)] bg-[size:16px_16px] opacity-20" />
                                <Calendar className="w-12 h-12 text-zinc-800" />
                              </div>
                            )}
                            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[9px] font-bold font-mono tracking-wider border uppercase backdrop-blur-sm" style={{ backgroundColor: "rgba(0,245,212,0.1)", borderColor: "rgba(0,245,212,0.25)", color: "#00F5D4" }}>
                              {event.eventType.replace(/_/g, " ")}
                            </span>
                            {(() => {
                              const evNow = new Date();
                              const evStart = new Date(event.startDate);
                              const evEnd = new Date(event.endDate || event.startDate);
                              const isLive = evNow >= evStart && evNow <= evEnd;
                              if (isLive) {
                                return (
                                  <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[9px] font-bold font-mono tracking-wider border uppercase backdrop-blur-sm bg-emerald-500/20 border-emerald-500/40 text-emerald-300 flex items-center gap-1.5 animate-pulse">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                    LIVE NOW
                                  </span>
                                );
                              }
                              return null;
                            })()}
                          </div>

                          {/* Details */}
                          <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                            <div>
                              <h3 className="font-bold text-sm sm:text-base text-[var(--ck-text)] group-hover:text-[var(--ck-primary)] transition-colors line-clamp-1">{event.title}</h3>
                              {event.description && (
                                <p className="text-xs text-[var(--ck-text-muted)] mt-1.5 line-clamp-2 leading-relaxed">{event.description}</p>
                              )}
                              
                              <div className="mt-3 sm:mt-4 space-y-2 font-mono text-[10px] text-[var(--ck-text-secondary)]">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: "#00F5D4" }} />
                                  <span>
                                    {new Date(event.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                    {" · "}
                                    {new Date(event.startDate).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                </div>
                                {event.venue && (
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: "#00F5D4" }} />
                                    <span className="truncate">{event.venue}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <Users className="w-3.5 h-3.5 shrink-0" style={{ color: "#00F5D4" }} />
                                  <span>
                                    {event._count.registrations} {event.maxCapacity ? `/ ${event.maxCapacity}` : ""} Registered
                                  </span>
                                </div>
                              </div>

                              {/* Capacity bar */}
                              {event.maxCapacity && (
                                <div className="mt-3">
                                  <div className="h-1 rounded-full overflow-hidden bg-white/[0.04]">
                                    <div 
                                      className="h-full bg-gradient-to-r from-[#00F5D4] to-[#FF4D00]" 
                                      style={{ width: `${Math.min(100, Math.round((event._count.registrations / event.maxCapacity) * 100))}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>

                            {isFacultyOrCoord ? (
                              <button
                                onClick={() => router.push(`/event/${event.slug}`)}
                                className="w-full ck-btn-secondary py-2.5 text-xs mt-4 sm:mt-5 flex items-center justify-center gap-1.5 font-bold font-mono tracking-wider uppercase"
                              >
                                <Eye className="w-3.5 h-3.5 text-[#00F5D4]" /> View Event
                              </button>
                            ) : !user ? (
                              <button
                                onClick={() => router.push("/auth")}
                                className="w-full ck-btn-primary py-2.5 text-xs mt-4 sm:mt-5 flex items-center justify-center gap-1.5 font-bold font-mono tracking-wider uppercase"
                              >
                                <LogIn className="w-3.5 h-3.5" /> Login to Register
                              </button>
                            ) : isAlreadyRegistered ? (
                              <button
                                onClick={() => router.push(`/event/${event.slug}`)}
                                className="w-full py-2.5 text-xs mt-4 sm:mt-5 flex items-center justify-center gap-1.5 font-bold font-mono tracking-wider uppercase border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all rounded-xl cursor-pointer"
                              >
                                <CheckCircle className="w-3.5 h-3.5" /> Registered · View Details
                              </button>
                            ) : (
                              <button
                                onClick={() => handleQuickRegister(event.id, event.title)}
                                disabled={registeringId === event.id}
                                className="w-full ck-btn-primary py-2.5 text-xs mt-4 sm:mt-5 flex items-center justify-center gap-1.5 font-bold font-mono tracking-wider uppercase disabled:opacity-50"
                              >
                                <Zap className="w-3.5 h-3.5" /> {registeringId === event.id ? "Registering..." : "Quick Register"}
                              </button>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>

              {/* ═══ Point History / Logs ═══ */}
              <motion.div variants={itemVariants} className="ck-glass-card p-5 sm:p-6">
                <div className="ck-section-header">
                  <TrendingUp className="w-4.5 h-4.5" style={{ color: "#00F5D4" }} />
                  <h2 className="text-sm sm:text-base font-bold uppercase tracking-tight text-[var(--ck-text)] font-mono">Contribution Log</h2>
                </div>

                {!memberHistory?.points || memberHistory.points.length === 0 ? (
                  <div className="text-center py-10">
                    <TrendingUp className="w-10 h-10 text-[var(--ck-text-muted)] mx-auto mb-3 opacity-30" />
                    <p className="text-xs uppercase font-mono text-[var(--ck-text-secondary)]">No point history found</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                    {memberHistory.points.slice(0, 10).map((log, idx) => (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        className="flex items-center justify-between p-3 rounded border border-white/[0.06] hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/60 transition-all text-xs font-mono gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-1 h-8 rounded-none shrink-0" style={{ background: log.points >= 0 ? "linear-gradient(180deg, #00F5D4, #00BFA5)" : "linear-gradient(180deg, #FF003C, #CC002F)" }} />
                          <div className="min-w-0">
                            <p className="font-semibold text-white uppercase">{log.category.replace(/_/g, " ")}</p>
                            {log.reason && <p className="text-[10px] text-slate-400 mt-0.5 truncate">{log.reason}</p>}
                            <p className="text-[9px] text-slate-500 mt-0.5">Approved by {log.giver?.name || "System"} · {new Date(log.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <span className="text-sm font-bold font-mono px-2.5 py-1 rounded shrink-0 border" style={{
                          backgroundColor: log.points >= 0 ? "rgba(0,245,212,0.08)" : "rgba(255,0,60,0.08)",
                          color: log.points >= 0 ? "#00F5D4" : "#FF003C",
                          borderColor: log.points >= 0 ? "rgba(0,245,212,0.2)" : "rgba(255,0,60,0.2)"
                        }}>
                          {log.points >= 0 ? `+${log.points}` : log.points} PTS
                        </span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Right Col: Badges & Quick actions */}
            <div className="space-y-6">
              {/* ═══ Badges showcase ═══ */}
              <motion.div variants={itemVariants} className="ck-glass-card p-5 sm:p-6">
                <div className="ck-section-header">
                  <Award className="w-4.5 h-4.5" style={{ color: "#00F5D4" }} />
                  <h2 className="text-sm sm:text-base font-bold uppercase tracking-tight text-[var(--ck-text)] font-mono">BADGES VAULT</h2>
                </div>

                {!memberHistory?.badges || memberHistory.badges.length === 0 ? (
                  <div className="text-center py-8">
                    <Award className="w-10 h-10 text-[var(--ck-text-muted)] mx-auto mb-3 opacity-30" />
                    <p className="text-xs uppercase font-mono text-[var(--ck-text-secondary)]">No badges unlocked yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {memberHistory.badges.map((b) => {
                      const theme = getBadgeTheme(b.badge.name);
                      const BadgeIcon = theme.icon;
                      return (
                        <motion.div
                          key={b.id}
                          title={b.badge.description || b.badge.name}
                          whileHover={{ scale: 1.04, y: -2 }}
                          transition={{ type: "spring", stiffness: 300 }}
                          className="relative p-3 rounded border text-center transition-all duration-200 cursor-help overflow-hidden group bg-[#070E1A]"
                          style={{
                            borderColor: "rgba(255,255,255,0.08)",
                          }}
                        >
                          {/* Badge icon - technical rectangular frame */}
                          <div className="w-8 h-8 rounded border border-slate-700/80 bg-slate-900/90 mx-auto mb-2 flex items-center justify-center">
                            <BadgeIcon className="w-4 h-4 text-[#00F5D4]" />
                          </div>
                          <p className="relative text-[9px] font-mono font-bold mt-1 truncate uppercase tracking-wider text-slate-200 group-hover:text-white transition-colors">{b.badge.name}</p>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

              </motion.div>

              {/* ═══ Quick Actions Shortcuts ═══ */}
              <motion.div variants={itemVariants} className="ck-glass-card p-5 sm:p-6">
                <div className="ck-section-header">
                  <Zap className="w-4.5 h-4.5" style={{ color: "#FF4D00" }} />
                  <h2 className="text-sm sm:text-base font-bold uppercase tracking-tight text-[var(--ck-text)] font-mono">QUICK CHANNELS</h2>
                </div>
                <div className="space-y-2">
                  {[
                    { label: "BROWSE ALL EVENTS", href: "/events" },
                    { label: "LEADERBOARD SCORES", href: "/leaderboard" },
                    { label: "EDIT OPERATIVE PROFILE", href: "/profile" }].map((action) => (
                    <button
                      key={action.href}
                      onClick={() => router.push(action.href)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded border border-white/[0.06] hover:border-cyan-500/30 bg-[#070E1A] hover:bg-white/[0.04] text-[11px] font-mono transition-all group cursor-pointer"
                    >
                      <span className="text-slate-300 group-hover:text-[#00F5D4] transition-colors">{action.label}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#00F5D4] group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
