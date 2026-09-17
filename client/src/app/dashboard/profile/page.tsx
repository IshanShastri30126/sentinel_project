"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api, API_BASE, getFileUrl } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  User,
  Star,
  Calendar,
  Award,
  TrendingUp,
  Shield,
  Edit2,
  X,
  Upload,
  Mail,
  Hash,
  BookOpen,
  Building,
  GraduationCap,
  Phone,
  Fingerprint
} from "lucide-react";
import { DefaultAvatar } from "@/components/default-avatar";
import { INSTITUTES, INSTITUTE_DEPARTMENTS, SEMESTERS } from "@/app/auth/page";
import { useCyberDialog } from "@/components/ui/CyberDialogContext";

export default function ProfilePage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const { showToast } = useCyberDialog();
  const [history, setHistory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  
  // Edit Profile State
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBiometricScan, setShowBiometricScan] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editStudentId, setEditStudentId] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editInstitute, setEditInstitute] = useState("");
  const [editAvatar, setEditAvatar] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    setEditName(user.name || "");
    setEditStudentId(user.studentId || "");
    setEditPhone(user.phone || "");
    setEditDepartment(user.department || "");
    setEditInstitute(user.institute || "");

    const load = async () => {
      try {
        const data = await api<any>(`/appreciation/user/${user.id}/history`, { token: token || undefined });
        setHistory(data);
      } catch (err) {
        console.warn("Profile history notice:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, user]);

  const isFaculty = user?.role === "FACULTY_COORDINATOR";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-8 h-8 border-3 border-violet-500/30 border-t-cyan-400 rounded-full animate-spin" />
        <p className="text-xs uppercase font-mono text-[var(--ck-text-secondary)] tracking-widest">Loading Operative Dossier...</p>
      </div>
    );
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const sanitizedPhone = editPhone ? editPhone.replace(/\D/g, "").slice(0, 10) : "";
      if (sanitizedPhone && !/^\d{10}$/.test(sanitizedPhone)) {
        showToast("Mobile number must be exactly 10 numeric digits", "error");
        setSubmitting(false);
        return;
      }

      const formData = new FormData();
      if (editName) formData.append("name", editName);
      if (editPassword) formData.append("password", editPassword);
      if (editAvatar) formData.append("avatar", editAvatar);
      if (isFaculty) {
        formData.append("employeeId", editStudentId);
        formData.append("studentId", editStudentId);
      } else {
        formData.append("studentId", editStudentId);
      }
      formData.append("phone", sanitizedPhone);
      formData.append("department", editDepartment);
      formData.append("institute", editInstitute);

      const res = await fetch(`${API_BASE}/users/profile`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update profile");
      }
      
      setShowEditModal(false);
      setShowBiometricScan(true);
      setTimeout(() => {
        window.location.reload();
      }, 2800);
    } catch (err: any) {
      console.warn("Profile update notice:", err);
      showToast(err instanceof Error ? err.message : "Error updating profile", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
  } as const;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <div className="flex items-center">
        <button
          onClick={() => {
            if (typeof window !== "undefined" && window.history.length > 1) {
              router.back();
            } else {
              router.push("/dashboard");
            }
          }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-black/50 hover:bg-[var(--ck-bg-card)] border border-[var(--ck-border)] hover:border-[#00F5D4]/40 text-xs font-mono uppercase tracking-wider text-[var(--ck-text-secondary)] hover:text-[#00F5D4] transition-all duration-200 shadow-sm group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#00F5D4] transition-transform group-hover:-translate-x-1" />
          <span>Back</span>
        </button>
      </div>

      {/* Profile Header Dossier Card */}
      <div className="ck-card p-6 sm:p-8 relative overflow-hidden bg-black/40 border border-[var(--ck-border)] shadow-md hover:border-[#00F5D4]/25 transition-all">
        <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-[#00F5D4]/5 to-transparent pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left relative z-10">
          <div className="relative shrink-0 group">
            <DefaultAvatar
              src={user?.avatarUrl}
              alt={user?.name || "Avatar"}
              className="w-24 h-24 rounded-2xl border-2 border-[#00F5D4]/60 shadow-[0_0_15px_rgba(0,245,212,0.25)]"
            />
            <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer" onClick={() => setShowEditModal(true)}>
              <Edit2 className="w-5 h-5 text-[var(--ck-text)]" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h1 className="text-3xl font-extrabold tracking-tight text-[var(--ck-text)]">{user?.name}</h1>
              <span className="ck-badge ck-badge-primary self-center sm:self-start text-[9px] px-2 py-0.5">
                {user?.role?.replace(/_/g, " ")}
              </span>
            </div>
            <p className="text-sm font-mono text-[var(--ck-text-secondary)]">{user?.email}</p>
            
            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 mt-3 text-xs font-mono">
              {user?.studentId && !user.studentId.includes("@") && (
                <span className="px-2 py-0.5 rounded bg-[var(--ck-bg)] border border-[var(--ck-border)] text-[var(--ck-text-muted)]">
                  {isFaculty ? `EMPLOYEE ID: ${user.studentId}` : `CLEARANCE: ${user.studentId}`}
                </span>
              )}
              {user?.department && (
                <span className="px-2 py-0.5 rounded bg-[var(--ck-bg)] border border-[var(--ck-border)] text-[var(--ck-text-muted)]">
                  DEPT: {user.department}
                </span>
              )}
            </div>
          </div>
          
          {/* Responsive single Edit Button */}
          <button
            onClick={() => setShowEditModal(true)}
            className="ck-btn-secondary px-4 py-2 flex items-center gap-2 text-xs font-mono tracking-widest uppercase transition shrink-0 self-center sm:self-start"
          >
            <Edit2 className="w-3.5 h-3.5" /> Edit Profile
          </button>
        </div>
      </div>

      {/* Profile Metrics Grid */}
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1 */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -2 }}
          className="ck-card p-5 bg-[#070E1A] border border-[#1E293B] hover:border-[#00F5D4]/40 transition-all duration-200 relative group overflow-hidden"
        >
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded border border-[#00F5D4]/40 bg-[#00F5D4]/10 text-[#00F5D4] flex items-center justify-center shrink-0">
              <Star className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
                {history?.totalPoints || 0}
              </p>
              <p className="text-[10px] uppercase font-mono tracking-widest text-slate-400 font-bold">Total Points</p>
            </div>
          </div>
        </motion.div>

        {/* Metric 2 */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -2 }}
          className="ck-card p-5 bg-[#070E1A] border border-[#1E293B] hover:border-[#00E1FF]/40 transition-all duration-200 relative group overflow-hidden"
        >
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded border border-[#00E1FF]/40 bg-[#00E1FF]/10 text-[#00E1FF] flex items-center justify-center shrink-0">
              <Award className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
                {history?.badges?.length || 0}
              </p>
              <p className="text-[10px] uppercase font-mono tracking-widest text-slate-400 font-bold">Badges unlocked</p>
            </div>
          </div>
        </motion.div>

        {/* Metric 3 */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -2 }}
          className="ck-card p-5 bg-[#070E1A] border border-[#1E293B] hover:border-[#00F5D4]/40 transition-all duration-200 relative group overflow-hidden"
        >
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded border border-slate-700/60 bg-slate-800/20 text-slate-300 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
                {history?.eventParticipation || 0}
              </p>
              <p className="text-[10px] uppercase font-mono tracking-widest text-slate-400 font-bold">Events Participated</p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Operative Details Grid */}
      <div className="ck-card p-6 bg-black/30 border border-[var(--ck-border)] shadow-md">
        <h3 className="text-sm font-bold mb-5 flex items-center gap-2 uppercase tracking-tight text-[var(--ck-text)] font-mono border-b border-zinc-850 pb-3">
          <User className="w-4 h-4" style={{ color: "#00F5D4" }} /> OPERATIVE DOSSIER DETAILS
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-mono">
          {/* Full Name */}
          <div className="p-3.5 rounded border border-slate-800 bg-[#070E1A]/80 flex items-center gap-4 hover:border-[#00F5D4]/40 transition duration-200">
            <div className="w-8 h-8 rounded border border-slate-700/60 bg-slate-800/30 flex items-center justify-center text-[#00F5D4] shrink-0">
              <User className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Full Name</p>
              <p className="font-bold mt-0.5 text-white truncate">{user?.name}</p>
            </div>
          </div>

          {/* Email */}
          <div className="p-3.5 rounded border border-slate-800 bg-[#070E1A]/80 flex items-center gap-4 hover:border-[#00F5D4]/40 transition duration-200">
            <div className="w-8 h-8 rounded border border-slate-700/60 bg-slate-800/30 flex items-center justify-center text-[#00E1FF] shrink-0">
              <Mail className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">College Email</p>
              <p className="font-bold mt-0.5 text-white truncate">{user?.email}</p>
            </div>
          </div>

          {/* Student / Employee ID */}
          <div className="p-3.5 rounded border border-slate-800 bg-[#070E1A]/80 flex items-center gap-4 hover:border-[#00F5D4]/40 transition duration-200">
            <div className="w-8 h-8 rounded border border-slate-700/60 bg-slate-800/30 flex items-center justify-center text-slate-300 shrink-0">
              <Hash className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                {isFaculty ? "Employee ID" : "Student ID"}
              </p>
              <p className="font-bold mt-0.5 text-white truncate">{((user as any)?.employeeId || user?.studentId || "N/A")}</p>
            </div>
          </div>

          {/* Department */}
          <div className="p-3.5 rounded border border-slate-800 bg-[#070E1A]/80 flex items-center gap-4 hover:border-[#00F5D4]/40 transition duration-200">
            <div className="w-8 h-8 rounded border border-slate-700/60 bg-slate-800/30 flex items-center justify-center text-slate-300 shrink-0">
              <BookOpen className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Department</p>
              <p className="font-bold mt-0.5 text-white truncate">{user?.department || "N/A"}</p>
            </div>
          </div>

          {/* Institute */}
          <div className="p-3.5 rounded border border-slate-800 bg-[#070E1A]/80 flex items-center gap-4 hover:border-[#00F5D4]/40 transition duration-200">
            <div className="w-8 h-8 rounded border border-slate-700/60 bg-slate-800/30 flex items-center justify-center text-slate-300 shrink-0">
              <Building className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Institute</p>
              <p className="font-bold mt-0.5 text-white truncate">{user?.institute || "N/A"}</p>
            </div>
          </div>

          {/* Semester (Completely Removed for Faculty) */}
          {!isFaculty && (
            <div className="p-3.5 rounded border border-slate-800 bg-[#070E1A]/80 flex items-center gap-4 hover:border-[#00F5D4]/40 transition duration-200">
              <div className="w-8 h-8 rounded border border-slate-700/60 bg-slate-800/30 flex items-center justify-center text-slate-300 shrink-0">
                <GraduationCap className="w-4 h-4" strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Semester</p>
              </div>
            </div>
          )}

          {/* Contact info */}
          <div className="p-3.5 rounded border border-slate-800 bg-[#070E1A]/80 flex items-center gap-4 hover:border-[#00F5D4]/40 transition duration-200 sm:col-span-2">
            <div className="w-8 h-8 rounded border border-slate-700/60 bg-slate-800/30 flex items-center justify-center text-[#00F5D4] shrink-0">
              <Phone className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Contact Phone</p>
              <p className="font-bold mt-0.5 text-white truncate">{user?.phone || "N/A"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Badges showcase section */}
      {history?.badges?.length > 0 && (
        <div className="ck-card p-6 bg-black/30 border border-[var(--ck-border)] shadow-md">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-tight text-[var(--ck-text)] font-mono border-b border-zinc-850 pb-3">
            <Shield className="w-4 h-4" style={{ color: "#FF4D00" }} /> BADGES VAULT
          </h3>
          <div className="flex flex-wrap gap-3">
            {history.badges.map((b: any) => (
              <motion.div
                key={b.id}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.05 }}
                className="p-3.5 rounded-xl text-center border border-[var(--ck-border)] bg-zinc-950/40 hover:border-[#00F5D4]/30 min-w-[90px] transition-all cursor-help"
                title={b.badge.description}
              >
                <span className="text-3xl drop-shadow-[0_0_8px_rgba(0,245,212,0.35)]">{b.badge.icon}</span>
                <p className="text-[10px] font-mono font-bold mt-1.5 text-[var(--ck-text-secondary)] uppercase">{b.badge.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Point history list */}
      {history?.points?.length > 0 && (
        <div className="ck-card p-6 bg-black/30 border border-[var(--ck-border)] shadow-md">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-tight text-[var(--ck-text)] font-mono border-b border-zinc-850 pb-3">
            <TrendingUp className="w-4 h-4" style={{ color: "#00F5D4" }} /> CONTRIBUTION LEDGER
          </h3>
          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {history.points.slice(0, 20).map((p: any) => (
              <div key={p.id} className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--ck-border)] bg-zinc-950/30 text-xs font-mono">
                <div>
                  <p className="font-bold text-[var(--ck-text)] uppercase">{p.category}</p>
                  {p.reason && <p className="text-[10px] text-[var(--ck-text-secondary)] mt-0.5">{p.reason}</p>}
                  <p className="text-[9px] text-[var(--ck-text-muted)] mt-0.5">Approved by {p.giver?.name || "System"} · {new Date(p.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${p.points >= 0 ? "bg-emerald-950/30 text-emerald-400 border border-emerald-900/40" : "bg-red-950/30 text-red-400 border border-red-900/40"}`}>
                  {p.points >= 0 ? `+${p.points}` : p.points} PTS
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && (
          <div className="ck-modal-overlay">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="ck-card p-6 w-full max-w-lg relative bg-zinc-955/95 border border-[var(--ck-border)] shadow-lg">
              <button onClick={() => setShowEditModal(false)} className="absolute top-4 right-4 text-[var(--ck-text-muted)] hover:text-[var(--ck-text)] transition z-20">
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold text-[var(--ck-text)] mb-6 uppercase tracking-tight font-mono">Edit Profile Dossier</h2>
              
              <form onSubmit={handleEditSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
                <div>
                  <label className="ck-label">Full Name</label>
                  <input className="ck-input" value={editName} onChange={(e) => setEditName(e.target.value)} required />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="ck-label">{isFaculty ? "Employee ID" : "Student ID"}</label>
                    <input className="ck-input" value={editStudentId} onChange={(e) => setEditStudentId(e.target.value)} required />
                  </div>
                  <div>
                    <label className="ck-label">Mobile Number (10 Digits)</label>
                    <input 
                      className="ck-input" 
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="10-digit mobile number"
                      value={editPhone} 
                      maxLength={10}
                      onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} 
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="ck-label">Institute</label>
                    <select 
                      className="ck-input" 
                      value={editInstitute} 
                      onChange={(e) => {
                        const newInst = e.target.value;
                        setEditInstitute(newInst);
                        const depts = INSTITUTE_DEPARTMENTS[newInst] || [];
                        setEditDepartment(depts.length > 0 ? depts[0] : "");
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
                    <label className="ck-label">Department</label>
                    <select 
                      className="ck-input disabled:opacity-50" 
                      value={editDepartment} 
                      onChange={(e) => setEditDepartment(e.target.value)} 
                      required 
                      disabled={!editInstitute}
                    >
                      {!editInstitute ? (
                        <option value="" className="bg-[#050A18]">Select Institute first</option>
                      ) : (
                        (INSTITUTE_DEPARTMENTS[editInstitute] || []).map((dept) => (
                          <option key={dept} value={dept} className="bg-[#050A18] text-white">{dept}</option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                {!isFaculty && (
                  <div>
                    <label className="ck-label">Semester (1-8)</label>
                    <select 
                      className="ck-input" 
                      required
                    >
                      <option value="" className="bg-[#050A18]">Select Semester...</option>
                      {SEMESTERS.map((sem) => (
                        <option key={sem} value={sem} className="bg-[#050A18] text-white">Semester {sem}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="ck-label">New Password (Optional)</label>
                  <input className="ck-input" type="password" placeholder="Leave blank to keep current" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} minLength={6} />
                </div>

                <div>
                  <label className="ck-label">Avatar Photograph</label>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl border border-[#00F5D4]/30 overflow-hidden bg-black/40 shrink-0 flex items-center justify-center">
                      {editAvatar ? (
                        <img src={URL.createObjectURL(editAvatar)} alt="Preview" className="w-full h-full object-cover" />
                      ) : user?.avatarUrl ? (
                        <img src={getFileUrl(user.avatarUrl)} alt="Current Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <DefaultAvatar className="w-12 h-12" />
                      )}
                    </div>
                    <div className="relative flex-1">
                      <input type="file" accept="image/*" onChange={(e) => setEditAvatar(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                      <div className="ck-input flex items-center justify-between pointer-events-none">
                        <span className="truncate">{editAvatar ? editAvatar.name : "Choose new avatar photo..."}</span>
                        <Upload className="w-4 h-4 text-[#00F5D4]" />
                      </div>
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={submitting} className="ck-btn-primary w-full mt-4">
                  {submitting ? "Updating..." : "Save Changes"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Biometric Scanning Success Overlay */}
      <AnimatePresence>
        {showBiometricScan && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center z-50 p-6"
          >
            <div className="relative w-48 h-48 flex items-center justify-center border border-[#00F5D4]/20 rounded-full bg-zinc-900/50 shadow-[0_0_50px_rgba(0,245,212,0.1)] mb-6 overflow-hidden">
              {/* Scan line */}
              <motion.div 
                className="absolute left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00F5D4] to-transparent shadow-[0_0_8px_rgba(0,245,212,0.8)]"
                animate={{ top: ["0%", "100%", "0%"] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                animate={{ scale: [0.95, 1.05, 0.95] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <Fingerprint className="w-20 h-20 text-[#00F5D4] drop-shadow-[0_0_15px_rgba(0,245,212,0.5)]" />
              </motion.div>
            </div>
            
            <h3 className="text-xl font-bold font-mono uppercase tracking-widest mb-2 text-[#00F5D4]">
              BIOMETRIC VERIFIED
            </h3>
            <p className="text-[10px] text-[var(--ck-text-secondary)] font-mono uppercase tracking-wider text-center max-w-sm">
              DNA Profile updated successfully. Recalibrating agent credentials.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
