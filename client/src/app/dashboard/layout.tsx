"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth, Role } from "@/lib/auth-context";
import { api, getFileUrl } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, LayoutDashboard, Calendar, Users, Award,
  FileCheck, BarChart3, CheckSquare, LogOut,
  ChevronLeft, ChevronRight, ClipboardList, Bell, Menu, X, UsersRound,
  User, Info, Check, CheckCheck, RotateCw, ShieldAlert, Terminal
} from "lucide-react";
import { DefaultAvatar } from "@/components/default-avatar";
import { SentinelLogo } from "@/components/SentinelLogo";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface NavItem { label: string; href: string; icon: React.ReactNode; roles?: Role[]; }

const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: "Events", href: "/dashboard/event", icon: <Calendar className="w-5 h-5" />, roles: ["FACULTY_COORDINATOR", "STUDENT_COORDINATOR", "TECH_COORDINATOR", "FACULTY", "TECH"] },
  { label: "Teams", href: "/dashboard/teams", icon: <UsersRound className="w-5 h-5" /> },
  { label: "Attendance", href: "/dashboard/attendance", icon: <CheckSquare className="w-5 h-5" /> },
  { label: "Certificates", href: "/dashboard/certificates", icon: <FileCheck className="w-5 h-5" />, roles: ["FACULTY_COORDINATOR", "STUDENT_COORDINATOR", "TECH_COORDINATOR", "FACULTY", "TECH"] },
  { label: "Approvals", href: "/dashboard/approvals", icon: <ClipboardList className="w-5 h-5" />, roles: ["FACULTY_COORDINATOR", "STUDENT_COORDINATOR", "TECH_COORDINATOR", "FACULTY", "TECH"] },
  { label: "Leaderboard", href: "/dashboard/leaderboard", icon: <Award className="w-5 h-5" /> },
  { label: "Users", href: "/dashboard/users", icon: <Users className="w-5 h-5" />, roles: ["FACULTY_COORDINATOR", "STUDENT_COORDINATOR", "TECH_COORDINATOR", "FACULTY", "TECH"] },
  { label: "Analytics", href: "/dashboard/analytics", icon: <BarChart3 className="w-5 h-5" />, roles: ["FACULTY_COORDINATOR", "STUDENT_COORDINATOR", "TECH_COORDINATOR", "FACULTY", "TECH"] },
  { label: "Landing CMS", href: "/dashboard/landing-management", icon: <LayoutDashboard className="w-5 h-5" />, roles: ["FACULTY_COORDINATOR", "TECH_COORDINATOR", "FACULTY", "TECH"] },
  { label: "Maintenance Logs", href: "/dashboard/maintenance", icon: <Terminal className="w-5 h-5" />, roles: ["FACULTY_COORDINATOR", "TECH_COORDINATOR", "FACULTY", "TECH"] },
  { label: "My Certificates", href: "/dashboard/my-certificates", icon: <Award className="w-5 h-5" /> },
  { label: "Profile", href: "/dashboard/profile", icon: <User className="w-5 h-5" /> },
  { label: "Info", href: "/dashboard/info", icon: <Info className="w-5 h-5" />, roles: ["FACULTY_COORDINATOR"] },
];

const ROLE_LABELS: Record<Role, string> = {
  FACULTY_COORDINATOR: "Faculty Coordinator",
  STUDENT_COORDINATOR: "Student Coordinator",
  TECH_COORDINATOR: "Tech Team",
  MEMBER: "Member",
  GUEST: "Guest",
  FACULTY: "Faculty Coordinator",
  TECH: "Tech Team",
  CONTENT: "Content Team",
  SOCIAL_MEDIA: "Social Media",
};

const MODULE_CATEGORIES: Record<string, { label: string; color: string; dotColor: string }> = {
  core: { label: "Command & Control", color: "text-[#00E1FF]", dotColor: "bg-[#00E1FF]" },
  tactical: { label: "Operations & Attendance", color: "text-[#00F5D4]", dotColor: "bg-[#00F5D4]" },
  credentials: { label: "Recognition & Badges", color: "text-[#A855F7]", dotColor: "bg-[#A855F7]" },
  clearance: { label: "Clearance & Admin", color: "text-[#FF0055]", dotColor: "bg-[#FF0055]" }
};

