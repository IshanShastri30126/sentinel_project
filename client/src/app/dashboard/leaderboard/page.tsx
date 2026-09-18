"use client";
import React, { useEffect, useState } from "react";
import { SentinalLoader } from "@/components/ui/SentinalLoader";
import { useAuth } from "@/lib/auth-context";
import { api, getFileUrl } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Award, Trophy, Medal, Star, Search, Plus, Minus, Settings, X, Search as SearchIcon, Crown, Sparkles, Lock, Unlock, Eye, EyeOff, Shield, RefreshCw, Terminal, Users, CheckCircle } from "lucide-react";
import { DefaultAvatar } from "@/components/default-avatar";
import { useCyberDialog } from "@/components/ui/CyberDialogContext";

interface LeaderboardEntry { rank: number; user: { id: string; name: string; role: string; avatarUrl?: string }; totalPoints: number; badges: { name: string; icon: string }[]; }

const RANK_STYLES = [
  { bg: "from-[#FFD700] via-[#D4AF37] to-[#B8860B]", text: "text-black", color: "#FFD700", shadowColor: "rgba(255,215,0,0.5)", icon: <Trophy className="w-7 h-7 text-black drop-shadow-[0_0_12px_rgba(255,215,0,0.8)]" /> },
  { bg: "from-[#E0E0E0] via-[#C0C0C0] to-[#A0A0A0]", text: "text-black", color: "#C0C0C0", shadowColor: "rgba(192,192,192,0.5)", icon: <Medal className="w-6 h-6 text-black drop-shadow-[0_0_10px_rgba(192,192,192,0.8)]" /> },
  { bg: "from-[#CD7F32] via-[#B87333] to-[#A0522D]", text: "text-[var(--ck-text)]", color: "#CD7F32", shadowColor: "rgba(205,127,50,0.5)", icon: <Medal className="w-6 h-6 text-[var(--ck-text)] drop-shadow-[0_0_10px_rgba(205,127,50,0.8)]" /> }];

