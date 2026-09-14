"use client";
import React, { useEffect, useState } from "react";
import { api, getFileUrl } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Award, Trophy, Medal, Star, Search, Crown, Sparkles, Lock, Terminal, Users, ArrowLeft } from "lucide-react";
import { DefaultAvatar } from "@/components/default-avatar";
import Link from "next/link";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import { CyberGrid } from "@/components/effects";
import dynamic from "next/dynamic";
import { CyberButton } from "@/components/ui";

const PlexusBackground = dynamic(() => import("@/components/PlexusBackground"), { ssr: false });

interface LeaderboardEntry { rank: number; user: { id: string; name: string; role: string; avatarUrl?: string }; totalPoints: number; badges: { name: string; icon: string }[]; }

const RANK_STYLES = [
  { bg: "from-[#FFD700] via-[#D4AF37] to-[#B8860B]", text: "text-black", color: "#FFD700", shadowColor: "rgba(255,215,0,0.5)", icon: <Trophy className="w-7 h-7 text-black drop-shadow-[0_0_12px_rgba(255,215,0,0.8)]" /> },
  { bg: "from-[#E0E0E0] via-[#C0C0C0] to-[#A0A0A0]", text: "text-black", color: "#C0C0C0", shadowColor: "rgba(192,192,192,0.5)", icon: <Medal className="w-6 h-6 text-black drop-shadow-[0_0_10px_rgba(192,192,192,0.8)]" /> },
  { bg: "from-[#CD7F32] via-[#B87333] to-[#A0522D]", text: "text-[var(--ck-text)]", color: "#CD7F32", shadowColor: "rgba(205,127,50,0.5)", icon: <Medal className="w-6 h-6 text-[var(--ck-text)] drop-shadow-[0_0_10px_rgba(205,127,50,0.8)]" /> },
];

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("");
  const [search, setSearch] = useState("");

  const [activeTab, setActiveTab] = useState<"appreciation" | "competition">("appreciation");

  const [compEvents, setCompEvents] = useState<Array<{ id: string; title: string; eventType: string; isLeaderboardVisible: boolean }>>([]);
  const [selectedCompEventId, setSelectedCompEventId] = useState<string>("");
  const [compLeaderboard, setCompLeaderboard] = useState<{
    event: { id: string; title: string; isLeaderboardVisible: boolean };
    isBlockedForParticipant: boolean;
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

  const loadData = async () => {
    try {
      const params = period ? `?period=${period}` : "";
      const data = await api<{ leaderboard: LeaderboardEntry[] }>(`/appreciation/leaderboard${params}`);
      setEntries(data.leaderboard);
    } catch (err) { console.warn("Leaderboard data notice:", err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [period]);

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
      const data = await api<any>(`/events/${eventId}/leaderboard`);
      setCompLeaderboard(data);
    } catch (err: any) {
      if (err?.isBlockedForParticipant || err?.status === 403) {
        const ev = compEvents.find(e => e.id === eventId);
        setCompLeaderboard({
          event: { id: eventId, title: ev?.title || "Competition", isLeaderboardVisible: false },
          isBlockedForParticipant: true,
          leaderboard: []
        });
      }
    } finally {
      setCompLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "competition") loadCompEvents();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "competition" && selectedCompEventId) {
      loadCompLeaderboard(selectedCompEventId);
    }
  }, [activeTab, selectedCompEventId]);

  const filtered = search ? entries.filter((e) => e.user?.name.toLowerCase().includes(search.toLowerCase())) : entries;

  return (
    <div className="min-h-screen bg-[#02050B] text-slate-100 font-sans relative overflow-x-hidden selection:bg-[#00F5D4]/20">
      <Navbar />

      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#02050B]">
        <PlexusBackground />
        <div className="absolute inset-0 bg-[#02050B]/85 z-10" />
        <CyberGrid gridSize={32} glowColor="rgba(0, 245, 212, 0.04)" />
      </div>

      <main className="relative z-10 space-y-6 max-w-7xl mx-auto px-4 py-8 mt-16 sm:mt-24 mb-24">
        <Link href="/" className="inline-block mb-4">
          <CyberButton variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            BACK TO OPERATIONS
          </CyberButton>
        </Link>

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <Crown className="w-4 h-4 text-[#00F5D4]" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#00F5D4]">PUBLIC RANKINGS</span>
            </div>
            <h1 className="text-3xl font-black font-mono tracking-tighter uppercase text-white">
              GLOBAL <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F5D4] via-[#FF4D00] to-[#FF003C]">LEADERBOARD</span>
            </h1>
            <p className="mt-1 text-sm text-slate-400 font-mono">LIVE STANDINGS // ALL OPERATIVES</p>
          </div>
        </motion.div>

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

        {activeTab === "competition" ? (
          <div className="space-y-6 font-mono">
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-white/[0.08] bg-black/40 backdrop-blur-md">
              <div className="flex items-center gap-3 flex-wrap w-full max-w-md">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 shrink-0">
                  Select Operation:
                </label>
                <select
                  className="ck-input text-xs py-2 px-3 bg-[#050A18] border-zinc-800 text-white rounded-lg focus:border-[#00F5D4] w-full"
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
              </div>
            </div>

            {compLoading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <div className="w-10 h-10 border-2 border-red-500/30 border-t-cyan-400 rounded-full animate-spin" />
                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">FETCHING TELEMETRY SCORES...</p>
              </div>
            ) : compLeaderboard?.isBlockedForParticipant ? (
              <div className="p-8 sm:p-10 rounded-lg border border-red-500/40 bg-[#070E1A] text-center space-y-4 max-w-xl mx-auto shadow-2xl">
                <div className="w-12 h-12 rounded border border-red-500/40 bg-red-950/40 flex items-center justify-center mx-auto text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.25)]">
                  <Lock className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-mono text-white uppercase tracking-tight">
                    SCORING ARTIFACT LOCKED
                  </h3>
                  <p className="text-xs text-slate-300 font-mono mt-2 leading-relaxed max-w-md mx-auto">
                    The real-time leaderboard for this operation has been temporarily frozen.
                  </p>
                </div>
              </div>
            ) : !compLeaderboard?.leaderboard || compLeaderboard.leaderboard.length === 0 ? (
              <div className="text-center py-20 border border-white/[0.08] rounded-lg bg-[#070E1A]">
                <Trophy className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                <p className="text-base text-slate-300 font-mono">No submissions logged for this operation yet</p>
              </div>
            ) : (
              <>
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
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-1 p-1 rounded-xl bg-black/40 border border-white/[0.04] backdrop-blur-sm">
                {[{ value: "", label: "ALL TIME" }, { value: "month", label: "CURRENT CYCLE" }, { value: "semester", label: "SEMESTER WINDOW" }].map((p) => (
                  <button key={p.value} onClick={() => setPeriod(p.value)} 
                    className={`px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-all ${period === p.value ? "bg-[#00F5D4] text-black font-bold shadow-[0_0_12px_rgba(0,245,212,0.3)]" : "text-slate-400 hover:text-[#00F5D4] hover:bg-white/[0.03]"}`}>
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="relative ck-search-container ck-input-icon-wrapper w-full sm:w-52">
                <Search className="w-4 h-4 text-[#00F5D4]" />
                <input className="ck-input ck-search-input pl-9 w-full bg-black/40 border border-white/[0.08]" placeholder="SEARCH OPERATIVE..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </motion.div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <div className="w-10 h-10 border-2 border-violet-500/30 border-t-cyan-400 rounded-full animate-spin" />
                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">LOADING RANKINGS...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-24">
                <Award className="w-16 h-16 mx-auto mb-4 text-zinc-700" />
                <p className="text-lg text-slate-500 font-mono">No data yet</p>
              </div>
            ) : (
              <>
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
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-4xl sm:text-5xl font-black opacity-[0.15] text-white">#{idx + 1}</span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}

                <div className="ck-glass-card overflow-hidden">
                  <div className="overflow-x-auto w-full">
                    <table className="ck-table ck-table-responsive whitespace-nowrap">
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>Operative</th>
                          <th>Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((entry) => {
                          const isTop3 = entry.rank <= 3;
                          const rankStyle = RANK_STYLES[entry.rank - 1];
                          return (
                            <motion.tr
                              key={entry.user.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className={`group ${isTop3 ? "hover:bg-white/[0.03]" : ""}`}
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
                                <div className="flex items-center gap-3">
                                  <DefaultAvatar
                                    src={entry.user.avatarUrl ? getFileUrl(entry.user.avatarUrl) : null}
                                    alt={entry.user.name}
                                    className="w-8 h-8 rounded border border-white/10"
                                  />
                                  <div>
                                    <p className="font-bold text-white text-sm">{entry.user.name}</p>
                                    <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">{entry.user.role.replace(/_/g, " ")}</p>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className="font-bold flex items-center gap-1.5 font-mono text-sm text-[#00F5D4]">
                                  <Star className="w-4 h-4 text-[#00F5D4] fill-[#00F5D4]/20" />
                                  {entry.totalPoints} PTS
                                </span>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
