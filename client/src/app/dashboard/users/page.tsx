"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, getFileUrl } from "@/lib/api";
import { motion } from "framer-motion";
import { 
  Users, UserCheck, UserX, Search, Shield, ChevronDown, 
  ChevronLeft, ChevronRight, GraduationCap, Mail, Phone 
} from "lucide-react";
import { DefaultAvatar } from "@/components/default-avatar";

interface UserEntry { 
  id: string; 
  name: string; 
  email: string; 
  role: string; 
  studentId?: string; 
  department?: string; 
  phone?: string; 
  semester?: string; 
  institute?: string; 
  isActive: boolean; 
  isApproved: boolean; 
  createdAt: string; 
  avatarUrl?: string; 
}

const ROLES = ["FACULTY", "STUDENT_COORDINATOR", "TECH", "CONTENT", "SOCIAL_MEDIA", "MEMBER", "GUEST"];

export default function UsersPage() {
  const { user, token } = useAuth();
  const [approvedUsers, setApprovedUsers] = useState<UserEntry[]>([]);
  const [pendingUsers, setPendingUsers] = useState<UserEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  const load = async () => {
    try {
      let pendingParams = "?approved=false";
      if (search) pendingParams += `&search=${search}`;

      let approvedParams = `?approved=true&page=${currentPage}&limit=${itemsPerPage}`;
      if (search) approvedParams += `&search=${search}`;
      if (roleFilter) approvedParams += `&role=${roleFilter}`;

      const [pendingData, approvedData] = await Promise.all([
        api<{ users: UserEntry[] }>(`/users${pendingParams}`, { token: token || undefined }),
        api<{ users: UserEntry[]; total: number; pages: number }>(`/users${approvedParams}`, { token: token || undefined })
      ]);

      setPendingUsers(pendingData.users);
      setApprovedUsers(approvedData.users);
      setTotalItems(approvedData.total);
      setTotalPages(approvedData.pages);
    } catch (err) { 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { if (token) load(); }, [token, search, roleFilter, currentPage]);

  // Reset pagination when search queries or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter]);

  const handleApprove = async (id: string) => {
    try { await api(`/users/${id}/approve`, { method: "PATCH", token: token || undefined }); load(); }
    catch (err) { alert(err instanceof Error ? err.message : "Failed"); }
  };

  const handleReject = async (id: string) => {
    if (!confirm("Are you sure you want to reject access and permanently remove this candidate and all their data from the portal?")) return;
    try { await api(`/users/${id}/reject`, { method: "PATCH", token: token || undefined }); load(); }
    catch (err) { alert(err instanceof Error ? err.message : "Failed"); }
  };

  const handleRoleChange = async (id: string, role: string) => {
    try { await api(`/users/${id}/role`, { method: "PATCH", token: token || undefined, body: JSON.stringify({ role }) }); load(); }
    catch (err) { alert(err instanceof Error ? err.message : "Failed"); }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try { await api(`/users/${id}/${isActive ? "deactivate" : "activate"}`, { method: "PATCH", token: token || undefined }); load(); }
    catch (err) { alert(err instanceof Error ? err.message : "Failed"); }
  };

  const paginatedUsers = approvedUsers;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold font-mono tracking-tighter uppercase" style={{ color: "var(--ck-text)" }}>OPERATIVE BASE</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--ck-text-secondary)" }}>ACCESS CONTROL // IDENTITY MANAGEMENT</p>
        </div>
      </div>

      {/* Pending Approvals Banner */}
      {pendingUsers.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="ck-card p-5 mb-6 border-l-4 border-[#FF4D00] relative overflow-hidden bg-[#FF4D00]/5 shadow-[0_0_15px_rgba(255,77,0,0.08)] border-[var(--ck-border)]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF4D00]/5 blur-3xl pointer-events-none" />
          <h3 className="font-semibold mb-3 flex items-center gap-2 uppercase font-mono tracking-tighter text-[var(--ck-accent)] text-sm">
            <UserCheck className="w-5 h-5" /> {pendingUsers.length} PENDING AUTHORIZATION
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {pendingUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--ck-border)] bg-black/40 hover:border-[#FF4D00]/30 transition duration-200">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[var(--ck-text)]">{u.name}</p>
                    {u.studentId && (
                      <span className="text-[9px] font-mono bg-[#FF4D00]/10 border border-[#FF4D00]/25 px-1.5 py-0.5 rounded text-[var(--ck-accent)]">
                        {u.role === "FACULTY" ? `EMP ID: ${u.studentId}` : `ST ID: ${u.studentId}`}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-mono mt-1 text-[var(--ck-text-muted)] uppercase">
                    {u.email.toLowerCase()} {u.phone ? `// TEL: ${u.phone}` : ""} {u.department ? `// DEPT: ${u.department}` : ""} {u.role !== "FACULTY" && u.semester ? `// SEM: ${u.semester}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleApprove(u.id)} className="ck-btn-primary text-[10px] py-1.5 px-3 font-mono flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" /> GRANT ACCESS
                  </button>
                  <button 
                    onClick={() => handleReject(u.id)} 
                    className="px-3 py-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-[10px] font-mono font-bold uppercase transition flex items-center gap-1 cursor-pointer"
                  >
                    <UserX className="w-3.5 h-3.5" /> REJECT ACCESS
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center mb-6">
        <div className="relative flex-1 max-w-sm ck-search-container ck-input-icon-wrapper">
          <Search className="w-4 h-4" style={{ color: "#CCFF00" }} />
          <input className="ck-input ck-search-input pl-9" placeholder="SEARCH BY IDENTITY..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="ck-input w-auto text-xs py-2 font-mono" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">ALL ROLES</option>
          {ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-3 border-violet-500/30 border-t-cyan-400 rounded-full animate-spin" />
        </div>
      ) : approvedUsers.length === 0 ? (
        <div className="ck-card p-12 text-center">
          <Users className="w-12 h-12 mx-auto mb-3 text-zinc-650" />
          <p className="text-sm font-mono text-[var(--ck-text-muted)] uppercase">NO IDENTITY ENTRIES RECORDED</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="ck-card border border-[var(--ck-border)]">
            <div className="overflow-x-auto w-full">
              <table className="ck-table ck-table-responsive whitespace-nowrap">
                <thead>
                <tr>
                  <th>Profile & ID</th>
                  <th>Contact Details</th>
                  <th>Academic Info</th>
                  <th>Security Role</th>
                  <th>Operational Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((u) => (
                  <tr key={u.id} className="group hover:bg-violet-500/[0.02]">
                    {/* Profile & ID */}
                    <td data-label="Profile & ID">
                      <div className="flex items-center gap-2.5">
                        {u.avatarUrl ? (
                          <img src={getFileUrl(u.avatarUrl)} alt="Avatar" className="w-9 h-9 rounded-lg object-cover border border-violet-500/20" />
                        ) : (
                          <DefaultAvatar className="w-9 h-9" />
                        )}
                        <div>
                          <p className="text-sm font-semibold text-[var(--ck-text)] tracking-wide">{u.name}</p>
                          <p className="text-[10px] font-mono mt-0.5 text-[var(--ck-text-muted)] uppercase">
                            {u.studentId ? (u.role === "FACULTY" ? `EMPID: ${u.studentId}` : `STID: ${u.studentId}`) : "GUEST / NO ID"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Contact Details */}
                    <td data-label="Contact Details">
                      <div className="space-y-0.5 font-mono">
                        <p className="text-xs text-[var(--ck-text)] lowercase flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-[var(--ck-primary)]/60" /> {u.email}
                        </p>
                        {u.phone ? (
                          <p className="text-[10px] text-[var(--ck-text-muted)] flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-zinc-650" /> {u.phone}
                          </p>
                        ) : (
                          <p className="text-[10px] text-zinc-650 italic pl-5">No phone number</p>
                        )}
                      </div>
                    </td>

                    {/* Academic Details */}
                    <td data-label="Academic Info">
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-[var(--ck-text)] font-mono uppercase flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-[var(--ck-accent)]/60" /> {u.department || "N/A"}
                        </p>
                        <p className="text-[10px] text-[var(--ck-text-muted)] font-mono uppercase pl-5">
                          {u.role === "FACULTY" ? (u.institute || "FACULTY") : `${u.semester ? `SEM: ${u.semester}` : "SEM: —"} / ${u.institute || "GUEST"}`}
                        </p>
                      </div>
                    </td>

                    {/* Security Role */}
                    <td data-label="Security Role">
                      {user?.role && ["FACULTY", "STUDENT_COORDINATOR"].includes(user.role) ? (
                        <select className="ck-input text-[10px] py-1 px-2.5 w-auto font-mono border-[var(--ck-border)] focus:border-cyan-500/40" value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)}>
                          {ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
                        </select>
                      ) : (
                        <span className="ck-badge ck-badge-primary text-[10px]">{u.role.replace(/_/g, " ")}</span>
                      )}
                    </td>

                    {/* Operational Status */}
                    <td data-label="Operational Status">
                      {u.isActive ? (
                        <span className="ck-badge ck-badge-success text-[10px] tracking-wider">ACTIVE</span>
                      ) : (
                        <span className="ck-badge bg-rose-950/40 border border-rose-500/30 text-rose-400 text-[10px] tracking-wider">INACTIVE</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td data-label="Actions">
                      {user?.role && ["FACULTY", "STUDENT_COORDINATOR"].includes(user.role) && u.id !== user.id && (
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleToggleActive(u.id, u.isActive)} 
                            className={`text-[10px] uppercase font-mono tracking-wider px-2.5 py-1 rounded border transition-all duration-300 ${
                              u.isActive 
                              ? "text-amber-400 border-amber-900/30 hover:bg-amber-500/10 hover:border-amber-500/50" 
                              : "text-emerald-400 border-emerald-900/30 hover:bg-emerald-500/10 hover:border-emerald-500/50"
                            }`}
                          >
                            {u.isActive ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            onClick={() => handleReject(u.id)}
                            className="text-[10px] uppercase font-mono tracking-wider px-2.5 py-1 rounded border text-rose-400 border-rose-900/30 hover:bg-rose-500/10 hover:border-rose-500/50 transition-all duration-300 flex items-center gap-1 cursor-pointer"
                            title="Reject or Revoke Access"
                          >
                            <UserX className="w-3 h-3" /> Reject Access
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border border-[var(--ck-border)] bg-zinc-950/40 rounded-xl">
              <span className="text-[10px] font-mono text-[var(--ck-text-muted)] uppercase tracking-wider">
                Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="ck-btn-secondary py-1 px-3 text-[10px] font-mono disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3.5 h-3.5 inline mr-0.5" /> PREV
                </button>
                
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  const isCurrent = currentPage === pageNum;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-7 h-7 rounded-lg border text-[10px] font-bold font-mono transition-all duration-200 ${
                        isCurrent
                          ? "bg-[#CCFF00] border-[#CCFF00] text-black shadow-[0_0_8px_rgba(204,255,0,0.3)]"
                          : "border-[var(--ck-border)] bg-zinc-900/40 hover:border-[var(--ck-border)] text-[var(--ck-text-secondary)] hover:text-[var(--ck-text)]"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="ck-btn-secondary py-1 px-3 text-[10px] font-mono disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  NEXT <ChevronRight className="w-3.5 h-3.5 inline ml-0.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