export default function LeaderboardPage() {
  const { user, token } = useAuth();
  const { showToast } = useCyberDialog();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("");
  const [search, setSearch] = useState("");

  // Tab State
  const [activeTab, setActiveTab] = useState<"appreciation" | "competition">("appreciation");

  // Competition Leaderboard State
  const [compEvents, setCompEvents] = useState<Array<{ id: string; title: string; eventType: string; isLeaderboardVisible: boolean }>>([]);
  const [selectedCompEventId, setSelectedCompEventId] = useState<string>("");
  const [compLeaderboard, setCompLeaderboard] = useState<{
    event: { id: string; title: string; isLeaderboardVisible: boolean };
    isBlockedForParticipant: boolean;
    isStaffView?: boolean;
    leaderboard: Array<{
      rank: number;
      id: string;
      name: string;
      teamCode: string;
      score: number;
      membersCount: number;
      lastSubmissionTime?: string;
    }>;
  } | null>(null);
  const [compLoading, setCompLoading] = useState(false);
  const [togglingVisibility, setTogglingVisibility] = useState(false);

  const isCoord = Boolean(user && ["FACULTY_COORDINATOR", "TECH_COORDINATOR", "STUDENT_COORDINATOR"].includes(user.role));
  const isFaculty = Boolean(user && ["FACULTY_COORDINATOR", "TECH_COORDINATOR", "STUDENT_COORDINATOR"].includes(user.role));
  const canManageCompLeaderboard = Boolean(user && ["FACULTY_COORDINATOR", "TECH_COORDINATOR", "STUDENT_COORDINATOR"].includes(user.role));

  // Modals
  const [showGivePoints, setShowGivePoints] = useState(false);
  const [showPointsAnimation, setShowPointsAnimation] = useState(false);
  const [showDeductPoints, setShowDeductPoints] = useState(false);
  const [showManageBadges, setShowManageBadges] = useState(false);

  const [categories, setCategories] = useState<string[]>([]);
  const [badges, setBadges] = useState<any[]>([]);

  // Point Forms
  const [pointForm, setPointForm] = useState({ receiverId: "", points: "", category: "", reason: "" });
  const [deductForm, setDeductForm] = useState({ receiverId: "", points: "", reason: "" });
  const [badgeForm, setBadgeForm] = useState({ name: "", description: "", icon: "AWARD", pointThreshold: "" });
  
  const [memberSearch, setMemberSearch] = useState("");
  const [memberResults, setMemberResults] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<any>(null);

  const loadData = async () => {
    try {
      const params = period ? `?period=${period}` : "";
      const data = await api<{ leaderboard: LeaderboardEntry[] }>(`/appreciation/leaderboard${params}`);
      setEntries(data.leaderboard);
      if (isCoord) {
        const catData = await api<{ categories: string[] }>("/appreciation/categories");
        setCategories(catData.categories);
      }
      if (isFaculty) {
        const badgeData = await api<{ badges: any[] }>("/appreciation/badges");
        setBadges(badgeData.badges);
      }
    } catch (err) { console.warn("Leaderboard data notice:", err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [period, isCoord, isFaculty]);

  const loadCompEvents = async () => {
    try {
      const data = await api<{ events: Array<{ id: string; title: string; eventType: string; isLeaderboardVisible: boolean }> }>("/events");
      const filtered = (data.events || []).filter(e => ["hackathon", "competition", "ctf"].includes(e.eventType?.toLowerCase()));
      setCompEvents(filtered);
      if (filtered.length > 0 && !selectedCompEventId) {
        setSelectedCompEventId(filtered[0].id);
      }
    } catch (err) {
      console.warn("Comp events load notice:", err);
    }
  };

  const loadCompLeaderboard = async (eventId: string) => {
    if (!eventId) return;
    setCompLoading(true);
    try {
      const data = await api<any>(`/events/${eventId}/leaderboard`, { token: token || undefined });
      setCompLeaderboard(data);
    } catch (err: any) {
      if (err?.isBlockedForParticipant || err?.status === 403) {
        const ev = compEvents.find(e => e.id === eventId);
        setCompLeaderboard({
          event: { id: eventId, title: ev?.title || "Competition", isLeaderboardVisible: false },
          isBlockedForParticipant: true,
          leaderboard: []
        });
      } else {
        console.warn("Comp leaderboard load notice:", err);
      }
    } finally {
      setCompLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "competition") {
      loadCompEvents();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "competition" && selectedCompEventId) {
      loadCompLeaderboard(selectedCompEventId);
    }
  }, [activeTab, selectedCompEventId]);

  const handleToggleLeaderboardVisibility = async () => {
    if (!selectedCompEventId || !token) return;
    setTogglingVisibility(true);
    try {
      const currentEvent = compEvents.find(e => e.id === selectedCompEventId);
      const newVisibility = !(currentEvent?.isLeaderboardVisible ?? true);
      await api<{ message: string; event: { id: string; isLeaderboardVisible: boolean } }>(
        `/events/${selectedCompEventId}/leaderboard-visibility`,
        {
          method: "PATCH",
          token,
          body: JSON.stringify({ isLeaderboardVisible: newVisibility })
        }
      );
      setCompEvents(prev => prev.map(e => e.id === selectedCompEventId ? { ...e, isLeaderboardVisible: newVisibility } : e));
      await loadCompLeaderboard(selectedCompEventId);
      showToast(`Leaderboard ${newVisibility ? "unfrozen (visible to all)" : "paused (hidden from participants)"}`, "info");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to toggle visibility", "error");
    } finally {
      setTogglingVisibility(false);
    }
  };

  const searchMembers = async (q: string) => {
    setMemberSearch(q);
    if (q.length < 2) { setMemberResults([]); return; }
    try {
      const data = await api<{ users: any[] }>(`/users/search?q=${q}`, { token: token || undefined });
      setMemberResults(data.users.filter(u => u.id !== user?.id));
    } catch { setMemberResults([]); }
  };

  const handleGivePoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) { showToast("Select a member first", "warning"); return; }
    try {
      await api("/appreciation", {
        method: "POST", token: token || undefined,
        body: JSON.stringify({ ...pointForm, points: parseInt(pointForm.points), receiverId: selectedMember.id })
      });
      setShowPointsAnimation(true);
      setTimeout(() => {
        setShowPointsAnimation(false);
        setShowGivePoints(false);
        setPointForm({ receiverId: "", points: "", category: "", reason: "" });
        setSelectedMember(null);
        setMemberSearch("");
        loadData();
      }, 2500);
    } catch (err) { showToast(err instanceof Error ? err.message : "Failed to award points", "error"); }
  };

  const handleDeductPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) { showToast("Select a member first", "warning"); return; }
    try {
      await api("/appreciation/deduct", {
        method: "POST", token: token || undefined,
        body: JSON.stringify({ ...deductForm, points: parseInt(deductForm.points), receiverId: selectedMember.id })
      });
      setShowDeductPoints(false); setDeductForm({ receiverId: "", points: "", reason: "" }); setSelectedMember(null); setMemberSearch("");
      loadData();
      showToast("Points deducted successfully", "success");
    } catch (err) { showToast(err instanceof Error ? err.message : "Failed to deduct points", "error"); }
  };

  const handleCreateBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api("/appreciation/badges", {
        method: "POST", token: token || undefined,
        body: JSON.stringify({ ...badgeForm, pointThreshold: parseInt(badgeForm.pointThreshold) })
      });
      setBadgeForm({ name: "", description: "", icon: "AWARD", pointThreshold: "" });
      showToast("Badge created successfully", "success");
      loadData();
    } catch (err) { showToast(err instanceof Error ? err.message : "Failed to create badge", "error"); }
  };

  const filtered = search ? entries.filter((e) => e.user?.name.toLowerCase().includes(search.toLowerCase())) : entries;

  return (
    <div className="space-y-6">
      {/* ═══ Header ═══ */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <Crown className="w-4 h-4 text-[var(--ck-primary)]" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--ck-primary)]">OPERATIVE RANKINGS</span>
          </div>
          <h1 className="text-3xl font-black font-mono tracking-tighter uppercase text-[var(--ck-text)]">
            RANKING <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F5D4] via-[#FF4D00] to-[#FF003C]">MATRIX</span>
          </h1>
          <p className="mt-1 text-sm text-[var(--ck-text-muted)] font-mono">OPERATIVE CREDITS // MISSION ACK</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {isCoord && <button onClick={() => setShowGivePoints(true)} className="ck-btn-primary"><Plus className="w-4 h-4" /> Give Points</button>}
          {isCoord && <button onClick={() => setShowDeductPoints(true)} className="px-4 py-2 rounded-lg text-xs font-mono tracking-wider transition-all bg-rose-950/30 border border-rose-500/20 text-rose-300 hover:bg-rose-900/40 hover:border-rose-400/40 uppercase inline-flex items-center gap-1.5 backdrop-blur-sm"><Minus className="w-4 h-4" /> Penalty</button>}
          {isFaculty && <button onClick={() => setShowManageBadges(true)} className="ck-btn-secondary"><Settings className="w-4 h-4" /> Badges</button>}
        </div>
      </motion.div>

      {/* ═══ Top-Level Mode Tab Switcher ═══ */}
      <div className="flex gap-2 p-1 rounded-xl bg-black/50 border border-white/[0.08] w-fit font-mono">
        <button
          type="button"
          onClick={() => setActiveTab("appreciation")}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
            activeTab === "appreciation"
              ? "bg-[#00F5D4]/20 border border-[#00F5D4]/50 text-[#00F5D4] shadow-[0_0_12px_rgba(0,245,212,0.25)]"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Sentinel Appreciation Rankings
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("competition")}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 ${
            activeTab === "competition"
              ? "bg-gradient-to-r from-red-500/20 to-cyan-500/20 border border-cyan-500/50 text-white shadow-[0_0_12px_rgba(0,245,212,0.3)]"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Terminal className="w-3.5 h-3.5 text-[#00F5D4]" />
          <span>CTF & Competition Standings</span>
        </button>
      </div>

      {/* Give Points Modal */}
      <AnimatePresence>
        {showGivePoints && (
          <div className="ck-modal-overlay">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="ck-glass-card p-6 w-full max-w-md relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-60" />
              <div className="flex justify-between items-center mb-5"><h2 className="text-xl font-bold font-mono tracking-tighter uppercase text-[var(--ck-text)]">AWARD POINTS</h2><button onClick={() => setShowGivePoints(false)} className="text-[var(--ck-text-muted)] hover:text-[var(--ck-text)] transition"><X className="w-5 h-5"/></button></div>
              <form onSubmit={handleGivePoints} className="space-y-4">
                <div>
                  <label className="ck-label">Select Member</label>
                  {!selectedMember ? (
                    <div className="relative">
                      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ck-text-muted)]" />
                      <input className="ck-input pl-9" placeholder="Search member..." value={memberSearch} onChange={(e) => searchMembers(e.target.value)} />
                      {memberResults.length > 0 && (
                        <div className="mt-1 max-h-40 overflow-y-auto border border-white/[0.06] rounded-lg absolute w-full z-10 backdrop-blur-xl" style={{ background: "rgba(8,10,15,0.95)" }}>
                          {memberResults.map(u => (
                            <button type="button" key={u.id} onClick={() => { setSelectedMember(u); setMemberResults([]); setMemberSearch(""); }} className="w-full text-left p-2.5 hover:bg-white/[0.04] text-sm text-[var(--ck-text-secondary)] hover:text-[var(--ck-text)] transition-colors">{u.name} {u.studentId ? `(${u.studentId})` : ""}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02]">
                      <span className="text-sm font-medium text-[var(--ck-text)]">{selectedMember.name}</span>
                      <button type="button" onClick={() => setSelectedMember(null)} className="text-cyan-400 hover:text-cyan-300 text-xs font-mono">Remove</button>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><label className="ck-label">Points</label><input type="number" min="1" max="100" required className="ck-input" value={pointForm.points} onChange={(e) => setPointForm({...pointForm, points: e.target.value})} /></div>
                  <div><label className="ck-label">Category</label>
                    <select required className="ck-input" value={pointForm.category} onChange={(e) => setPointForm({...pointForm, category: e.target.value})}>
                      <option value="">Select...</option>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div><label className="ck-label">Reason (optional)</label><input className="ck-input" value={pointForm.reason} onChange={(e) => setPointForm({...pointForm, reason: e.target.value})} /></div>
                <button type="submit" className="ck-btn-primary w-full">Award Points</button>
              </form>

              <AnimatePresence>
                {showPointsAnimation && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    className="absolute inset-0 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center z-50 p-6 overflow-hidden"
                  >
                    {/* Floating stars/credits particles background */}
                    <div className="absolute inset-0 pointer-events-none">
                      {Array.from({ length: 15 }).map((_, pi) => {
                        const delay = pi * 0.15;
                        const left = Math.random() * 100;
                        const size = Math.random() * 12 + 8;
                        const color = pi % 2 === 0 ? "#00F5D4" : "#FF4D00";
                        return (
                          <motion.div
                            key={pi}
                            initial={{ y: 220, x: 0, opacity: 0 }}
                            animate={{ 
                              y: -50, 
                              x: Math.sin(pi) * 30,
                              opacity: [0, 1, 1, 0],
                              rotate: 360
                            }}
                            transition={{ 
                              duration: 2.2, 
                              delay,
                              repeat: Infinity,
                              ease: "easeOut"
                            }}
                            className="absolute font-bold pointer-events-none"
                            style={{ left: `${left}%`, color, filter: `drop-shadow(0 0 6px ${color})` }}
                          >
                            <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                          </motion.div>
                        );
                      })}
                    </div>

                    <motion.div 
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 100 }}
                      className="w-20 h-20 rounded-full bg-gradient-to-br from-[#00F5D4] to-[#FF4D00] flex items-center justify-center shadow-[0_0_40px_rgba(0,245,212,0.4)] z-10 mb-4"
                    >
                      <Star className="w-10 h-10 text-black fill-black" />
                    </motion.div>
                    
                    <h3 className="text-xl font-bold font-mono uppercase tracking-widest mb-1.5 z-10" style={{ color: "#00F5D4" }}>
                      Credits Dispatched
                    </h3>
                    <p className="text-[10px] text-[var(--ck-text-secondary)] font-mono uppercase tracking-wider z-10">
                      Operative credentials loaded with point nodes.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Deduct Points Modal */}
      <AnimatePresence>
        {showDeductPoints && (
          <div className="ck-modal-overlay">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="ck-glass-card p-6 w-full max-w-md relative overflow-hidden border-rose-500/15">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-60" />
              <div className="flex justify-between items-center mb-5"><h2 className="text-xl font-bold text-rose-400 font-mono tracking-tighter uppercase">PENALTY INFL</h2><button onClick={() => setShowDeductPoints(false)} className="text-[var(--ck-text-muted)] hover:text-rose-400 transition"><X className="w-5 h-5"/></button></div>
              <form onSubmit={handleDeductPoints} className="space-y-4">
                <div>
                  <label className="ck-label">Select Member</label>
                  {!selectedMember ? (
                    <div className="relative">
                      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ck-text-muted)]" />
                      <input className="ck-input pl-9" placeholder="Search member..." value={memberSearch} onChange={(e) => searchMembers(e.target.value)} />
                      {memberResults.length > 0 && (
                        <div className="mt-1 max-h-40 overflow-y-auto border border-white/[0.06] rounded-lg absolute w-full z-10 backdrop-blur-xl" style={{ background: "rgba(8,10,15,0.95)" }}>
                          {memberResults.map(u => (
                            <button type="button" key={u.id} onClick={() => { setSelectedMember(u); setMemberResults([]); setMemberSearch(""); }} className="w-full text-left p-2.5 hover:bg-white/[0.04] text-sm text-[var(--ck-text-secondary)] hover:text-[var(--ck-text)] transition-colors">{u.name} {u.studentId ? `(${u.studentId})` : ""}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02]">
                      <span className="text-sm font-medium text-[var(--ck-text)]">{selectedMember.name}</span>
                      <button type="button" onClick={() => setSelectedMember(null)} className="text-rose-400 hover:text-rose-300 text-xs font-mono">Remove</button>
                    </div>
                  )}
                </div>
                <div><label className="ck-label">Points to Deduct</label><input type="number" min="1" max="100" required className="ck-input" value={deductForm.points} onChange={(e) => setDeductForm({...deductForm, points: e.target.value})} /></div>
                <div><label className="ck-label">Reason (Mandatory)</label><input required className="ck-input" value={deductForm.reason} onChange={(e) => setDeductForm({...deductForm, reason: e.target.value})} placeholder="Policy violation..." /></div>
                <button type="submit" className="w-full bg-gradient-to-r from-rose-900/40 to-red-900/40 hover:from-rose-800/50 hover:to-red-800/50 text-rose-200 border border-rose-500/20 rounded-lg py-2.5 px-4 font-mono text-sm tracking-wider transition-all uppercase backdrop-blur-sm">Deduct Points</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manage Badges Modal */}
      <AnimatePresence>
        {showManageBadges && (
          <div className="ck-modal-overlay">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="ck-glass-card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto relative border-cyan-500/15">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-60" />
              <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold font-mono tracking-tighter uppercase text-[var(--ck-text)]">BADGE CONFIG</h2><button onClick={() => setShowManageBadges(false)} className="text-[var(--ck-text-muted)] hover:text-cyan-400 transition"><X className="w-5 h-5"/></button></div>
              <div className="mb-6">
                <h3 className="text-sm font-semibold mb-3 font-mono text-cyan-300">CREATE NEW BADGE</h3>
                <form onSubmit={handleCreateBadge} className="space-y-3 p-4 border border-white/[0.06] rounded-xl bg-white/[0.02] backdrop-blur-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div><label className="ck-label">Badge Name</label><input required className="ck-input" value={badgeForm.name} onChange={(e) => setBadgeForm({...badgeForm, name: e.target.value})} /></div>
                    <div><label className="ck-label">Badge Symbol / Acronym</label><input required className="ck-input" value={badgeForm.icon} onChange={(e) => setBadgeForm({...badgeForm, icon: e.target.value})} /></div>
                  </div>
                  <div><label className="ck-label">Required Points Threshold</label><input type="number" min="1" required className="ck-input" value={badgeForm.pointThreshold} onChange={(e) => setBadgeForm({...badgeForm, pointThreshold: e.target.value})} /></div>
                  <div><label className="ck-label">Description</label><input className="ck-input" value={badgeForm.description} onChange={(e) => setBadgeForm({...badgeForm, description: e.target.value})} /></div>
                  <button type="submit" className="ck-btn-primary w-full mt-2">Create Badge</button>
                </form>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-3 font-mono text-violet-300">EXISTING BADGES</h3>
                <div className="space-y-2">
                  {badges.map(b => (
                    <div key={b.id} className="flex items-center justify-between p-3.5 rounded-xl border border-white/[0.04] bg-white/[0.02] hover:border-white/[0.08] transition-all">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">{b.icon}</span>
                        <div><p className="text-sm font-bold text-[var(--ck-text)] font-mono">{b.name}</p><p className="text-xs text-[var(--ck-text-secondary)] font-mono">{b.pointThreshold} PTS REQUIRED</p></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {activeTab === "competition" ? (
        <div className="space-y-6 font-mono">
          {/* Controls Bar: Event Selector + Staff Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-white/[0.08] bg-black/40">
            {/* Event Selector */}
            <div className="flex items-center gap-3 flex-wrap">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Select Operation:
              </label>
              <select
                className="ck-input text-xs py-2 px-3 bg-[#050A18] border-zinc-800 text-white rounded-lg focus:border-[#00F5D4]"
                value={selectedCompEventId}
                onChange={(e) => setSelectedCompEventId(e.target.value)}
              >
                {compEvents.length === 0 ? (
                  <option value="">No Active Competition Events</option>
                ) : (
                  compEvents.map((ev) => (
                    <option key={ev.id} value={ev.id} className="bg-[#050A18] text-white">
                      {ev.title} ({ev.eventType.toUpperCase()})
                    </option>
                  ))
                )}
              </select>
              <button
                type="button"
                onClick={() => selectedCompEventId && loadCompLeaderboard(selectedCompEventId)}
                className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-slate-300 transition cursor-pointer"
                title="Refresh scores"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${compLoading ? "animate-spin" : ""}`} />
              </button>
            </div>

            {/* Staff Controller Toggle */}
            {canManageCompLeaderboard && selectedCompEventId && (
              <div className="flex items-center gap-3 p-2 rounded-lg border border-cyan-500/30 bg-cyan-950/20">
                <div className="flex items-center gap-2">
                  {compEvents.find(e => e.id === selectedCompEventId)?.isLeaderboardVisible ?? true ? (
                    <Eye className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-red-400" />
                  )}
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                    Leaderboard:{" "}
                    <span className={compEvents.find(e => e.id === selectedCompEventId)?.isLeaderboardVisible ?? true ? "text-emerald-400" : "text-red-400"}>
                      {compEvents.find(e => e.id === selectedCompEventId)?.isLeaderboardVisible ?? true ? "PUBLIC" : "FROZEN"}
                    </span>
                  </span>
                </div>
                <button
                  type="button"
                  disabled={togglingVisibility}
                  onClick={handleToggleLeaderboardVisibility}
                  className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                    compEvents.find(e => e.id === selectedCompEventId)?.isLeaderboardVisible ?? true
                      ? "bg-red-950/50 border border-red-500/40 text-red-300 hover:bg-red-900/50"
                      : "bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50"
                  }`}
                >
                  {togglingVisibility ? "Updating..." : (
                    compEvents.find(e => e.id === selectedCompEventId)?.isLeaderboardVisible ?? true
                      ? "Freeze Leaderboard"
                      : "Unfreeze Leaderboard"
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Loading State */}
          {compLoading ? (
            <div className="flex items-center justify-center py-24">
              <SentinalLoader variant="card" size="md" text="FETCHING TELEMETRY SCORES..." />
            </div>
          ) : compLeaderboard?.isBlockedForParticipant ? (
            /* Blocked Lock Notice for Participants when Leaderboard is Frozen */
            <div className="p-8 sm:p-10 rounded-lg border border-red-500/40 bg-[#070E1A] text-center space-y-4 max-w-xl mx-auto shadow-2xl">
              <div className="w-12 h-12 rounded border border-red-500/40 bg-red-950/40 flex items-center justify-center mx-auto text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.25)]">
                <Lock className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-mono text-white uppercase tracking-tight">
                  SCORING ARTIFACT LOCKED
                </h3>
                <p className="text-xs text-slate-300 font-mono mt-2 leading-relaxed max-w-md mx-auto">
                  The real-time leaderboard for this operation has been temporarily frozen by command staff. Live scores and submissions are actively tracked in background nodes and will be unveiled upon operation conclusion.
                </p>
              </div>
              <div className="inline-block p-2.5 rounded border border-red-900/40 bg-black/60 font-mono text-[10px] text-red-400 uppercase tracking-widest">
                STATUS: PAUSED BY COMMAND // BG EVALUATION ACTIVE
              </div>
            </div>
          ) : !compLeaderboard?.leaderboard || compLeaderboard.leaderboard.length === 0 ? (
            <div className="text-center py-20 border border-white/[0.08] rounded-lg bg-[#070E1A]">
              <Trophy className="w-12 h-12 mx-auto mb-3 text-slate-600" />
              <p className="text-base text-slate-300 font-mono">No submissions logged for this operation yet</p>
              <p className="text-xs text-slate-500 font-mono mt-1">Teams will appear as challenge flags are submitted.</p>
            </div>
          ) : (
            <>
              {/* Top 3 Podium for Competition */}
              {compLeaderboard.leaderboard.length >= 3 && (
                <div className="flex items-end justify-center gap-2 min-[380px]:gap-4 sm:gap-6 mb-8 pt-8">
                  {[1, 0, 2].map((idx) => {
                    const entry = compLeaderboard.leaderboard[idx];
                    if (!entry) return null;
                    const style = RANK_STYLES[idx];
                    const heights = ["h-36", "h-24", "h-16"];
                    return (
                      <div key={idx} className="text-center relative font-mono">
                        <div
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded bg-[#070E1A] border border-white/20 flex flex-col items-center justify-center mx-auto mb-3 relative"
                          style={{ boxShadow: `0 0 20px ${style.shadowColor}` }}
                        >
                          <span className="text-sm font-bold text-white uppercase">{entry.teamCode}</span>
                          <span className="text-[10px] font-bold" style={{ color: style.color }}>
                            {entry.score} PTS
                          </span>
                          <div
                            className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded flex items-center justify-center text-[10px] font-black border border-black/50"
                            style={{ background: style.color, color: idx === 0 ? "#000" : "#fff" }}
                          >
                            {idx === 0 ? <Crown className="w-3.5 h-3.5 text-black fill-black" /> : idx === 1 ? "2" : "3"}
                          </div>
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-white uppercase truncate max-w-[100px]">
                          {entry.name}
                        </p>
                        <p className="text-[10px] text-slate-400 mb-2">
                          {entry.membersCount} Members
                        </p>
                        <div
                          className={`${heights[idx]} w-24 sm:w-28 rounded-t-xl relative overflow-hidden border-x border-t border-white/[0.06]`}
                          style={{ background: `linear-gradient(180deg, ${style.color}20, transparent)` }}
                        >
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-3xl sm:text-4xl font-black opacity-[0.1] text-white">#{idx + 1}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Full Standings Table */}
              <div className="ck-glass-card overflow-hidden">
                <div className="overflow-x-auto w-full">
                  <table className="ck-table ck-table-responsive whitespace-nowrap">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Team Designation</th>
                        <th>Team Code</th>
                        <th>Members</th>
                        <th>Total Points</th>
                        <th>Last Activity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {compLeaderboard.leaderboard.map((entry) => {
                        const isTop3 = entry.rank <= 3;
                        const rankStyle = RANK_STYLES[entry.rank - 1];
                        return (
                          <tr
                            key={entry.id}
                            className={isTop3 ? "hover:bg-white/[0.03]" : ""}
                            style={isTop3 && rankStyle ? { borderLeft: `3px solid ${rankStyle.color}` } : undefined}
                          >
                            <td className="font-mono">
                              <span
                                className="font-bold font-mono text-sm"
                                style={{
                                  color: entry.rank === 1 ? "#00F5D4" :
                                         entry.rank === 2 ? "#FF4D00" :
                                         entry.rank === 3 ? "#FF003C" :
                                         "var(--ck-text-muted)"
                                }}
                              >
                                #{entry.rank}
                              </span>
                            </td>
                            <td>
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-slate-400" />
                                <span className="font-bold text-white text-sm">{entry.name}</span>
                              </div>
                            </td>
                            <td>
                              <span className="px-2 py-0.5 rounded bg-black/60 border border-zinc-800 text-cyan-300 font-mono text-xs font-bold">
                                {entry.teamCode}
                              </span>
                            </td>
                            <td>
                              <span className="text-xs font-bold text-slate-300 font-mono">
                                {entry.membersCount} Members
                              </span>
                            </td>
                            <td>
                              <span className="font-bold flex items-center gap-1.5 font-mono text-sm text-[#00F5D4]">
                                <Star className="w-4 h-4 text-[#00F5D4] fill-[#00F5D4]/20" />
                                {entry.score} PTS
                              </span>
                            </td>
                            <td>
                              <span className="text-xs text-slate-400 font-mono">
                                {entry.lastSubmissionTime
                                  ? new Date(entry.lastSubmissionTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                                  : "—"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          {/* ═══ Period Filter ═══ */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 p-1 rounded-xl bg-black/40 border border-white/[0.04] backdrop-blur-sm">
          {[{ value: "", label: "ALL TIME" }, { value: "month", label: "CURRENT CYCLE" }, { value: "semester", label: "SEMESTER WINDOW" }].map((p) => (
            <button key={p.value} onClick={() => setPeriod(p.value)} 
              className={`px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-all ${period === p.value ? "bg-[#00F5D4] text-black font-bold shadow-[0_0_12px_rgba(0,245,212,0.3)]" : "text-[var(--ck-text-secondary)] hover:text-[var(--ck-primary)] hover:bg-white/[0.03]"}`}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="relative ck-search-container ck-input-icon-wrapper w-full sm:w-52">
          <Search className="w-4 h-4" style={{ color: "#00F5D4" }} />
          <input className="ck-input ck-search-input pl-9 w-full" placeholder="SEARCH OPERATIVE..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <SentinalLoader variant="card" size="md" text="LOADING RANKINGS..." />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24">
          <Award className="w-16 h-16 mx-auto mb-4 text-zinc-700" />
          <p className="text-lg text-[var(--ck-text-muted)] font-mono">No data yet</p>
        </div>
      ) : (
        <>
          {/* ═══ Podium for top 3 ═══ */}
          {filtered.length >= 3 && !search && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex items-end justify-center gap-2 min-[380px]:gap-4 sm:gap-6 mb-8 pt-8"
            >
              {[1, 0, 2].map((idx) => {
                const entry = filtered[idx];
                if (!entry) return null;
                const style = RANK_STYLES[idx];
                const isFirst = idx === 0;
                const heights = ["h-40", "h-28", "h-20"];
                const sizes = isFirst ? "w-20 h-20" : "w-16 h-16";
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + idx * 0.12, type: "spring" }}
                    className="text-center relative font-mono"
                  >
                    {/* Light beam behind first place */}
                    {isFirst && (
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-32 h-32 bg-[#00F5D4]/[0.04] rounded-full blur-3xl pointer-events-none" />
                    )}

                    <motion.div 
                      className={`${sizes} rounded bg-[#070E1A] flex items-center justify-center mx-auto mb-3 border border-white/20 relative p-0.5`}
                      style={{ boxShadow: `0 0 24px ${style.shadowColor}` }}
                      animate={{ y: isFirst ? [0, -8, 0] : idx === 1 ? [0, -4, 0] : [0, -3, 0] }}
                      transition={{ duration: 3.5 + idx, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <DefaultAvatar
                        src={entry.user?.avatarUrl ? getFileUrl(entry.user.avatarUrl) : null}
                        alt={entry.user?.name}
                        className="w-full h-full rounded"
                      />

                      {/* Rank Crown/Badge Badge Overlay */}
                      <div 
                        className="absolute -bottom-1 -right-1 w-5 h-5 rounded flex items-center justify-center text-[10px] font-black border border-black/40 shadow-lg"
                        style={{ background: style.color, color: idx === 0 ? "#000" : "#fff", boxShadow: `0 0 10px ${style.shadowColor}` }}
                      >
                        {idx === 0 ? <Crown className="w-3.5 h-3.5 text-black fill-black" /> : idx === 1 ? "2" : "3"}
                      </div>

                      {isFirst && <Sparkles className="w-4 h-4 text-[#00F5D4] absolute -top-2 -right-2 animate-bounce" style={{ filter: "drop-shadow(0 0 6px #00F5D4)" }} />}
                    </motion.div>
                    <p className="text-xs sm:text-sm font-bold mb-0.5 tracking-tight text-white uppercase truncate max-w-[90px] sm:max-w-none">{entry.user?.name}</p>
                    <p className="text-[10px] sm:text-xs mb-3 font-bold" style={{ color: style.color }}>{entry.totalPoints} PTS</p>
                    <div
                      className={`${heights[idx]} w-[88px] min-[380px]:w-28 sm:w-32 rounded-t relative overflow-hidden border-x border-t border-white/[0.08]`}
                      style={{ background: `linear-gradient(180deg, ${style.color}15, transparent)` }}
                    >
                      {/* Rank number inside podium */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-4xl sm:text-5xl font-black opacity-[0.06] text-[var(--ck-text)]">#{idx + 1}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* ═══ Full Ranking Table ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="ck-glass-card overflow-hidden"
          >
            <div className="overflow-x-auto w-full">
              <table className="ck-table ck-table-responsive whitespace-nowrap">
                <thead><tr><th>Rank</th><th>Member</th><th>Points</th><th>Badges</th></tr></thead>
                <tbody>
                  {filtered.map((entry, i) => {
                    const isTop3 = entry.rank <= 3;
                    const rankStyle = RANK_STYLES[entry.rank - 1];
                    return (
                      <motion.tr
                        key={entry.user?.id || i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.03 }}
                        className={isTop3 ? "hover:bg-white/[0.03]" : ""}
                        style={isTop3 && rankStyle ? { borderLeft: `3px solid ${rankStyle.color}` } : undefined}
                      >
                        <td className="font-mono" data-label="Rank">
                          <span className="font-bold font-mono text-sm" style={{
                            color: entry.rank === 1 ? "#00F5D4" :
                                   entry.rank === 2 ? "#FF4D00" :
                                   entry.rank === 3 ? "#FF003C" :
                                   "var(--ck-text-muted)"
                          }}>
                            #{entry.rank}
                          </span>
                        </td>
                        <td data-label="Member">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <DefaultAvatar
                                src={entry.user?.avatarUrl ? getFileUrl(entry.user.avatarUrl) : null}
                                alt={entry.user?.name}
                                className="w-9 h-9 shrink-0"
                              />
                              {isTop3 && rankStyle && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-black" style={{ background: rankStyle.color, color: entry.rank === 1 ? "#000" : "#fff", boxShadow: `0 0 6px ${rankStyle.shadowColor}` }}>
                                  {entry.rank}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-[var(--ck-text)]">{entry.user?.name}</p>
                              <p className="text-[10px] uppercase tracking-widest text-[var(--ck-text-muted)] font-mono">{entry.user?.role?.replace(/_/g, " ")}</p>
                            </div>
                          </div>
                        </td>
                        <td data-label="Points">
                          <span className="font-semibold flex items-center gap-1.5 font-mono text-[var(--ck-text)]">
                            <Star className="w-4 h-4 text-[var(--ck-primary)] fill-[#00F5D4]/20 drop-shadow-[0_0_6px_rgba(0,245,212,0.5)]" />
                            {String(entry.totalPoints).padStart(2, '0')}
                          </span>
                        </td>
                        <td data-label="Badges">
                          <div className="flex gap-1">
                            {entry.badges.map((b, bi) => (
                              <span key={bi} title={b.name} className="text-xl drop-shadow-[0_0_4px_rgba(255,255,255,0.3)] hover:scale-125 transition-transform cursor-default">{b.icon}</span>
                            ))}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}
      </>
      )}
    </div>
  );
}
