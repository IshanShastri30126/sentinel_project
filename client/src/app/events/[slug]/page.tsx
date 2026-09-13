"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, getFileUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Calendar, MapPin, Clock, Users, Tag, Shield, AlertCircle, Zap, Eye, FileText, CheckCircle, ExternalLink, Copy, UserPlus, X, Search, Download, Phone, Mail, MessageSquare, Lock, Unlock, Terminal, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { DefaultAvatar } from "@/components/default-avatar";
import { INSTITUTES, INSTITUTE_DEPARTMENTS, SEMESTERS } from "@/app/auth/page";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";

const LinkedinIcon = ({ className = "w-4 h-4", style }: { className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ width: '1.2em', height: '1.2em', ...style }}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const InstagramIcon = ({ className = "w-4 h-4", style }: { className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ width: '1.2em', height: '1.2em', ...style }}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

interface EventDetail {
  id: string; title: string; description?: string; venue?: string;
  startDate: string; endDate: string; registrationDeadline?: string;
  posterUrl?: string; slug: string; rules?: string; tags: string[];
  minTeamSize?: number; maxTeamSize?: number; maxCapacity?: number;
  isPublished: boolean; eventType: string; googleFormUrl?: string;
  creator: { name: string; role: string };
  _count: { registrations: number; teams: number };
  documentUrl?: string;
  organizers?: string;
  socialLinks?: string;
}

interface SearchUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  isApproved?: boolean;
}

interface Organizer {
  name: string;
  role: string;
  phone?: string;
  email?: string;
}

const EVENT_THEME_GRADIENTS: Record<string, string> = {
  hackathon: "from-[#02050B] via-[#060D18] to-[#02050B]",
  workshop: "from-[#02050B] via-[#060F1A] to-[#02050B]",
  competition: "from-[#02050B] via-[#0D070F] to-[#02050B]",
  seminar: "from-[#02050B] via-[#060D18] to-[#02050B]",
  meetup: "from-[#02050B] via-[#080E14] to-[#02050B]",
  general: "from-[#02050B] via-[#050A14] to-[#02050B]",
};

const EVENT_THEME_ACCENT: Record<string, string> = {
  hackathon: "#00F5D4",
  workshop: "#00E1FF",
  competition: "#FF0055",
  seminar: "#00F5D4",
  meetup: "#FFB800",
  general: "#00F5D4",
};

function MatrixTitle({ title, accent }: { title: string; accent: string }) {
  return (
    <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 uppercase font-mono tracking-tighter">
      {title.split("").map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 * i, duration: 0.3 }}
          style={char !== " " && i % 6 === 0 ? { color: accent } : {}}
        >
          {char}
        </motion.span>
      ))}
    </h1>
  );
}