const getModuleCategoryKey = (label: string): string => {
  if (["Overview", "Analytics", "Profile"].includes(label)) return "core";
  if (["Events", "Teams", "Attendance"].includes(label)) return "tactical";
  if (["Certificates", "My Certificates", "Leaderboard"].includes(label)) return "credentials";
  if (["Approvals", "Landing CMS", "Users", "Info"].includes(label)) return "clearance";
  return "core";
};

function AnimatedHamburger({
  isOpen,
  onClick,
}: {
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
      aria-expanded={isOpen}
      className="flex shrink-0 min-w-[44px] min-h-[44px] w-11 h-11 rounded-lg border border-[var(--ck-border)] bg-[var(--ck-bg-secondary)] items-center justify-center hover:border-[#00F5D4]/50 hover:bg-[#00F5D4]/5 transition-all duration-200 cursor-pointer group"
      title={isOpen ? "Close Navigation Gateway" : "Open Navigation Gateway"}
    >
      <div className="w-5 h-3.5 relative flex flex-col justify-between items-center">
        <motion.span
          animate={isOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 22 }}
          className="w-5 h-0.5 bg-[#8892A4] group-hover:bg-[#00F5D4] rounded-full transition-colors origin-center block"
        />
        <motion.span
          animate={isOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.15 }}
          className="w-5 h-0.5 bg-[#8892A4] group-hover:bg-[#00F5D4] rounded-full transition-colors origin-center block"
        />
        <motion.span
          animate={isOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 22 }}
          className="w-5 h-0.5 bg-[#8892A4] group-hover:bg-[#00F5D4] rounded-full transition-colors origin-center block"
        />
      </div>
    </button>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout, token } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState<Notification[]>([]);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [disablePopups, setDisablePopups] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("ck_disable_popups") === "true";
    }
    return false;
  });
  const [activeToast, setActiveToast] = useState<Notification | null>(null);

  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [activeToast]);

  const handleTogglePopups = (checked: boolean) => {
    setDisablePopups(checked);
    localStorage.setItem("ck_disable_popups", checked ? "true" : "false");
  };

  const handleToastRedirect = () => {
    router.push("/notifications");
    setActiveToast(null);
  };

  const handleMarkToastRead = async (id: string) => {
    try {
      await api(`/notifications/${id}/read`, { method: "PATCH", token: token || undefined });
      setUnreadNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setActiveToast(null);
    } catch (err) {
      console.warn("Toast read notice:", err);
    }
  };

  useEffect(() => {
    if (!isLoading && !user) router.push("/");
  }, [user, isLoading, router]);

  // Fetch unread notifications list & poll for real-time updates
  useEffect(() => {
    if (!user) return;
    
    const fetchNotifications = async () => {
      try {
        const data = await api<{ notifications: Notification[] }>("/notifications", { token: token || undefined });
        const unread = data.notifications.filter((n) => !n.isRead);
        setUnreadNotifications(unread);
        setUnreadCount(unread.length);
        
        // Show bottom-right popup on first load if notifications exist and not disabled
        if (unread.length > 0 && !sessionStorage.getItem("ck_notified")) {
          const storedDisable = localStorage.getItem("ck_disable_popups") === "true";
          if (!storedDisable && unread[0]) {
            setActiveToast(unread[0]);
          }
          sessionStorage.setItem("ck_notified", "true");
        }
      } catch { /* ignore */ }
    };
    
    fetchNotifications();
    
    // Set up polling interval to get new ones
    const interval = setInterval(async () => {
      try {
        const data = await api<{ notifications: Notification[] }>("/notifications", { token: token || undefined });
        const unread = data.notifications.filter((n) => !n.isRead);
        setUnreadNotifications((prev) => {
          // If there are new unread notifications that were not in prev, trigger active toast!
          const prevIds = new Set(prev.map(p => p.id));
          const newNotifs = unread.filter(u => !prevIds.has(u.id));
          const storedDisable = localStorage.getItem("ck_disable_popups") === "true";
          if (newNotifs.length > 0 && !storedDisable) {
            setActiveToast(newNotifs[0]);
          }
          return unread;
        });
        setUnreadCount(unread.length);
      } catch { /* ignore */ }
    }, 30000);

    return () => clearInterval(interval);
  }, [token]);

  const markNotificationRead = async (id: string) => {
    try {
      await api(`/notifications/${id}/read`, { method: "PATCH", token: token || undefined });
      setUnreadNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.warn("Notification read notice:", err);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await api("/notifications/read-all", { method: "PATCH", token: token || undefined });
      setUnreadNotifications([]);
      setUnreadCount(0);
      setShowNotificationModal(false);
    } catch (err) {
      console.warn("Mark all read notice:", err);
    }
  };

  useEffect(() => {
    if (mobileOpen) {
      document.body.classList.add("drawer-open");
    } else {
      document.body.classList.remove("drawer-open");
    }
    return () => document.body.classList.remove("drawer-open");
  }, [mobileOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileOpen) {
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  const prevPathnameRef = useRef(pathname);
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      setMobileOpen(false);
    }
  }, [pathname]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--ck-bg)]">
        <div className="w-10 h-10 border-3 border-red-500/30 border-t-red-500 rounded-full animate-spin shadow-[0_0_15px_rgba(220,38,38,0.3)]" />
      </div>
    );
  }

  if (!user.isApproved && user.role !== "GUEST") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--ck-bg)" }}>
        <div className="ck-card p-8 max-w-md text-center">
          <div className="w-12 h-12 rounded border border-amber-500/40 bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-6 h-6 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: "var(--ck-text)" }}>Account Pending Approval</h2>
          <p className="text-sm mb-6" style={{ color: "var(--ck-text-secondary)" }}>
            Your account is awaiting coordinator approval. You&apos;ll be notified once approved.
          </p>
          <button onClick={() => { logout(); router.push("/"); }} className="ck-btn-secondary">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>
    );
  }

  const filteredNav = NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(user.role));

  return (
    <div className="flex min-h-screen relative overflow-x-hidden" style={{ background: "var(--ck-bg-gradient, var(--ck-bg))" }}>
      {/* Vertical Navigation Drawer on Left Side */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Click-outside backdrop */}
            <motion.div
              key="vertical-nav-backdrop"
              className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
            />

            {/* Left Vertical Drawer Panel */}
            <motion.aside
              key="vertical-nav-drawer"
              className="fixed inset-y-0 left-0 z-50 w-72 sm:w-80 h-full bg-[#050711]/98 border-r border-[#121F3D] shadow-[15px_0_50px_rgba(0,0,0,0.85),_0_0_30px_rgba(0,245,212,0.06)] flex flex-col backdrop-blur-2xl overflow-hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
            >
              {/* Right-edge neon gradient vertical accent line */}
              <div className="absolute top-0 right-0 bottom-0 w-[2px] bg-gradient-to-b from-[#00F5D4] via-[#00E1FF] to-[#FF0055] opacity-75 shadow-[0_0_12px_rgba(0,245,212,0.4)]" />

              {/* Drawer Top Header */}
              <div className="h-[52px] sm:h-[56px] px-4 border-b border-[#121F3D] flex items-center justify-between shrink-0 bg-[#050A18]/80">
                <Link
                  href="/"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 hover:opacity-90 transition"
                >
                  <SentinelLogo collapsed={false} showText={true} animateDrawing={false} className="scale-90 origin-left" />
                </Link>

                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="w-8 h-8 rounded-lg border border-[#1A284D] flex items-center justify-center text-[#8892A4] hover:text-[#00F5D4] hover:border-[#00F5D4]/40 transition-all duration-200 cursor-pointer group"
                  aria-label="Close navigation"
                >
                  <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
                </button>
              </div>

              {/* Cyber Sub-header Banner */}
              <div className="text-[9px] font-mono text-[#00F5D4] uppercase tracking-widest px-4 py-2 border-b border-white/[0.04] bg-[#080E24]/60 flex items-center justify-between shrink-0">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00F5D4] animate-ping" />
                  NAVIGATION // VERTICAL GATEWAY
                </span>
                <span className="text-zinc-500 font-bold">{filteredNav.length} MODS</span>
              </div>

              {/* Scrollable Navigation Body */}
              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 custom-scrollbar">
                {(() => {
                  const groupedNav: Record<string, typeof NAV_ITEMS> = {
                    core: [],
                    tactical: [],
                    credentials: [],
                    clearance: []
                  };
                  filteredNav.forEach((item) => {
                    const catKey = getModuleCategoryKey(item.label);
                    groupedNav[catKey].push(item);
                  });

                  return Object.entries(MODULE_CATEGORIES).map(([key, cat]) => {
                    const items = groupedNav[key];
                    if (items.length === 0) return null;
                    return (
                      <div key={key} className="space-y-1.5">
                        {/* Category Label */}
                        <div className="px-2 pb-1 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${cat.dotColor} shadow-[0_0_8px_currentColor]`} />
                            <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">{cat.label}</span>
                          </div>
                          <span className="text-[8px] font-mono text-zinc-600">{items.length}</span>
                        </div>

                        {/* Navigation Items */}
                        <div className="space-y-1">
                          {items.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                                className={`group relative flex items-center justify-between px-3 py-2 rounded border font-mono text-[11px] transition-all duration-200 ${
                                  isActive
                                    ? "bg-[#00F5D4]/10 border-[#00F5D4] text-[#00F5D4] font-bold shadow-[0_0_12px_rgba(0,245,212,0.15)]"
                                    : "bg-[#080E24]/60 border-[#121F3D]/80 text-slate-300 hover:border-[#00F5D4]/40 hover:text-white hover:bg-[#0A122A] hover:translate-x-1"
                                }`}
                              >
                                {isActive && (
                                  <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-[#00F5D4] shadow-[0_0_8px_#00F5D4]" />
                                )}
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className={`p-1 rounded transition-colors ${isActive ? "text-[#00F5D4]" : "text-slate-400 group-hover:text-[#00F5D4]"}`}>
                                    {item.icon}
                                  </div>
                                  <span className="truncate">{item.label}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  {isActive && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#00F5D4] shadow-[0_0_8px_#00F5D4]" />
                                  )}
                                  <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-[#00F5D4]" />
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Bottom Pinned User Profile Card & Sign Out */}
              <div className="p-3 border-t border-[#121F3D] bg-[#050A18]/90 shrink-0 space-y-2.5">
                <Link
                  href="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 bg-[#080E24] border border-[#121F3D] rounded p-2.5 hover:border-[#00F5D4]/40 transition-all duration-200 group"
                >
                  <DefaultAvatar
                    src={user.avatarUrl ? getFileUrl(user.avatarUrl) : null}
                    alt={user.name}
                    className="w-9 h-9 border border-[#00F5D4]/30 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-white truncate group-hover:text-[#00F5D4] transition-colors">{user.name}</p>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00F5D4] animate-pulse shadow-[0_0_6px_#00F5D4]" title="Active Session" />
                    </div>
                    <p className="text-[9px] font-mono text-[#00F5D4] tracking-wider uppercase mt-0.5">{ROLE_LABELS[user.role as Role]}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#00F5D4] group-hover:translate-x-0.5 transition-all" />
                </Link>

                <button
                  type="button"
                  onClick={() => { setMobileOpen(false); logout(); router.push("/"); }}
                  className="w-full py-2.5 px-4 rounded bg-[#FF0055]/10 border border-[#FF0055]/30 text-[#FF0055] font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-[#FF0055] hover:text-black hover:shadow-[0_0_18px_rgba(255,0,85,0.4)] transition-all duration-200 cursor-pointer min-h-[44px] flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> TERMINATE SESSION
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 overflow-x-hidden min-w-0 w-full max-w-full">
        {/* Universal Top Navigation Bar (Single Unified Row ~52px) */}
        <div className="flex items-center justify-between px-3 sm:px-6 lg:px-8 border-b border-[var(--ck-border)] sticky top-0 z-30 bg-[#050A18] h-[52px] sm:h-[56px] w-full">
          {/* Top Bar Left: [Menu Toggle Icon] [Merged Logo Mark + Wordmark] */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Animated Hamburger Button with Micro-Animations */}
            <AnimatedHamburger
              isOpen={mobileOpen}
              onClick={() => setMobileOpen(!mobileOpen)}
            />

            {/* Merged Logo Mark + Wordmark inside Sticky Top Bar */}
            <Link href="/" className="flex items-center gap-2 min-w-0 shrink hover:opacity-90 transition">
              <SentinelLogo collapsed={false} showText={true} animateDrawing={false} className="scale-90 origin-left shrink-0" />
            </Link>
          </div>

          {/* Top Bar Right: [Refresh Icon] [Notification Icon] */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Refresh Button (≥44x44px touch target) */}
            <button
              onClick={() => window.location.reload()}
              className="min-w-[44px] min-h-[44px] rounded-lg border border-[var(--ck-border)] bg-[var(--ck-bg-secondary)] flex items-center justify-center hover:border-[#00F5D4]/40 transition cursor-pointer"
              title="Refresh page contents"
              aria-label="Refresh page contents"
            >
              <RotateCw className="w-4 h-4 text-[#8892A4] hover:text-[#00F5D4]" />
            </button>

            {/* Notification Bell (≥44x44px touch target) */}
            <button 
              onClick={() => setShowNotificationModal(prev => !prev)} 
              className="min-w-[44px] min-h-[44px] relative rounded-lg border border-[var(--ck-border)] bg-[var(--ck-bg-secondary)] flex items-center justify-center hover:border-[#00F5D4]/40 transition cursor-pointer"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4 text-[#8892A4] hover:text-[#00F5D4]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4.5 h-4.5 text-black text-[9px] font-black rounded-full flex items-center justify-center bg-[#00F5D4] shadow-[0_0_8px_rgba(0,245,212,0.8)]">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Popover Dropdown */}
            <AnimatePresence>
              {showNotificationModal && (
                <>
                  {/* Transparent click detector backdrop */}
                  <div
                    onClick={() => setShowNotificationModal(false)}
                    className="fixed inset-0 z-40"
                  />

                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-80 sm:w-96 z-50 flex flex-col shadow-2xl rounded-xl overflow-hidden border"
                    style={{
                      background: "rgba(4,7,10,0.97)",
                      borderColor: "rgba(0,245,212,0.3)",
                      backdropFilter: "blur(20px)",
                      WebkitBackdropFilter: "blur(20px)",
                    }}
                  >
                    {/* Header cyan bar */}
                    <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, transparent, #00F5D4, transparent)" }} />
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-[#121F3D] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#00F5D4" }} />
                        <span className="text-[10px] uppercase tracking-widest font-bold font-mono" style={{ color: "#00F5D4" }}>
                          CYBER TELEMETRY FEED
                        </span>
                      </div>
                      <button
                        onClick={() => setShowNotificationModal(false)}
                        className="w-6 h-6 rounded-md border border-[#1A1E26] flex items-center justify-center text-[#4B5563] hover:text-[var(--ck-text)] hover:border-[rgba(255,0,60,0.3)] transition-all cursor-pointer"
                        aria-label="Close feed"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Action bar if there are unread notifications */}
                    {unreadNotifications.length > 0 && (
                      <div className="px-4 py-2 border-b border-[#1A1E26] flex justify-between items-center" style={{ background: "rgba(0,245,212,0.03)" }}>
                        <span className="text-[9px] text-[#4B5563] uppercase tracking-wider font-mono">
                          {unreadNotifications.length} UNREAD
                        </span>
                        <button
                          onClick={markAllNotificationsRead}
                          className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider font-bold font-mono hover:underline transition-all cursor-pointer"
                          style={{ color: "#00F5D4" }}
                        >
                          <CheckCheck className="w-3 h-3" /> MARK ALL READ
                        </button>
                      </div>
                    )}

                    {/* Feed Content */}
                    <div className="max-h-[320px] overflow-y-auto p-3 space-y-2 custom-scrollbar">
                      <AnimatePresence initial={false}>
                        {unreadNotifications.length > 0 ? (
                          unreadNotifications.map((notif) => (
                            <motion.div
                              key={notif.id}
                              layout
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: 50, transition: { duration: 0.15 } }}
                              className="overflow-hidden"
                            >
                              <div className="p-3 rounded border border-[#1A1E26] hover:border-[rgba(0,245,212,0.15)] transition-all flex gap-3 relative group overflow-hidden bg-[var(--ck-bg-card)]">
                                <div className="absolute top-0 bottom-0 left-0 w-[2px]" style={{ background: "#00F5D4", boxShadow: "0 0 6px rgba(0,245,212,0.6)" }} />

                                <div className="flex-1 min-w-0 pl-1">
                                  <div className="flex items-start justify-between gap-2 mb-1">
                                    <span className="font-semibold text-xs text-[var(--ck-text)] tracking-wide" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                                      {notif.title}
                                    </span>
                                    <span className="text-[9px] text-[#4B5563] shrink-0 whitespace-nowrap mt-0.5 font-mono">
                                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-[#8892A4] leading-relaxed" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                                    {notif.message}
                                  </p>
                                </div>

                                <div className="flex flex-col justify-center shrink-0">
                                  <button
                                    onClick={() => markNotificationRead(notif.id)}
                                    className="p-1.5 rounded border border-[#1A1E26] hover:border-[rgba(0,245,212,0.3)] transition-all cursor-pointer"
                                    style={{ color: "#00F5D4" }}
                                    title="Mark as read"
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          ))
                        ) : (
                          /* Secure Matrix Empty State */
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2 }}
                            className="py-8 flex flex-col items-center justify-center text-center px-4 select-none"
                          >
                            <div className="relative mb-3">
                              <div className="w-10 h-10 rounded border border-cyan-500/30 bg-cyan-950/20 flex items-center justify-center text-cyan-400">
                                <Shield className="w-5 h-5" />
                              </div>
                            </div>
                            <h4 className="text-[9px] uppercase tracking-widest text-[var(--ck-text-secondary)] font-bold mb-1">
                              Secure Matrix Active
                            </h4>
                            <p className="text-[11px] text-[var(--ck-text-muted)] max-w-[200px] leading-relaxed">
                              All feeds verified. Zero unacknowledged system broadcasts detected.
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom Right Slide-in toast notification popup */}
        <AnimatePresence>
          {activeToast && (
            <motion.div
              initial={{ opacity: 0, y: 50, x: 20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, y: 20, x: 20 }}
              transition={{ duration: 0.3, type: "spring", stiffness: 160, damping: 20 }}
              className="fixed bottom-5 right-5 z-[60] w-72 sm:w-80 rounded-lg overflow-hidden border shadow-2xl"
              style={{ background: "rgba(8,10,15,0.97)", borderColor: "rgba(0,245,212,0.25)", borderLeft: "3px solid #00F5D4" }}
            >
              {/* Top glow bar */}
              <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, #00F5D4, transparent)" }} />

              <div className="p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5" style={{ color: "#00F5D4" }} />
                    <span className="text-[9px] uppercase tracking-widest font-bold font-mono" style={{ color: "#00F5D4" }}>NEW NOTIFICATION</span>
                  </div>
                  <button onClick={() => setActiveToast(null)} className="w-5 h-5 flex items-center justify-center text-[#4B5563] hover:text-[var(--ck-text)] transition">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <div className="cursor-pointer" onClick={handleToastRedirect}>
                  <h4 className="font-bold text-sm text-[var(--ck-text)] mb-1 hover:text-[var(--ck-primary)] transition-colors" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {activeToast.title}
                  </h4>
                  <p className="text-[11px] text-[#8892A4] leading-relaxed line-clamp-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {activeToast.message}
                  </p>
                </div>
                
                <div className="flex items-center justify-between border-t border-[#1A1E26] pt-3">
                  <button
                    onClick={() => handleMarkToastRead(activeToast.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-[#1A1E26] text-[9px] font-bold font-mono uppercase tracking-wider transition-all hover:border-[rgba(0,245,212,0.3)] cursor-pointer"
                    style={{ color: "#00F5D4" }}
                  >
                    <Check className="w-3 h-3" /> MARK READ
                  </button>
                  
                  <label className="flex items-center gap-1.5 text-[9px] text-[#4B5563] hover:text-[#8892A4] cursor-pointer select-none font-mono uppercase">
                    <input
                      type="checkbox"
                      checked={disablePopups}
                      onChange={(e) => handleTogglePopups(e.target.checked)}
                      className="rounded border-[#1A1E26] bg-[var(--ck-bg)] w-3 h-3 cursor-pointer"
                      style={{ accentColor: "#00F5D4" }}
                    />
                    DISABLE
                  </label>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page content with responsive padding */}
        <motion.div 
          key={pathname} 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.3 }} 
          className={pathname?.includes("/certificates/builder") ? "p-1.5 sm:p-3" : "p-3 sm:p-6 lg:p-8"}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
