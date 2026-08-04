"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, API_BASE } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { UsersRound, Plus, X, QrCode, Search, Calendar, Download, RefreshCw, Crown, ChevronDown, ChevronUp, ShieldAlert, Trash2, AlertTriangle, Edit2, Camera } from "lucide-react";
import { QrScanner } from "@/components/QrScanner";

interface TeamMember { id: string; name: string; email: string; studentId?: string; }
interface Team {
  id: string; name: string; teamCode: string; qrCode?: string; leaderId?: string;
  leader?: { id: string; name: string };
  event?: { id: string; title: string; startDate: string };
  _count?: { members: number };
  members?: { user: TeamMember }[];
  isDisqualified?: boolean;
  disqualifyReason?: string;
}

const MANAGEMENT_ROLES = ["FACULTY", "STUDENT_COORDINATOR", "TECH", "SOCIAL_MEDIA"];

export default function TeamsPage() {
  const { user, token } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showReuse, setShowReuse] = useState<string | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", eventId: "" });
  const [reuseEventId, setReuseEventId] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [reusing, setReusing] = useState(false);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"my" | "all">("my");
  const [showDisqualifyModal, setShowDisqualifyModal] = useState<string | null>(null);
  const [disqualifyReason, setDisqualifyReason] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Join Team states
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [useScanner, setUseScanner] = useState(false);

  // Search/Sort/Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "members" | "newest">("newest");
  const [filterEventId, setFilterEventId] = useState("");

  const isManagement = MANAGEMENT_ROLES.includes(user?.role || "");

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    try {
      const endpoint = (isManagement && activeTab === "all")
        ? (filterEventId ? `/teams/event/${filterEventId}` : "/teams/my")
        : "/teams/my";
      const [t, e] = await Promise.all([
        api<{ teams: Team[] }>(endpoint, { token: token || undefined }),
        api<{ events: any[] }>("/events", { token: token || undefined }),
      ]);
      setTeams(t.teams); setEvents(e.events);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (token) loadData(); }, [token, activeTab, filterEventId]);

  const searchMembers = async (q: string) => {
    setMemberSearch(q);
    if (q.length < 2) { setSearchResults([]); return; }
    try {
      const data = await api<{ users: any[] }>(`/users/search?q=${q}`, { token: token || undefined });
      setSearchResults(data.users.filter((u) => u.id !== user?.id && !selectedMembers.find((m) => m.id === u.id)));
    } catch { setSearchResults([]); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setCreating(true);
    try {
      await api("/teams", {
        method: "POST", token: token || undefined,
        body: JSON.stringify({ ...form, memberIds: selectedMembers.map((m) => m.id) }),
      });
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setShowCreate(false);
        setForm({ name: "", eventId: "" });
        setSelectedMembers([]);
        loadData();
      }, 2500);
    } catch (err) { showToast(err instanceof Error ? err.message : "Failed", "error"); }
    finally { setCreating(false); }
  };

  const handleReuse = async (teamId: string) => {
    if (!reuseEventId) { showToast("Select an event", "error"); return; }
    setReusing(true);
    try {
      await api(`/teams/${teamId}/reuse`, {
        method: "POST", token: token || undefined,
        body: JSON.stringify({ eventId: reuseEventId }),
      });
      setShowReuse(null); setReuseEventId("");
      loadData();
      showToast("Team reused successfully!");
    } catch (err) { showToast(err instanceof Error ? err.message : "Failed to reuse team", "error"); }
    finally { setReusing(false); }
  };

  const handleDisqualify = async (teamId: string) => {
    try {
      await api(`/teams/${teamId}/disqualify`, {
        method: "PATCH", token: token || undefined,
        body: JSON.stringify({ reason: disqualifyReason || "Disqualified by admin" }),
      });
      setShowDisqualifyModal(null);
      setDisqualifyReason("");
      showToast("Team disqualified");
      loadData();
    } catch (err) { showToast(err instanceof Error ? err.message : "Failed to disqualify", "error"); }
  };

  const handleRemoveTeam = async (teamId: string, teamName: string) => {
    if (!confirm(`Remove team "${teamName}"? This action is irreversible.`)) return;
    try {
      await api(`/teams/${teamId}`, { method: "DELETE", token: token || undefined });
      showToast(`Team "${teamName}" removed`);
      loadData();
    } catch (err) { showToast(err instanceof Error ? err.message : "Failed to remove team", "error"); }
  };

  const handleRemoveMember = async (teamId: string, memberId: string, memberName: string) => {
    if (!confirm(`Remove ${memberName} from this team?`)) return;
    try {
      await api(`/teams/${teamId}`, {
        method: "PATCH", token: token || undefined,
        body: JSON.stringify({ removeMemberIds: [memberId] }),
      });
      showToast(`${memberName} removed from team`);
      loadData();
    } catch (err) { showToast(err instanceof Error ? err.message : "Failed to remove member", "error"); }
  };

  const handleJoin = async (e?: React.FormEvent, codeToJoin?: string) => {
    if (e) e.preventDefault();
    const code = codeToJoin || joinCode;
    if (!code) return;
    
    setJoining(true);
    try {
      await api("/teams/join", {
        method: "POST", token: token || undefined,
        body: JSON.stringify({ teamCode: code }),
      });
      setShowJoin(false);
      setJoinCode("");
      showToast("Successfully joined the team!");
      loadData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to join team", "error");
    } finally {
      setJoining(false);
    }
  };

  const handleScan = (data: string) => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.teamCode) {
        setUseScanner(false);
        handleJoin(undefined, parsed.teamCode);
      } else {
        showToast("Invalid QR code format", "error");
      }
    } catch {
      setUseScanner(false);
      handleJoin(undefined, data);
    }
  };

  const downloadQR = async (teamId: string, teamCode: string) => {
    try {
      const res = await fetch(`${API_BASE}/teams/${teamId}/qr`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${teamCode}.png`; a.click();
      URL.revokeObjectURL(url);
    } catch { showToast("Failed to download QR code", "error"); }
  };

  const loadTeamDetails = async (teamId: string) => {
    if (expandedTeam === teamId) { setExpandedTeam(null); return; }
    try {
      const data = await api<{ team: Team }>(`/teams/${teamId}`, { token: token || undefined });
      setTeams((prev) => prev.map((t) => t.id === teamId ? { ...t, members: data.team.members, leader: data.team.leader } : t));
      setExpandedTeam(teamId);
    } catch (err) { console.error(err); }
  };

  const displayedTeams = teams
    .filter(t => !filterEventId || t.event?.id === filterEventId)
    .filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.teamCode.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "members") return (b._count?.members || 0) - (a._count?.members || 0);
      return 0;
    });

  return (
    <div>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-[100] flex items-center gap-2 px-4 py-3 rounded-lg border shadow-lg font-mono text-xs uppercase tracking-wider"
            style={{
              backgroundColor: "rgba(13,15,20,0.97)",
              borderColor: toast.type === "success" ? "rgba(204,255,0,0.5)" : "rgba(255,0,60,0.5)",
              color: toast.type === "success" ? "#CCFF00" : "#FF003C",
            }}
          >
            {toast.type === "error" ? <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> : <Crown className="w-3.5 h-3.5 shrink-0" />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--ck-text)" }}>Teams</h1>
          <p className="mt-1" style={{ color: "var(--ck-text-secondary)" }}>
            {isManagement ? "Manage and administer event teams" : "Create and manage event teams"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isManagement && (
            <div className="flex items-center gap-1 text-[10px] font-mono px-3 py-1.5 rounded-lg border" style={{ backgroundColor: "rgba(255,77,0,0.1)", borderColor: "rgba(255,77,0,0.3)", color: "#FF4D00" }}>
              <ShieldAlert className="w-3.5 h-3.5" />
              ADMIN CONTROL
            </div>
          )}
          {!isManagement && (
            <div className="flex gap-2">
              <button onClick={() => setShowJoin(true)} className="ck-btn-secondary bg-[#CCFF00]/10 border-[#CCFF00]/30 text-[var(--ck-primary)] hover:bg-[#CCFF00]/20"><QrCode className="w-4 h-4" /> Join Team</button>
              <button onClick={() => setShowCreate(true)} className="ck-btn-primary"><Plus className="w-4 h-4" /> Create Team</button>
            </div>
          )}
        </div>
      </div>

      {/* Management role info banner */}
      {isManagement && (
        <div className="mb-5 p-4 rounded-xl border border-[#FF4D00]/20 bg-[#FF4D00]/5 font-mono text-xs text-[var(--ck-accent)]">
          <ShieldAlert className="w-4 h-4 inline mr-2" />
          As a management member, you have <strong>admin access</strong> to remove, disqualify, or manage any team. You cannot create participant teams.
        </div>
      )}

      {/* Admin Tabs for management roles */}
      {isManagement && (
        <div className="flex gap-1 p-1 rounded-xl bg-black/40 border border-[#1A1E26] mb-5 w-fit">
          {(["my", "all"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition ${activeTab === tab ? "bg-[#CCFF00] text-black font-bold shadow-[0_0_8px_rgba(204,255,0,0.3)]" : "text-[var(--ck-text-secondary)] hover:text-[var(--ck-primary)]"}`}>
              {tab === "my" ? "My Teams" : "All Teams"}
            </button>
          ))}
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 bg-black/20 p-3 rounded-xl border border-zinc-850">
        <div className="relative flex-1 ck-search-container ck-input-icon-wrapper">
          <Search className="w-4 h-4" style={{ color: "#CCFF00" }} />
          <input
            className="ck-input ck-search-input pl-9"
            placeholder="Search teams by name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {isManagement && activeTab === "all" && (
          <select
            className="ck-input bg-[var(--ck-bg-card)] border-[var(--ck-border)] text-sm py-2 w-full sm:w-auto"
            value={filterEventId}
            onChange={(e) => setFilterEventId(e.target.value)}
          >
            <option value="">All Events</option>
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.title}</option>
            ))}
          </select>
        )}
        <select
          className="ck-input bg-[var(--ck-bg-card)] border-[var(--ck-border)] text-sm py-2 w-full sm:w-auto"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
        >
          <option value="newest">Newest First</option>
          <option value="name">Alphabetical (A-Z)</option>
          <option value="members">Team Size</option>
        </select>
      </div>

      {/* Create Team Modal */}
      <AnimatePresence>
        {showCreate && !isManagement && (
          <div className="ck-modal-overlay">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="ck-card p-6 w-full max-w-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FF4D00] via-[#CCFF00] to-[#FF003C]" />
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold" style={{ color: "var(--ck-text)" }}>Create Team</h2>
                <button onClick={() => setShowCreate(false)} className="p-2 rounded-lg hover:bg-[var(--ck-border)]"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div><label className="ck-label">Team Name</label><input className="ck-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. CodeWarriors" /></div>
                <div><label className="ck-label">Event</label>
                  <select className="ck-input" value={form.eventId} onChange={(e) => setForm({ ...form, eventId: e.target.value })} required>
                    <option value="">Select event...</option>
                    {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="ck-label">Add Members</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--ck-text-muted)" }} />
                    <input className="ck-input pl-9" placeholder="Search by name or email..." value={memberSearch} onChange={(e) => searchMembers(e.target.value)} />
                  </div>
                  {searchResults.length > 0 && (
                    <div className="mt-2 rounded-xl border border-[var(--ck-border)] max-h-40 overflow-y-auto" style={{ background: "var(--ck-bg)" }}>
                      {searchResults.map((u) => (
                        <button key={u.id} type="button"
                          disabled={!u.isApproved || !u.isActive}
                          onClick={() => {
                            setSelectedMembers([...selectedMembers, u]);
                            setSearchResults([]);
                            setMemberSearch("");
                          }}
                          className={`w-full text-left px-4 py-2.5 text-xs hover:bg-[var(--ck-bg-secondary)] transition flex items-center justify-between border-b border-[var(--ck-border)] last:border-b-0 ${(!u.isApproved || !u.isActive) ? "opacity-55 cursor-not-allowed" : ""}`}
                          style={{ color: "var(--ck-text)" }}
                        >
                          <span className="truncate">{u.name} ({u.email})</span>
                          {!u.isApproved ? (
                            <span className="text-[9px] text-amber-500 font-mono font-bold shrink-0 ml-2">PENDING (CANNOT ADD)</span>
                          ) : !u.isActive ? (
                            <span className="text-[9px] text-red-500 font-mono font-bold shrink-0 ml-2">INACTIVE (CANNOT ADD)</span>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedMembers.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {selectedMembers.map((m) => (
                        <span key={m.id} className="ck-badge ck-badge-primary flex items-center gap-1">
                          {m.name}
                          <button type="button" onClick={() => setSelectedMembers(selectedMembers.filter((s) => s.id !== m.id))} className="hover:text-red-400"><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button type="submit" disabled={creating} className="ck-btn-primary w-full">{creating ? "Creating..." : "Create Team"}</button>
              </form>
              <AnimatePresence>
                {showSuccess && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center z-50 p-6 text-center font-mono"
                  >
                    <div className="w-full max-w-sm bg-[var(--ck-bg)] border border-[#CCFF00]/30 p-5 rounded-lg text-left shadow-[0_0_20px_rgba(204,255,0,0.15)]">
                      <div className="flex items-center gap-2 border-b border-zinc-850 pb-2.5 mb-3.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#CCFF00] animate-ping" />
                        <span className="text-[10px] text-[var(--ck-primary)] font-bold uppercase tracking-wider">Security Core Shell v2.0</span>
                      </div>
                      <div className="space-y-2 text-xs text-[var(--ck-primary)]">
                        <p className="flex items-center gap-2"><span className="text-[var(--ck-accent)]">&gt;</span><span className="animate-pulse">INITIALIZING SECURE PROTOCOL...</span></p>
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="flex items-center gap-2">
                          <span className="text-[var(--ck-accent)]">&gt;</span><span>COMPILING MEMBER CREDENTIALS... [OK]</span>
                        </motion.p>
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="flex items-center gap-2 font-bold text-[var(--ck-primary)]">
                          <span className="text-[var(--ck-accent)]">&gt;</span><span className="shadow-[0_0_10px_rgba(204,255,0,0.2)]">IDENTITY CLONED &amp; SIGNED</span>
                        </motion.p>
                      </div>
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.6, type: "spring" }}
                        className="mt-5 flex items-center justify-center py-2 border border-[#CCFF00] bg-[#CCFF00]/10 rounded text-[var(--ck-primary)] font-bold text-xs uppercase tracking-wider">
                        Verification Lock Secure
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Join Team Modal */}
      <AnimatePresence>
        {showJoin && !isManagement && (
          <div className="ck-modal-overlay">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="ck-card p-6 w-full max-w-md relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#CCFF00] via-[#FF4D00] to-[#CCFF00]" />
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold" style={{ color: "var(--ck-text)" }}>Join Team</h2>
                <button onClick={() => { setShowJoin(false); setUseScanner(false); }} className="p-2 rounded-lg hover:bg-[var(--ck-border)]"><X className="w-5 h-5" /></button>
              </div>

              <div className="flex bg-black/40 p-1 rounded-lg border border-[var(--ck-border)] mb-4">
                <button 
                  onClick={() => setUseScanner(false)} 
                  className={`flex-1 py-2 text-xs font-mono uppercase tracking-wider rounded transition-colors ${!useScanner ? "bg-[#CCFF00] text-black font-bold shadow-[0_0_10px_rgba(204,255,0,0.3)]" : "text-[var(--ck-text-muted)] hover:text-[var(--ck-text)]"}`}>
                  Enter Code
                </button>
                <button 
                  onClick={() => setUseScanner(true)} 
                  className={`flex-1 py-2 text-xs font-mono uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-2 ${useScanner ? "bg-[#CCFF00] text-black font-bold shadow-[0_0_10px_rgba(204,255,0,0.3)]" : "text-[var(--ck-text-muted)] hover:text-[var(--ck-text)]"}`}>
                  <Camera className="w-3.5 h-3.5" /> Scan QR
                </button>
              </div>

              {useScanner ? (
                <div className="space-y-4">
                  <p className="text-xs text-center font-mono text-[var(--ck-text-secondary)]">Point your camera at the team's QR Code.</p>
                  <QrScanner onScan={handleScan} />
                </div>
              ) : (
                <form onSubmit={(e) => handleJoin(e)} className="space-y-4">
                  <div>
                    <label className="ck-label">Team Code</label>
                    <input 
                      className="ck-input font-mono tracking-widest text-lg uppercase" 
                      value={joinCode} 
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())} 
                      required 
                      placeholder="e.g. CK-T-1A2B3C" 
                    />
                  </div>
                  <button type="submit" disabled={joining || !joinCode} className="ck-btn-primary w-full shadow-[0_0_15px_rgba(204,255,0,0.2)]" style={{ backgroundColor: "#CCFF00", color: "black", borderColor: "#CCFF00" }}>
                    {joining ? "Authenticating..." : "Join via Code"}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reuse Team Modal */}
      <AnimatePresence>
        {showReuse && (
          <div className="ck-modal-overlay">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="ck-card p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4" style={{ color: "var(--ck-text)" }}>Reuse Team for Another Event</h2>
              <p className="text-sm mb-4" style={{ color: "var(--ck-text-secondary)" }}>Same team name and members will be cloned with a new team code and QR.</p>
              <div className="space-y-4">
                <div><label className="ck-label">Select New Event</label>
                  <select className="ck-input" value={reuseEventId} onChange={(e) => setReuseEventId(e.target.value)}>
                    <option value="">Choose event...</option>
                    {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setShowReuse(null); setReuseEventId(""); }} className="ck-btn-secondary flex-1">Cancel</button>
                  <button onClick={() => handleReuse(showReuse)} disabled={reusing || !reuseEventId} className="ck-btn-primary flex-1">
                    {reusing ? "Cloning..." : <><RefreshCw className="w-4 h-4" /> Reuse Team</>}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Disqualify Modal */}
      <AnimatePresence>
        {showDisqualifyModal && (
          <div className="ck-modal-overlay">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="ck-card p-6 w-full max-w-md border border-[#FF003C]/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#FF003C]/20 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5 text-[var(--ck-danger)]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[var(--ck-text)]">Disqualify Team</h2>
                  <p className="text-xs text-[var(--ck-text-muted)] font-mono">This action cannot be reversed.</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="ck-label">Reason for Disqualification</label>
                  <textarea className="ck-input" rows={3} placeholder="e.g. Violation of competition rules..." value={disqualifyReason} onChange={(e) => setDisqualifyReason(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setShowDisqualifyModal(null); setDisqualifyReason(""); }} className="ck-btn-secondary flex-1">Cancel</button>
                  <button onClick={() => handleDisqualify(showDisqualifyModal)} className="ck-btn-primary flex-1" style={{ backgroundColor: "#FF003C", color: "white" }}>
                    <ShieldAlert className="w-4 h-4" /> Disqualify
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Team Grid */}
      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>
      ) : displayedTeams.length === 0 ? (
        <div className="text-center py-20">
          <UsersRound className="w-16 h-16 mx-auto mb-4" style={{ color: "var(--ck-text-muted)" }} />
          <p className="text-lg" style={{ color: "var(--ck-text-secondary)" }}>No teams found</p>
          <p className="text-sm mt-1" style={{ color: "var(--ck-text-muted)" }}>
            {isManagement ? "No teams visible for selected filters" : "Create a team to get started"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedTeams.map((team, i) => (
            <motion.div key={team.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className={`ck-card backdrop-blur-md border shadow-md hover:shadow-[0_0_20px_rgba(204,255,0,0.1)] transition-all duration-300 relative overflow-hidden group ${
                team.isDisqualified
                  ? "bg-red-950/10 border-red-900/30 hover:border-red-500/30"
                  : "bg-zinc-950/45 border-[var(--ck-border)] hover:border-[#CCFF00]/40"
              }`}>

              {/* Disqualified banner */}
              {team.isDisqualified && (
                <div className="absolute top-0 left-0 w-full bg-[#FF003C]/20 border-b border-[#FF003C]/30 px-4 py-1.5 flex items-center gap-2 z-10">
                  <ShieldAlert className="w-3.5 h-3.5 text-[var(--ck-danger)]" />
                  <span className="text-[10px] font-mono font-bold text-[var(--ck-danger)] uppercase tracking-widest">DISQUALIFIED</span>
                  {team.disqualifyReason && <span className="text-[9px] text-[var(--ck-text-muted)] truncate">— {team.disqualifyReason}</span>}
                </div>
              )}

              {/* Grid background */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(204,255,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(204,255,0,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity" />

              <div className={`p-5 relative z-10 ${team.isDisqualified ? "pt-9" : ""}`}>
                <div className="flex items-start justify-between mb-3.5">
                  <div>
                    <h3 className="font-semibold text-lg font-mono tracking-wide text-[#F0F4FF]">{team.name}</h3>
                    <code className="text-[10px] px-2 py-0.5 rounded mt-1.5 inline-block font-mono tracking-wider border border-[#CCFF00]/20 bg-[#CCFF00]/5 text-[var(--ck-primary)]">
                      {team.teamCode}
                    </code>
                  </div>
                  <span className="ck-badge" style={{ borderColor: "rgba(204,255,0,0.3)", color: "#CCFF00", backgroundColor: "rgba(204,255,0,0.1)", fontSize: "10px" }}>{team._count?.members || 0} members</span>
                </div>

                {team.leader && (
                  <div className="flex items-center gap-2 mb-3.5 p-2 rounded-lg border border-amber-500/20 bg-amber-950/10">
                    <Crown className="w-3.5 h-3.5 text-amber-400 drop-shadow-[0_0_4px_rgba(245,158,11,0.5)]" />
                    <span className="text-xs font-medium font-mono text-amber-200">LEADER: {team.leader.name}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 mb-3.5">
                  <Calendar className="w-3.5 h-3.5" style={{ color: "#FF4D00" }} />
                  <p className="text-xs font-mono uppercase tracking-wider text-[var(--ck-text-secondary)]">{team.event?.title}</p>
                </div>

                {team.qrCode && (
                  <div className="mt-4 mb-2 flex justify-center">
                    <div className="p-2 bg-black/60 rounded-xl border border-[var(--ck-border)] group-hover:border-[#CCFF00]/25 transition-colors">
                      <img src={team.qrCode} alt="Team QR Code" className="w-28 h-28 rounded-lg" />
                    </div>
                  </div>
                )}

                {/* Expanded member list */}
                <AnimatePresence>
                  {expandedTeam === team.id && team.members && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="mt-4 overflow-hidden">
                      <div className="p-3 rounded-xl space-y-2 border border-[var(--ck-border)] bg-black/60">
                        <p className="text-[10px] font-bold font-mono tracking-widest uppercase" style={{ color: "#CCFF00" }}>Members Dossier</p>
                        {team.members.map((m) => (
                          <div key={m.user.id} className="flex items-center justify-between gap-2 text-xs font-mono border-b border-zinc-900/50 pb-1.5 last:border-0 last:pb-0 text-[var(--ck-text)]">
                            <div className="flex items-center gap-2 min-w-0">
                              {team.leader?.id === m.user.id ? (
                                <Crown className="w-3 h-3 text-amber-400 shrink-0" />
                              ) : (
                                <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00]/60 shrink-0" />
                              )}
                              <span className="font-semibold text-[var(--ck-text)] truncate">{m.user.name}</span>
                              <span className="text-[10px] text-[var(--ck-text-muted)] truncate hidden sm:block">({m.user.email})</span>
                            </div>
                            {isManagement && (
                              <button
                                onClick={() => handleRemoveMember(team.id, m.user.id, m.user.name)}
                                className="shrink-0 p-1 rounded hover:bg-red-950/40 text-[var(--ck-text-muted)] hover:text-[var(--ck-danger)] transition"
                                title="Remove member"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  <button onClick={() => loadTeamDetails(team.id)} className="ck-btn-secondary text-xs py-1.5 flex-1 font-mono uppercase tracking-wider text-[var(--ck-text-secondary)] hover:text-[var(--ck-text)]">
                    {expandedTeam === team.id ? <><ChevronUp className="w-3.5 h-3.5" style={{ color: "#CCFF00" }} /> Hide</> : <><ChevronDown className="w-3.5 h-3.5" style={{ color: "#CCFF00" }} /> Dossier</>}
                  </button>
                  <button onClick={() => downloadQR(team.id, team.teamCode)} className="ck-btn-secondary text-xs py-1.5 font-mono uppercase tracking-wider text-[var(--ck-text-secondary)] hover:text-[var(--ck-text)]" title="Download QR">
                    <Download className="w-3.5 h-3.5" style={{ color: "#FF4D00" }} />
                  </button>
                  {!isManagement && (
                    <button onClick={() => setShowReuse(team.id)} className="ck-btn-secondary text-xs py-1.5 font-mono uppercase tracking-wider text-[var(--ck-text-secondary)] hover:text-[var(--ck-text)]" title="Clone / Reuse Team">
                      <RefreshCw className="w-3.5 h-3.5" style={{ color: "#FF4D00" }} />
                    </button>
                  )}
                  {/* Admin-only controls */}
                  {isManagement && (
                    <>
                      {!team.isDisqualified && (
                        <button
                          onClick={() => setShowDisqualifyModal(team.id)}
                          className="ck-btn-secondary text-xs py-1.5 font-mono uppercase tracking-wider text-[var(--ck-text-secondary)] hover:text-[var(--ck-danger)] transition"
                          title="Disqualify Team"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveTeam(team.id, team.name)}
                        className="ck-btn-secondary text-xs py-1.5 font-mono uppercase tracking-wider text-[var(--ck-text-secondary)] hover:text-[var(--ck-danger)] transition"
                        title="Remove Team"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