function FormattedDescription({ text }: { text: string }) {
  const paragraphs = text ? text.split(/\n\n+/) : [];
  const highlights: string[] = [];
  const regularParagraphs: string[] = [];

  paragraphs.forEach(p => {
    const trimmed = p.trim();
    const isBulletBlock = trimmed.split("\n").every(line => /^[•\-*>]/.test(line.trim()));
    if (isBulletBlock) {
      highlights.push(...trimmed.split("\n").map(l => l.replace(/^[•\-*>]\s*/, "").trim()).filter(Boolean));
    } else {
      regularParagraphs.push(trimmed);
    }
  });

  return (
    <div className="space-y-5">
      {regularParagraphs.map((p, i) => (
        <p key={i} className="text-slate-300 text-sm sm:text-base leading-relaxed">
          {p}
        </p>
      ))}
      {highlights.length > 0 && (
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
          <h4 className="text-[10px] font-bold font-mono tracking-widest uppercase text-red-400 mb-3 flex items-center gap-2">
            <Zap className="w-3 h-3" /> Key Highlights
          </h4>
          <ul className="space-y-2">
            {highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                <span className="text-red-500 font-bold mt-0.5">&gt;</span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function PublicEventPageContent() {
  const { login, register } = useAuth();
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authStudentId, setAuthStudentId] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [authDept, setAuthDept] = useState("");
  const [authSem, setAuthSem] = useState("");
  const [authInst, setAuthInst] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [clubsList, setClubsList] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedClubId, setSelectedClubId] = useState("");

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      if (authMode === "login") {
        await login(authEmail, authPassword);
      } else {
        if (!/^\d{10}$/.test(authPhone)) {
          throw new Error("Mobile number must be exactly 10 digits");
        }
        await register(authName, authEmail, authPassword, {
          studentId: authStudentId,
          phone: authPhone,
          department: authDept,
          semester: authSem,
          institute: authInst,
          clubId: selectedClubId || undefined
        });
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    async function loadClubs() {
      try {
        const data = await api<{ clubs: Array<{ id: string; name: string }> }>("/clubs");
        setClubsList(data.clubs || []);
        if (data.clubs && data.clubs.length > 0) {
          setSelectedClubId(data.clubs[0].id);
        }
      } catch (err) {
        console.warn("Clubs load notice:", err);
      }
    }
    loadClubs();
  }, []);

  const params = useParams();
  const router = useRouter();
  const { user, token } = useAuth();
  const slug = params.slug as string;

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [nowTimestamp, setNowTimestamp] = useState<number>(0);

  useEffect(() => {
    setNowTimestamp(Date.now());
    const interval = setInterval(() => setNowTimestamp(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);
  const [registered, setRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showJoinTeamModal, setShowJoinTeamModal] = useState(false);
  const [joinTeamCode, setJoinTeamCode] = useState("");
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [showPosterLightbox, setShowPosterLightbox] = useState(false);

  // CTF / Hackathon Gateway States
  const [teamInfo, setTeamInfo] = useState<{
    teamId: string | null;
    teamCode: string | null;
    joinCode: string | null;
  }>({ teamId: null, teamCode: null, joinCode: null });
  const [showGatewayModal, setShowGatewayModal] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      return sp.get("gateway") === "true" || sp.get("openGateway") === "true";
    }
    return false;
  });
  const [readinessData, setReadinessData] = useState<{
    team: {
      id: string;
      name: string;
      teamCode: string;
      joinCode?: string;
      leaderId: string;
      members: Array<{
        id: string;
        userId: string;
        name: string;
        email: string;
        memberCode?: string;
        hasJoinedTerminal: boolean;
        joinedTerminalAt?: string;
      }>;
    };
    totalMembers: number;
    readyMembers: number;
    allReady: boolean;
    percentage: number;
  } | null>(null);
  const [confirmingReady, setConfirmingReady] = useState(false);
  
  const [inviteFromUrl] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      return sp.get("joinTeam") || sp.get("invite");
    }
    return null;
  });
  
  const [isFullFromUrl] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      return sp.get("full") === "true" || sp.get("isFull") === "true";
    }
    return false;
  });

  const [formData, setFormData] = useState({
    name: user?.name || "",
    studentId: user?.studentId || "",
    email: user?.email || "",
    phone: user?.phone || "",
    department: user?.department || "",
    semester: user?.semester || "",
    institute: user?.institute || "",
    teammateCount: "0",
    teamName: ""
  });

  const [memberSearch, setMemberSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<SearchUser[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
  }, []);

  const fetchReadiness = useCallback(async (teamIdToFetch?: string) => {
    const tid = teamIdToFetch || teamInfo.teamId;
    if (!tid || !token) return;
    try {
      const data = await api<{
        team: any;
        totalMembers: number;
        readyMembers: number;
        allReady: boolean;
        percentage: number;
      }>(`/teams/${tid}/readiness`, { token });
      setReadinessData(data);
    } catch (err) {
      console.warn("Readiness check notice:", err);
    }
  }, [teamInfo.teamId, token]);

  useEffect(() => {
    if (!showGatewayModal || !teamInfo.teamId) return;
    fetchReadiness();
    const interval = setInterval(() => {
      fetchReadiness();
    }, 3000);
    return () => clearInterval(interval);
  }, [showGatewayModal, teamInfo.teamId, fetchReadiness]);

  const handleConfirmReady = async () => {
    if (!teamInfo.teamId || !token) return;
    setConfirmingReady(true);
    try {
      await api(`/teams/${teamInfo.teamId}/ready`, { method: "POST", token });
      await fetchReadiness();
      showToast("Operational readiness confirmed", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to confirm readiness", "error");
    } finally {
      setConfirmingReady(false);
    }
  };

  const searchMembers = async (q: string) => {
    setMemberSearch(q);
    if (q.length < 2) { setSearchResults([]); return; }
    try {
      const data = await api<{ users: SearchUser[] }>(`/users/search?q=${q}`, { token: token || undefined });
      setSearchResults(data.users.filter((u) => u.id !== user?.id && !selectedMembers.find((m) => m.id === u.id)));
    } catch { setSearchResults([]); }
  };

  const handleRegisterClick = () => {
    if (!token) {
      setFormData({
        name: "",
        studentId: "",
        email: "",
        phone: "",
        department: "",
        semester: "",
        institute: "",
        teammateCount: "0",
        teamName: ""
      });
      setInviteCode(null);
      setSelectedMembers([]);
      setMemberSearch("");
      setSearchResults([]);
      setShowRegisterModal(true);
      return;
    }
    setFormData({
      name: user?.name || "",
      studentId: user?.studentId || "",
      email: user?.email || "",
      phone: user?.phone || "",
      department: user?.department || "",
      semester: user?.semester || "",
      institute: user?.institute || "",
      teammateCount: "0",
      teamName: ""
    });
    setInviteCode(null);
    setSelectedMembers([]);
    setMemberSearch("");
    setSearchResults([]);
    setShowRegisterModal(true);
  };

  const handleGoogleFormRegisterClick = () => {
    if (!token) { router.push(`/auth?redirect=/events/${slug}`); return; }
    handleGoogleFormRegister();
  };

  const handleGoogleFormRegister = async () => {
    if (!token || !event) return;
    setRegistering(true);
    try {
      if (event.googleFormUrl) {
        window.open(event.googleFormUrl, "_blank", "noopener,noreferrer");
      }
      await api(`/events/${event.id}/register`, { method: "POST", token });
      setRegistered(true);
      showToast("Registration confirmed!", "success");
    } catch {
      showToast("Failed to confirm registration.", "error");
    } finally {
      setRegistering(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !event) return;
    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      showToast("Mobile number must be exactly 10 digits", "error");
      return;
    }
    setRegistering(true);
    try {
      const body: Record<string, unknown> = {
        name: formData.name,
        studentId: formData.studentId,
        phone: formData.phone,
        department: formData.department,
        semester: user?.role === "FACULTY" ? "" : formData.semester,
        institute: formData.institute
      };
      if (event.maxTeamSize && event.maxTeamSize > 1) {
        if (formData.teamName) body.teamName = formData.teamName;
        if (selectedMembers.length > 0) body.teamMembers = selectedMembers.map(m => m.email);
      }
      const response = await api<{ registration: unknown; teamCode?: string }>(
        `/events/${event.id}/register`,
        { method: "POST", token, body: JSON.stringify(body) }
      );
      setRegistered(true);
      if (response.teamCode) setInviteCode(response.teamCode);
      showToast("Registered successfully!", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Registration failed", "error");
    } finally {
      setRegistering(false);
    }
  };

  const handleJoinTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setRegistering(true);
    try {
      await api(`/teams/join`, {
        method: "POST",
        token,
        body: JSON.stringify({ teamCode: joinTeamCode })
      });
      setRegistered(true);
      setInviteCode(joinTeamCode);
      setShowJoinTeamModal(false);
      showToast("Joined team successfully!", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to join team", "error");
    } finally {
      setRegistering(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api<{ event: EventDetail }>(`/events/public/${slug}`);
        setEvent(data.event);
        if (token && data.event) {
          const regData = await api<{
            registered: boolean;
            teamId?: string | null;
            teamCode?: string | null;
            joinCode?: string | null;
          }>(`/events/${data.event.id}/is-registered`, { token });
          setRegistered(regData.registered);
          setTeamInfo({
            teamId: regData.teamId || null,
            teamCode: regData.teamCode || null,
            joinCode: regData.joinCode || null,
          });
          if (regData.teamCode) setInviteCode(regData.teamCode);

          // Check if URL has ?launch=true and event has started
          if (typeof window !== "undefined") {
            const sp = new URLSearchParams(window.location.search);
            const isLaunch = sp.get("launch") === "true";
            const sTime = data.event.startDate ? new Date(data.event.startDate).getTime() : 0;
            if (isLaunch && sTime > 0 && Date.now() >= sTime) {
              setShowGatewayModal(true);
            }
          }
        }
      } catch (err) { 
        setError(err instanceof Error ? err.message : "Event not found"); 
      } finally { 
        setLoading(false); 
      }
    };
    load();
  }, [slug, token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-10 h-10 border-3 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="ck-card p-8 max-w-md text-center border-red-900 bg-black/40">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-bold mb-2 text-white">Event Not Found</h2>
          <p className="text-sm text-slate-400">{error || "This event doesn't exist or has been unpublished."}</p>
        </div>
      </div>
    );
  }

  const themeGradient = event ? (EVENT_THEME_GRADIENTS[event.eventType] || EVENT_THEME_GRADIENTS.general) : "from-black to-black";
  const themeAccent = event ? (EVENT_THEME_ACCENT[event.eventType] || EVENT_THEME_ACCENT.general) : "#00F5D4";

  const regDeadlineTime = event.registrationDeadline ? new Date(event.registrationDeadline).getTime() : 0;
  const eventStartTime = event.startDate ? new Date(event.startDate).getTime() : 0;
  const eventEndTime = event.endDate ? new Date(event.endDate).getTime() : 0;

  const deadlinePassed = regDeadlineTime > 0 && nowTimestamp > 0 ? nowTimestamp > regDeadlineTime : false;
  const eventStarted = eventStartTime > 0 && nowTimestamp > 0 ? nowTimestamp >= eventStartTime : false;
  const eventPassed = eventEndTime > 0 && nowTimestamp > 0 ? nowTimestamp > eventEndTime : (eventStartTime > 0 && nowTimestamp > 0 ? nowTimestamp > eventStartTime + 86400000 : false);
  const isFull = event.maxCapacity
    ? event._count.registrations >= event.maxCapacity : false;
  const capacityPercent = event.maxCapacity
    ? Math.min(100, Math.round((event._count.registrations / event.maxCapacity) * 100)) : 0;

  const isCompetition = ["hackathon", "competition", "ctf"].includes(event.eventType?.toLowerCase() || "");

  const formatCountdown = (msRemaining: number) => {
    if (msRemaining <= 0) return "00:00:00";
    const totalSecs = Math.floor(msRemaining / 1000);
    const days = Math.floor(totalSecs / 86400);
    const hours = Math.floor((totalSecs % 86400) / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    if (days > 0) {
      return `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  const getTimeLeft = () => {
    if (nowTimestamp === 0) return null;

    // 1. If registration deadline is present and in the future, count down to registration deadline
    if (regDeadlineTime > 0 && regDeadlineTime > nowTimestamp) {
      const diff = regDeadlineTime - nowTimestamp;
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      return {
        days,
        hours,
        mins,
        title: "Registration Closes In",
        targetFormatted: new Date(regDeadlineTime).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      };
    }

    // 2. Fallback: Count down to event startDate if it's in the future
    if (eventStartTime > 0 && eventStartTime > nowTimestamp) {
      const diff = eventStartTime - nowTimestamp;
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      return {
        days,
        hours,
        mins,
        title: "Event Starts In",
        targetFormatted: new Date(eventStartTime).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      };
    }

    return null;
  };
  const timeLeft = getTimeLeft();

  return (
    <div className={`min-h-screen bg-gradient-to-br ${themeGradient}`}>
      {/* Hero Section */}
      <div className="relative h-80 md:h-[450px] overflow-hidden">
        {/* Floating Back Button */}
        <button
          onClick={() => router.back()}
          className="absolute top-6 left-6 z-30 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/70 border border-zinc-800 hover:border-red-500/60 text-slate-300 hover:text-white text-xs font-mono font-bold transition-all shadow-xl backdrop-blur-md group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-red-500 group-hover:-translate-x-1 transition-transform" />
          <span>Back</span>
        </button>

        {/* Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-red-950/20 to-black/80 z-10" />
        
        {/* Event Poster or Default Banner */}
        <img
          src={event.posterUrl ? getFileUrl(event.posterUrl) : "/images/cyber_banner.png"}
          alt={event.title}
          className="absolute inset-0 w-full h-full object-cover opacity-80 z-0"
        />

        <div className="absolute inset-0 flex items-end z-20">
          <div className="w-full max-w-7xl mx-auto px-6 md:px-8 pb-10">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 shadow-[0_0_8px_rgba(239,68,68,0.5)]" style={{ color: themeAccent }} />
                <span className="text-sm font-semibold font-mono tracking-wider uppercase" style={{ color: themeAccent }}>Chakravyuh Club</span>
              </div>
              <MatrixTitle title={event.title} accent={themeAccent} />
              <div className="flex flex-wrap items-center gap-3">
                {event.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {event.tags.map((tag) => (
                      <span key={tag} className="px-3 py-1 rounded-full text-xs font-semibold bg-red-950/50 text-red-400 border border-red-900/30 backdrop-blur-sm uppercase font-mono">
                        <Tag className="w-3 h-3 inline mr-1 text-red-500" />{tag}
                      </span>
                    ))}
                  </div>
                )}
                {event.posterUrl && (
                  <button
                    onClick={() => setShowPosterLightbox(true)}
                    className="px-3 py-1.5 rounded-full text-xs font-mono font-bold bg-black/60 border border-zinc-800 hover:border-red-500/50 hover:text-red-400 transition-all flex items-center gap-1.5 w-fit"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Full Poster
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 -mt-10 relative z-30 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Details Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              id="event-details-section"
              className="ck-card p-8">
              <h2 className="text-xl font-bold font-mono tracking-tighter uppercase mb-6 text-white border-b border-red-950 pb-2">Event Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-950/30 border border-red-900/30 flex items-center justify-center shrink-0">
                    <Calendar className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold font-mono text-slate-500">Date</p>
                    <p className="text-sm font-semibold text-white mt-0.5">
                      {new Date(event.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-950/30 border border-red-900/30 flex items-center justify-center shrink-0">
                    <Clock className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold font-mono text-slate-500">Time</p>
                    <p className="text-sm font-semibold text-white mt-0.5">
                      {new Date(event.startDate).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      {" — "}
                      {new Date(event.endDate).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
                {event.venue && (
                  <div className="flex items-center gap-4 col-span-1 sm:col-span-2 lg:col-span-1">
                    <div className="w-12 h-12 rounded-xl bg-red-950/30 border border-red-900/30 flex items-center justify-center shrink-0">
                      <MapPin className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold font-mono text-slate-500">Venue</p>
                      <p className="text-sm font-semibold text-white mt-0.5">{event.venue}</p>
                    </div>
                  </div>
                )}
              </div>
              {event.description && (
                <div className="mt-6 pt-6 border-t border-red-950/40">
                  <h3 className="text-sm font-bold font-mono tracking-wider uppercase mb-4" style={{ color: themeAccent }}>About This Event</h3>
                  <FormattedDescription text={event.description} />
                </div>
              )}
            </motion.div>

            {/* Rules */}
            {event.rules && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="ck-card p-8">
                <h2 className="text-xl font-bold font-mono tracking-tighter uppercase mb-4 text-white border-b border-red-950 pb-2">Rules & Guidelines</h2>
                <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">{event.rules}</p>
              </motion.div>
            )}

            {/* Team Requirements */}
            {(event.minTeamSize || event.maxTeamSize) && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="ck-card p-8">
                <h2 className="text-xl font-bold font-mono tracking-tighter uppercase mb-4 text-white border-b border-red-950 pb-2">Team Requirements</h2>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-950/30 border border-red-900/30 flex items-center justify-center shrink-0">
                    <Users className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {event.minTeamSize && event.maxTeamSize
                        ? `${event.minTeamSize} — ${event.maxTeamSize} members per team`
                        : event.minTeamSize
                        ? `Minimum ${event.minTeamSize} members`
                        : `Maximum ${event.maxTeamSize} members`}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Form your team after registering via the Teams page
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Supportive Documents Card */}
            {(() => {
              const parseDocs = (docUrl?: string | null): string[] => {
                if (!docUrl) return [];
                if (docUrl.startsWith("[")) {
                  try {
                    return JSON.parse(docUrl);
                  } catch {
                    return [docUrl];
                  }
                }
                return [docUrl];
              };
              const docs = parseDocs(event.documentUrl);
              if (docs.length === 0) return null;
              return (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                  className="ck-card p-8">
                  <h2 className="text-xl font-bold font-mono tracking-tighter uppercase mb-4 text-white border-b border-red-950 pb-2">Supportive Documents</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {docs.map((docUrl, idx) => (
                      <a key={idx} href={getFileUrl(docUrl)} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-xl border border-zinc-800 bg-[#0D0F14]/30 hover:border-red-500/40 hover:bg-[#0D0F14]/50 transition-all font-mono">
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText className="w-5 h-5 text-red-500 shrink-0" />
                          <span className="text-xs text-zinc-350 truncate">{docUrl.split("/").pop()}</span>
                        </div>
                        <span className="text-[10px] text-red-400 font-bold uppercase tracking-widest shrink-0 border border-red-900/30 px-2 py-0.5 rounded">DOWNLOAD</span>
                      </a>
                    ))}
                  </div>
                </motion.div>
              );
            })()}

            {/* Organizing Team Section */}
            {(() => {
              let organizers: any[] = [];
              if (event.organizers) {
                try {
                  organizers = JSON.parse(event.organizers);
                } catch (e) {
                  console.warn("Organizers parse notice:", e);
                }
              }
              if (organizers.length === 0) return null;
              // Sort: Faculty Coordinator first, then Student Coordinator, then others
              const roleOrder = (role: string) => {
                const r = role.toLowerCase();
                if (r.includes("faculty")) return 0;
                if (r.includes("student") || r.includes("coordinator")) return 1;
                return 2;
              };
              const sorted = [...organizers].sort((a, b) => roleOrder(a.role) - roleOrder(b.role));
              return (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                  className="ck-card p-8">
                  <h2 className="text-xl font-bold font-mono tracking-tighter uppercase mb-6 text-white border-b border-red-950 pb-2">Organizing Team</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {sorted.map((org: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-xl border border-zinc-800 bg-[#0D0F14]/30 flex flex-col justify-between hover:border-red-500/30 transition-all group relative overflow-hidden">
                        {/* Corner brackets */}
                        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-red-500/20 group-hover:border-red-500 transition-colors" />
                        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-red-500/20 group-hover:border-red-500 transition-colors" />
                        {/* Faculty/Student coordinator badge */}
                        {(org.role.toLowerCase().includes("faculty") || org.role.toLowerCase().includes("coordinator")) && (
                          <div className="absolute top-2 right-6 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-widest" style={{ backgroundColor: `${themeAccent}18`, color: themeAccent, border: `1px solid ${themeAccent}30` }}>PRIMARY</div>
                        )}
                        <div>
                          <p className="text-xs font-mono text-red-500 uppercase tracking-widest font-bold mb-1">{org.role}</p>
                          <h3 className="text-lg font-bold text-white group-hover:text-red-400 transition-colors">{org.name}</h3>
                        </div>
                        <div className="mt-4 pt-3 border-t border-zinc-900 space-y-1.5 text-xs text-slate-400 font-mono">
                          {org.phone && (
                            <a href={`tel:${org.phone}`} className="flex items-center gap-2 hover:text-white transition font-bold">
                              <Phone className="w-3.5 h-3.5 shrink-0" style={{ color: themeAccent }} />
                              <span style={{ color: themeAccent }}>{org.phone}</span>
                            </a>
                          )}
                          <a href={`mailto:${org.email}`} className="flex items-center gap-2 hover:text-white transition">
                            <Mail className="w-3.5 h-3.5 text-red-500 shrink-0" />
                            <span className="truncate">{org.email}</span>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })()}
          </div>

          {/* Sidebar — Registration Card */}
          <div className="space-y-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="ck-card p-8 sticky top-6">
              <h3 className="text-xl font-bold font-mono tracking-tighter uppercase mb-6 text-white border-b border-red-950 pb-2">Registration</h3>

              {/* Capacity Bar */}
              {event.maxCapacity && (
                <div className="mb-6">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="font-mono text-slate-400"><Users className="w-3.5 h-3.5 inline mr-1 text-red-500" />{event._count.registrations} registered</span>
                    <span className="font-medium font-mono text-slate-300">{event.maxCapacity} spots total</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden bg-black border border-red-950">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${capacityPercent}%` }} transition={{ duration: 1, delay: 0.5 }}
                      className={`h-full rounded-full ${capacityPercent >= 90 ? "bg-red-600" : capacityPercent >= 70 ? "bg-amber-600" : "bg-gradient-to-r from-red-900 to-red-500"}`} />
                  </div>
                  {isFull && <p className="text-xs text-red-500 mt-2 font-medium font-mono flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" /> Event is at full capacity</p>}
                </div>
              )}

              {/* Deadline / Event Countdown Card */}
              {(timeLeft || regDeadlineTime > 0 || eventStartTime > 0) && (
                <div className="mb-6 p-4 rounded-xl border border-red-950/40 bg-black/50">
                  {timeLeft ? (
                    <>
                      <div className="text-center mb-3">
                        <p className="text-[10px] uppercase font-bold font-mono text-slate-400 tracking-widest">{timeLeft.title}</p>
                        <p className="text-[9px] font-mono text-red-400 font-semibold mt-0.5">Target: {timeLeft.targetFormatted}</p>
                      </div>
                      <div className="flex gap-4 justify-center">
                        {[{ v: timeLeft.days, l: "Days" }, { v: timeLeft.hours, l: "Hrs" }, { v: timeLeft.mins, l: "Min" }].map((t) => (
                          <div key={t.l} className="text-center">
                            <p className="text-3xl font-extrabold font-mono text-red-500 tracking-tighter">{t.v}</p>
                            <p className="text-[9px] uppercase font-mono text-slate-500 tracking-wider mt-0.5">{t.l}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : deadlinePassed && !eventPassed ? (
                    <div className="text-center space-y-1">
                      <p className="text-xs text-red-500 font-semibold font-mono flex items-center justify-center gap-1.5"><Clock className="w-3.5 h-3.5 text-red-500" /> Registration deadline has passed</p>
                      <p className="text-[10px] text-slate-400 font-mono">Closed: {new Date(regDeadlineTime).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                    </div>
                  ) : eventPassed ? (
                    <p className="text-xs text-slate-500 font-semibold text-center font-mono flex items-center justify-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-slate-500" /> Operation Concluded</p>
                  ) : null}
                </div>
              )}

              {/* Dual Controls & Registration */}
              {isCompetition && (
                <div className="space-y-3 mb-6 p-4 rounded-xl border border-white/[0.08] bg-black/40">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold font-mono text-slate-400 tracking-widest">Operation Gateway</span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-red-950/40 text-red-400 border border-red-900/30">Dual Control</span>
                  </div>

                  {/* Dual Control 1: Details & Rules */}
                  <button
                    type="button"
                    onClick={() => {
                      document.getElementById("event-details-section")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="w-full py-2.5 px-3 rounded-lg border border-zinc-800 bg-[#0D0F14]/40 hover:border-zinc-700 hover:bg-[#0D0F14]/70 text-slate-300 hover:text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-cyan-400" />
                    <span>MISSION BRIEFING & RULES</span>
                  </button>

                  {/* Dual Control 2: Locked / Unlocked Gateway */}
                  {eventPassed ? (
                    <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-950/50 text-slate-400 text-center font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4 text-slate-500" />
                      <span>OPERATION CONCLUDED</span>
                    </div>
                  ) : !eventStarted ? (
                    <div>
                      <button
                        type="button"
                        onClick={() => showToast(`Tactical gateway locked until launch: ${new Date(eventStartTime).toLocaleString("en-IN")}`, "info")}
                        className="w-full py-3.5 px-4 rounded-xl border border-red-500/40 bg-red-950/25 hover:bg-red-950/40 text-red-400 font-mono text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition shadow-[0_0_15px_rgba(239,68,68,0.2)] cursor-pointer"
                      >
                        <Lock className="w-4 h-4 text-red-500 shrink-0" />
                        <span>LOCKED — STARTS IN {formatCountdown(eventStartTime - nowTimestamp)}</span>
                      </button>
                      <p className="text-[9px] font-mono text-slate-500 text-center mt-1.5 uppercase tracking-wider">
                        Terminal unlocks automatically upon scheduled start
                      </p>
                    </div>
                  ) : (
                    <div>
                      <button
                        type="button"
                        onClick={() => setShowGatewayModal(true)}
                        className="w-full py-3.5 px-4 rounded-xl font-mono text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 bg-gradient-to-r from-[#00F5D4] via-[#00E1FF] to-[#00F5D4] text-black shadow-[0_0_25px_rgba(0,245,212,0.6)] hover:shadow-[0_0_35px_rgba(0,245,212,0.9)] animate-pulse transition cursor-pointer"
                      >
                        <Unlock className="w-4 h-4 text-black shrink-0" />
                        <span>UNLOCKED — LAUNCH GATEWAY</span>
                      </button>
                      <p className="text-[9px] font-mono text-emerald-400 text-center mt-1.5 font-bold uppercase tracking-wider">
                        Live CTF Wars Gateway Active
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Coordinator View Banner */}
              {user?.role === "FACULTY" || user?.role === "STUDENT_COORDINATOR" || user?.role === "FACULTY_COORDINATOR" ? (
                <div className="flex flex-col gap-2 p-4 rounded-xl border border-sky-500/30 bg-sky-500/10 text-sky-400 text-center font-mono">
                  <div className="flex items-center justify-center gap-2">
                    <Eye className="w-5 h-5 text-sky-400 shrink-0" />
                    <p className="text-sm font-semibold uppercase tracking-widest">Coordinator Access — Event View Only</p>
                  </div>
                  <p className="text-[11px] text-zinc-400">Coordinators maintain administrative oversight and do not register as competing participants.</p>
                </div>
              ) : event.googleFormUrl ? (
                registered ? (
                  <div className="flex items-center justify-center gap-2 p-3 rounded-xl border border-emerald-950 bg-emerald-950/30 text-emerald-400">
                    <CheckCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-semibold uppercase font-mono tracking-widest">You&apos;re registered!</p>
                  </div>
                ) : (
                  <button
                    onClick={handleGoogleFormRegisterClick}
                    disabled={registering}
                    className="ck-btn-primary w-full py-3.5 text-sm disabled:opacity-50"
                  >
                    <ExternalLink className="w-5 h-5 inline mr-2" /> 
                    {registering ? "Registering..." : "Register via Google Form"}
                  </button>
                )
              ) : registered ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-center gap-2 p-3 rounded-xl border border-emerald-950 bg-emerald-950/30 text-emerald-400">
                    <CheckCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-semibold uppercase font-mono tracking-widest">You&apos;re registered!</p>
                  </div>
                  {inviteCode && (
                    <div className="p-4 rounded-xl border border-red-950/40 bg-red-950/10 text-center font-mono">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5">Your Team Code</p>
                      <p className="text-lg font-bold text-red-400 tracking-wider select-all">{inviteCode}</p>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(inviteCode);
                          showToast("Invite Code copied to clipboard!", "success");
                        }}
                        className="text-[10px] text-red-500 hover:text-white underline mt-1 flex items-center gap-1 mx-auto"
                      >
                        <Copy className="w-3 h-3" /> Copy Code
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleRegisterClick}
                    disabled={registering || deadlinePassed || isFull}
                    className="ck-btn-primary w-full py-3.5 text-sm disabled:opacity-50"
                  >
                    {registering ? "Registering..." : !token ? (
                      <><UserPlus className="w-5 h-5" /> Login & Register</>
                    ) : deadlinePassed ? "Deadline Passed" : isFull ? "Full" : (
                      <><UserPlus className="w-5 h-5" /> Register Now</>
                    )}
                  </button>
                  {token && (event.minTeamSize && event.minTeamSize > 1) && (
                    <button
                      onClick={() => setShowJoinTeamModal(true)}
                      className="ck-btn-secondary w-full py-3 text-xs"
                    >
                      Join Team via Invite Code
                    </button>
                  )}
                </div>
              )}

              {!event.maxCapacity && (
                <p className="text-xs mt-4 text-center font-mono text-slate-500">
                  <Users className="w-3.5 h-3.5 inline mr-1 text-red-500" />{event._count.registrations} registered · Open spots
                </p>
              )}

              {/* Organizer */}
              <div className="mt-6 pt-6 border-t border-red-950">
                <p className="text-[10px] uppercase font-semibold font-mono text-slate-500" style={{ color: "var(--ck-text-muted)" }}>Organized by</p>
                <p className="text-sm font-bold text-white mt-1">{event.creator.name}</p>
                <p className="text-xs text-red-400 font-mono mt-0.5 uppercase tracking-wider">{event.creator.role.replace(/_/g, " ")}</p>
              </div>
            </motion.div>

            {/* Chakravyuh Community Links Card — with event socialLinks */}
            {(() => {
              let socialLinks: Record<string, string> = {};
              if (event.socialLinks) {
                try { socialLinks = JSON.parse(event.socialLinks); } catch {}
              }
              const instagramUrl = socialLinks.instagram || "https://instagram.com/chakravyuh.charusat";
              const linkedinUrl = socialLinks.linkedin || "https://linkedin.com/company/chakravyuh-charusat";
              return (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  className="ck-card p-6 mt-4">
                  <h3 className="text-sm font-bold font-mono tracking-tighter uppercase mb-4 text-white border-b border-red-950 pb-2">Chakravyuh Network</h3>
                  <div className="space-y-2.5">
                    <a href={linkedinUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2.5 rounded-lg border border-zinc-800 bg-[#0D0F14]/30 hover:border-blue-500/40 hover:bg-blue-950/10 transition-all font-mono text-xs text-slate-350 group">
                      <LinkedinIcon className="w-4 h-4" style={{ color: themeAccent }} />
                      <span className="group-hover:text-white transition">LinkedIn Channel</span>
                    </a>
                    <a href={instagramUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2.5 rounded-lg border border-zinc-800 bg-[#0D0F14]/30 hover:border-pink-500/40 hover:bg-pink-950/10 transition-all font-mono text-xs text-slate-350 group">
                      <InstagramIcon className="w-4 h-4" style={{ color: themeAccent }} />
                      <span className="group-hover:text-white transition">Instagram Feed</span>
                    </a>

                    {isFullFromUrl && (
                      <div className="flex items-center gap-2 p-2.5 rounded-lg border border-red-900/40 bg-red-950/10 font-mono text-xs text-red-400">
                        <Users className="w-4 h-4 shrink-0" />
                        <span>This team is currently full.</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Registration Details Form Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="ck-card max-w-lg w-full p-6 relative max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-[#FFD700]/30 bg-[#050A18]"
          >
            <button 
              onClick={() => setShowRegisterModal(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-white z-20 w-8 h-8 rounded-full bg-black/40 border border-zinc-800 flex items-center justify-center font-mono text-sm transition"
            >
              ×
            </button>
            
            {registered ? (
              <div className="text-center py-4 space-y-6 overflow-y-auto pr-1 custom-scrollbar">
                <div className="w-16 h-16 rounded-full bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                  <CheckCircle className="w-8 h-8 text-emerald-400 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-mono text-white uppercase tracking-tighter">ACCESS GRANTED</h3>
                  <p className="text-xs text-emerald-400/80 font-mono mt-1 uppercase tracking-widest font-semibold">Registration Successful</p>
                </div>

                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/60 text-left space-y-2.5 font-mono text-xs">
                  <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                    <span className="text-zinc-500 uppercase">Event</span>
                    <span className="text-white font-semibold truncate max-w-[200px]">{event.title}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                    <span className="text-zinc-500 uppercase">Registrant</span>
                    <span className="text-white font-semibold">{formData.name}</span>
                  </div>
                  {formData.studentId && (
                    <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                      <span className="text-zinc-500 uppercase">ID</span>
                      <span className="text-white font-semibold">{formData.studentId}</span>
                    </div>
                  )}
                  {formData.teamName && (
                    <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                      <span className="text-zinc-500 uppercase">Team Name</span>
                      <span className="text-white font-semibold">{formData.teamName}</span>
                    </div>
                  )}
                </div>

                {inviteCode && (
                  <div className="p-5 rounded-xl border border-red-950/40 bg-red-950/10 text-center relative overflow-hidden group">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-bold mb-2">Teammate Invite Code</p>
                    <p className="text-2xl font-extrabold text-red-400 tracking-wider font-mono select-all select-none">{inviteCode}</p>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(inviteCode);
                        showToast("Invite Code copied to clipboard!", "success");
                      }}
                      className="text-xs text-red-400 hover:text-white underline mt-2.5 flex items-center gap-1.5 mx-auto font-mono"
                    >
                      <Copy className="w-3.5 h-3.5" /> COPY INVITE CODE
                    </button>
                  </div>
                )}

                <button 
                  onClick={() => setShowRegisterModal(false)} 
                  className="ck-btn-primary w-full py-3 font-mono font-bold uppercase tracking-wider text-xs"
                >
                  Complete
                </button>
              </div>
            ) : (
              <div className="flex flex-col h-full min-h-0">
                <div className="mb-4 pr-8 shrink-0">
                  <h3 className="text-xl font-bold font-mono text-white uppercase tracking-tighter">Registration Form</h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">Fill in your operational details to register.</p>
                </div>
                
                <form onSubmit={handleFormSubmit} className="flex flex-col flex-1 min-h-0">
                  <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar min-h-0">
                    <div>
                      <label className="ck-label font-mono uppercase tracking-wider text-[10px]">Full Name *</label>
                      <input 
                        className="ck-input" 
                        placeholder="e.g. John Doe" 
                        value={formData.name} 
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                        required 
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="ck-label font-mono uppercase tracking-wider text-[10px]">
                          {user?.role === "FACULTY" ? "Employee ID *" : "College / Student ID *"}
                        </label>
                        <input 
                          className="ck-input" 
                          placeholder={user?.role === "FACULTY" ? "e.g. EMP101" : "e.g. 22CS101"} 
                          value={formData.studentId} 
                          onChange={(e) => setFormData({ ...formData, studentId: e.target.value })} 
                          required 
                        />
                      </div>
                      <div>
                        <label className="ck-label font-mono uppercase tracking-wider text-[10px]">Mobile Number (10 Digits) *</label>
                        <input
                          className="ck-input"
                          type="tel"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder="10-digit mobile number"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                          maxLength={10}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="ck-label font-mono uppercase tracking-wider text-[10px]">Institute / College *</label>
                        <select 
                          className="ck-input" 
                          value={formData.institute} 
                          onChange={(e) => {
                            const newInst = e.target.value;
                            const depts = INSTITUTE_DEPARTMENTS[newInst] || [];
                            setFormData({ 
                              ...formData, 
                              institute: newInst,
                              department: depts.length > 0 ? depts[0] : "" 
                            });
                          }} 
                          required
                        >
                          <option value="" className="bg-[#050A18]">Select Institute...</option>
                          {INSTITUTES.map((inst) => (
                            <option key={inst} value={inst} className="bg-[#050A18] text-white">{inst}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="ck-label font-mono uppercase tracking-wider text-[10px]">Department *</label>
                        <select 
                          className="ck-input disabled:opacity-50" 
                          value={formData.department} 
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })} 
                          required 
                          disabled={!formData.institute}
                        >
                          {!formData.institute ? (
                            <option value="" className="bg-[#050A18]">Select Institute first</option>
                          ) : (
                            (INSTITUTE_DEPARTMENTS[formData.institute] || []).map((dept) => (
                              <option key={dept} value={dept} className="bg-[#050A18] text-white">{dept}</option>
                            ))
                          )}
                        </select>
                      </div>
                    </div>

                    {user?.role !== "FACULTY" && (
                      <div>
                        <label className="ck-label font-mono uppercase tracking-wider text-[10px]">Semester (1-8)</label>
                        <select 
                          className="ck-input" 
                          value={formData.semester} 
                          onChange={(e) => setFormData({ ...formData, semester: e.target.value })} 
                        >
                          <option value="" className="bg-[#050A18]">Select Semester...</option>
                          {SEMESTERS.map((sem) => (
                            <option key={sem} value={sem} className="bg-[#050A18] text-white">Semester {sem}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="ck-label font-mono uppercase tracking-wider text-[10px]">Email (Login Identifier)</label>
                      <input className="ck-input bg-zinc-900 border-zinc-800 text-zinc-550 cursor-not-allowed text-xs truncate" value={formData.email} disabled />
                    </div>

                    {event && event.maxTeamSize && event.maxTeamSize > 1 && (
                      <div className="p-4 rounded-xl border border-red-900/30 bg-red-950/10 space-y-4 font-mono">
                        <p className="text-xs font-semibold text-red-400 uppercase tracking-wider">Team Configurations Required</p>
                        <div>
                          <label className="ck-label text-[10px]">Team Name *</label>
                          <input 
                            className="ck-input" 
                            placeholder="e.g. Hex Hunters" 
                            value={formData.teamName} 
                            onChange={(e) => setFormData({ ...formData, teamName: e.target.value })} 
                            required 
                          />
                        </div>
                        <div>
                          <label className="ck-label text-[10px]">Add Teammates * (Must be registered & approved)</label>
                          <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                            <input 
                              className="ck-input pl-11" 
                              placeholder="Search teammate by name or email..." 
                              value={memberSearch} 
                              onChange={(e) => searchMembers(e.target.value)} 
                            />
                          </div>
                          {searchResults.length > 0 && (
                            <div className="mt-2 rounded-xl border border-red-900/30 max-h-40 overflow-y-auto bg-black/95 z-50 relative">
                              {searchResults.map((u) => (
                                <button 
                                  key={u.id} 
                                  type="button" 
                                  onClick={() => { 
                                    setSelectedMembers([...selectedMembers, u]); 
                                    setSearchResults([]); 
                                    setMemberSearch(""); 
                                  }}
                                  className="w-full text-left px-4 py-2.5 text-xs hover:bg-red-950/20 text-slate-300 border-b border-red-950/20 last:border-b-0 flex items-center justify-between"
                                >
                                  <span className="truncate">{u.name} ({u.email})</span>
                                  {u.isApproved ? (
                                    <span className="text-[9px] text-emerald-400 shrink-0 font-bold ml-2">APPROVED</span>
                                  ) : (
                                    <span className="text-[9px] text-amber-500 shrink-0 font-bold ml-2">PENDING</span>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                          {selectedMembers.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {selectedMembers.map((m) => (
                                <span key={m.id} className="ck-badge ck-badge-primary flex items-center gap-1.5 py-1 text-xs">
                                  <span>{m.name}</span>
                                  {!m.isApproved && (
                                    <span className="text-[8px] text-amber-500 font-bold bg-amber-500/10 px-1 rounded border border-amber-500/25">UNAPPROVED</span>
                                  )}
                                  <button 
                                    type="button" 
                                    onClick={() => setSelectedMembers(selectedMembers.filter((s) => s.id !== m.id))} 
                                    className="hover:text-red-400 p-0.5"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="ck-label text-[10px]">Estimated Teammates Count</label>
                          <input 
                            type="number" 
                            min="1" 
                            max={event.maxTeamSize - 1} 
                            className="ck-input cursor-not-allowed bg-zinc-900 border-zinc-800 text-zinc-400" 
                            placeholder="Number of teammates" 
                            value={formData.teammateCount} 
                            disabled
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 mt-2 border-t border-[#121F3D] bg-[#050A18] shrink-0">
                    <button type="submit" disabled={registering} className="ck-btn-primary w-full shadow-[0_0_20px_rgba(255,215,0,0.25)]">
                      {registering ? "Processing Registration..." : "Confirm Registration"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Join Team via Invite Code Modal */}
      {showJoinTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="ck-card max-w-md w-full p-6 relative">
            <button onClick={() => setShowJoinTeamModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded hover:bg-white/5"><X className="w-4 h-4" /></button>
            <h3 className="text-xl font-bold font-mono text-white mb-2 uppercase tracking-tighter">Join Event Team</h3>
            <p className="text-xs text-slate-400 mb-6 font-mono">Enter the invite code generated by your team leader.</p>
            
            <form onSubmit={handleJoinTeamSubmit} className="space-y-4">
              <div>
                <label className="ck-label font-mono uppercase tracking-wider text-[10px]">Invite Code *</label>
                <input 
                  className="ck-input tracking-widest text-center uppercase font-mono font-bold border-red-500/30 text-red-400 focus:border-red-500" 
                  placeholder="CK-T-XXXXXX" 
                  value={joinTeamCode} 
                  onChange={(e) => setJoinTeamCode(e.target.value.toUpperCase())} 
                  required 
                />
              </div>

              <button type="submit" disabled={registering || !joinTeamCode.trim()} className="ck-btn-primary w-full mt-6">
                {registering ? "Joining Team..." : "Join Team & Register"}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Hackathon / CTF Launch Gateway Modal */}
      {showGatewayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="ck-card max-w-2xl w-full p-6 relative max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-[#00F5D4]/40 bg-[#040814]"
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-4 mb-4 border-b border-white/[0.08]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Terminal className="w-4 h-4 text-[#00F5D4]" />
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#00F5D4] font-bold">
                    TACTICAL OPERATION GATEWAY // CTF WARS
                  </span>
                </div>
                <h3 className="text-xl font-bold font-mono text-white uppercase tracking-tight">
                  {event.title}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Host Platform: CTF Wars (Port 3001) · Automated Team Terminal Initialization
                </p>
              </div>
              <button
                onClick={() => setShowGatewayModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-black/40 border border-zinc-800 transition text-sm font-mono"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar font-mono">
              {/* Section 1: Rules & Authorized Tooling */}
              <div className="p-4 rounded-xl border border-white/[0.08] bg-black/40 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#00F5D4] uppercase tracking-wider">
                  <Shield className="w-4 h-4" />
                  <span>Competition Directives & Permitted Tools</span>
                </div>
                <ul className="text-xs text-slate-300 space-y-1.5 list-none">
                  <li className="flex items-start gap-2">
                    <span className="text-[#00F5D4] font-bold">→</span>
                    <span><strong>Flag Format:</strong> All flags must be submitted conforming to <code className="text-amber-300 bg-amber-950/40 px-1 py-0.5 rounded border border-amber-800/30">flag&#123;...&#125;</code> syntax.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#00F5D4] font-bold">→</span>
                    <span><strong>Permitted Toolset:</strong> Kali Linux, Burp Suite Community, Wireshark, Python 3, Nmap, Ghidra, CyberChef, Gobuster, sqlmap.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 font-bold">×</span>
                    <span><strong>Prohibitions:</strong> Denial of service attacks against scoring servers, automated credential brute forcing on club auth, and cross-team collusion will result in permanent disqualification.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#00F5D4] font-bold">→</span>
                    <span><strong>Readiness Protocol:</strong> 100% of team members must confirm operational status before terminal access is granted to ensure fair start.</span>
                  </li>
                </ul>
              </div>

              {/* Section 2: Team Credentials & Hierarchical Member Codes */}
              {teamInfo.teamId && readinessData?.team ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/15 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest block">Team Designation</span>
                        <span className="text-base font-bold text-white">{readinessData.team.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-widest block">Team Join Code</span>
                          <span className="text-sm font-bold text-cyan-300 tracking-wider">
                            {readinessData.team.joinCode || readinessData.team.teamCode}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const code = readinessData.team.joinCode || readinessData.team.teamCode;
                            navigator.clipboard.writeText(code);
                            showToast("Join Code copied to clipboard!", "success");
                          }}
                          className="px-2.5 py-1.5 rounded bg-black/60 border border-cyan-500/40 hover:bg-cyan-900/40 text-cyan-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>COPY</span>
                        </button>
                      </div>
                    </div>

                    {/* Member Credentials Matrix */}
                    <div className="pt-3 border-t border-white/[0.06]">
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-2">
                        Hierarchical Member Identifiers & Roles
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {readinessData.team.members.map((m, idx) => (
                          <div
                            key={m.id}
                            className="p-2.5 rounded-lg border border-zinc-800 bg-black/50 flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <span className="text-[10px] text-cyan-400 font-bold block truncate">
                                {m.memberCode || `${readinessData.team.teamCode}_${idx + 1}`}
                              </span>
                              <span className="text-xs text-slate-200 font-semibold truncate block">
                                {m.name}
                              </span>
                            </div>
                            <span
                              className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase shrink-0 ${
                                m.hasJoinedTerminal
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              }`}
                            >
                              {m.hasJoinedTerminal ? "READY" : "AWAITING"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Live Readiness Confirmation */}
                  <div className="p-4 rounded-xl border border-white/[0.08] bg-black/40 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 uppercase tracking-wider font-bold">
                        Operative Confirmation Progress
                      </span>
                      <span className="text-[#00F5D4] font-bold">
                        {readinessData.readyMembers} / {readinessData.totalMembers} Confirmed ({readinessData.percentage}%)
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 rounded-full overflow-hidden bg-zinc-900 border border-zinc-800">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${readinessData.percentage}%` }}
                        transition={{ duration: 0.5 }}
                        className={`h-full rounded-full ${
                          readinessData.allReady
                            ? "bg-gradient-to-r from-emerald-500 to-[#00F5D4]"
                            : "bg-gradient-to-r from-amber-500 to-cyan-500"
                        }`}
                      />
                    </div>

                    {/* Self Readiness Action */}
                    {(() => {
                      const currentMember = readinessData.team.members.find((m) => m.userId === user?.id);
                      if (!currentMember) return null;
                      if (!currentMember.hasJoinedTerminal) {
                        return (
                          <button
                            type="button"
                            onClick={handleConfirmReady}
                            disabled={confirmingReady}
                            className="w-full py-3 rounded-lg bg-cyan-950/60 border border-cyan-500/50 hover:bg-cyan-900/60 text-cyan-300 font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-lg cursor-pointer"
                          >
                            <ShieldCheck className="w-4 h-4 text-[#00F5D4]" />
                            <span>{confirmingReady ? "Confirming..." : "CONFIRM OPERATIVE READINESS"}</span>
                          </button>
                        );
                      }
                      return (
                        <div className="p-2.5 rounded-lg border border-emerald-500/40 bg-emerald-950/20 text-emerald-300 font-mono text-xs font-bold uppercase flex items-center justify-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          <span>YOUR READINESS CONFIRMED</span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Section 4: CTF Terminal Launch Execution */}
                  <div className="space-y-2 pt-2">
                    {readinessData.allReady ? (
                      <button
                        type="button"
                        onClick={() => {
                          const joinCode = readinessData.team.joinCode || readinessData.team.teamCode;
                          window.location.href = `http://localhost:3001/lobby?code=${encodeURIComponent(joinCode)}`;
                        }}
                        className="w-full py-4 rounded-xl font-mono text-sm font-black uppercase tracking-widest bg-gradient-to-r from-[#00F5D4] via-[#00E1FF] to-[#00F5D4] text-black shadow-[0_0_30px_rgba(0,245,212,0.6)] hover:shadow-[0_0_40px_rgba(0,245,212,0.9)] transition cursor-pointer flex items-center justify-center gap-2 animate-pulse"
                      >
                        <Terminal className="w-5 h-5 text-black" />
                        <span>ENTER CTF TERMINAL →</span>
                      </button>
                    ) : (
                      <div>
                        <button
                          type="button"
                          disabled
                          className="w-full py-3.5 rounded-xl font-mono text-xs font-bold uppercase tracking-widest bg-zinc-900/80 border border-zinc-800 text-zinc-500 cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <Lock className="w-4 h-4 text-zinc-600" />
                          <span>ENTER CTF TERMINAL (LOCKED)</span>
                        </button>
                        <p className="text-[11px] font-mono text-amber-400 text-center flex items-center justify-center gap-1.5 mt-2">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>All team members must confirm operative readiness before terminal initialization.</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : registered ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/15 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-mono">Operative Status</span>
                        <span className="text-base font-bold text-white font-mono">Solo Operative // {user?.name || "Operative"}</span>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full font-bold uppercase font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        CLEARANCE VERIFIED
                      </span>
                    </div>
                    <div className="pt-2 border-t border-white/[0.06] text-xs text-slate-300 flex items-center justify-between font-mono">
                      <span className="text-slate-400">Operative Call-Sign / ID:</span>
                      <span className="text-cyan-300 font-bold">{user?.studentId || user?.email}</span>
                    </div>
                  </div>

                  {/* Direct CTF Terminal Launch Execution */}
                  <div className="space-y-2 pt-2 font-mono">
                    <button
                      type="button"
                      onClick={() => {
                        window.location.href = "http://localhost:3001/lobby?code=HIKARI-2026";
                      }}
                      className="w-full py-4 rounded-xl font-mono text-sm font-black uppercase tracking-widest bg-gradient-to-r from-[#00F5D4] via-[#00E1FF] to-[#00F5D4] text-black shadow-[0_0_30px_rgba(0,245,212,0.6)] hover:shadow-[0_0_40px_rgba(0,245,212,0.9)] transition cursor-pointer flex items-center justify-center gap-2 animate-pulse"
                    >
                      <Terminal className="w-5 h-5 text-black" />
                      <span>ENTER CTF TERMINAL →</span>
                    </button>
                    <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5 mt-2">
                      <Shield className="w-3.5 h-3.5 text-[#00F5D4] shrink-0" />
                      <span>Individual operative clearance granted. Terminal connection authorized.</span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-xl border border-zinc-800 bg-black/40 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Registration Required</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto font-mono">
                      You must register for this event to access the CTF Wars Terminal.
                    </p>
                  </div>
                  <div className="flex gap-2 justify-center flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setShowGatewayModal(false);
                        setShowRegisterModal(true);
                      }}
                      className="ck-btn-primary py-2 px-4 text-xs font-mono"
                    >
                      Register Now
                    </button>
                  </div>
                </div>
              )}

              {/* Staff / Coordinator Direct Spectator Link */}
              {user && ["DEVELOPMENT_TEAM", "TECH_TEAM", "FACULTY_COORDINATOR", "STUDENT_COORDINATOR", "ADMIN", "FACULTY"].includes(user.role) && (
                <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between flex-wrap gap-2 text-xs">
                  <span className="text-sky-400 uppercase tracking-wider font-bold">
                    Staff Supervisor Mode
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = "http://localhost:3001/lobby";
                    }}
                    className="px-3 py-1.5 rounded-lg border border-sky-500/40 bg-sky-950/30 hover:bg-sky-900/40 text-sky-300 font-mono text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Terminal className="w-3.5 h-3.5 text-sky-400" />
                    <span>SPECTATOR DIRECT LAUNCH →</span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Poster Lightbox Modal */}
      {showPosterLightbox && event.posterUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-fade-in" onClick={() => setShowPosterLightbox(false)}>
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowPosterLightbox(false)} className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-black/80 hover:bg-red-500/20 text-red-500 border border-zinc-800"><X className="w-5 h-5" /></button>
            <img 
              src={getFileUrl(event.posterUrl)} 
              alt={event.title} 
              className="max-w-full max-h-[85vh] object-contain rounded-xl border border-zinc-800 shadow-2xl" 
            />
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-5 right-5 z-[100] flex items-center gap-3 p-4 rounded-xl border shadow-2xl ${
              toast.type === "success" 
                ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-200" 
                : toast.type === "error" 
                ? "bg-red-950/90 border-red-500/50 text-red-200" 
                : "bg-zinc-900/90 border-zinc-700/50 text-zinc-200"
            }`}
          >
            {toast.type === "success" && <CheckCircle className="w-5 h-5 text-emerald-400" />}
            {toast.type === "error" && <AlertCircle className="w-5 h-5 text-red-400" />}
            <span className="text-sm font-mono tracking-tight">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 hover:opacity-80 p-0.5 rounded bg-black/30">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PublicEventPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    }>
      <PublicEventPageContent />
    </Suspense>
  );
}
