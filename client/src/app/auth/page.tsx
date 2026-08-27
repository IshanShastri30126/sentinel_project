"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Shield, Mail, Lock, User, ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle, Smartphone, Building, GraduationCap, Sparkles, ShieldAlert } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import PlexusBackground from "@/components/PlexusBackground";
import { SentinalLogo } from "@/components/SentinalLogo";
import { api } from "@/lib/api";
export const INSTITUTES = ["CSPIT", "DEPSTAR", "PDPIAS", "CMPICA", "IIIM"] as const;

export const INSTITUTE_DEPARTMENTS: Record<string, string[]> = {
  CSPIT: ["CE", "IT", "CSE", "ME", "CL", "EC", "AIML", "ELECTRICAL"],
  DEPSTAR: ["CSE", "CE", "IT"],
  IIIM: ["MBA", "BBA"],
  CMPICA: ["BSC.IT", "BCA"],
  PDPIAS: ["MATHS", "BIOSCIENCE", "CHEMISTRY", "PHYSICS"],
};

export const SEMESTERS = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;

function LoginPageContent() {
  const { login, loginWithGoogle, register, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams?.get("redirect") || "/dashboard";
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [studentId, setStudentId] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [institute, setInstitute] = useState("");
  const [semester, setSemester] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registeredPending, setRegisteredPending] = useState(false);

  // Rate Limiting Block State
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockRemainingSec, setBlockRemainingSec] = useState(0);
  const [blockTier, setBlockTier] = useState<1 | 2>(1);
  const [blockMessage, setBlockMessage] = useState("");

  // Check login block status from server
  const checkBlockStatus = async (targetEmail?: string) => {
    try {
      const query = targetEmail ? `?email=${encodeURIComponent(targetEmail)}` : "";
      const status = await api<any>(`/auth/login-status${query}`);
      if (status.blocked) {
        setIsBlocked(true);
        setBlockRemainingSec(status.remainingSeconds);
        setBlockTier(status.tier || 1);
        setBlockMessage(status.message || "Login access blocked due to multiple failed attempts.");
      } else {
        setIsBlocked(false);
        setBlockRemainingSec(0);
      }
    } catch (err) {
      console.warn("Failed to check block status", err);
    }
  };

  // Check IP block status on initial load, and debounce email check
  useEffect(() => {
    if (!isLogin) return;

    // If no email entered, only check IP block once
    if (!email || !email.includes("@") || email.length < 5) {
      checkBlockStatus();
      return;
    }

    // Debounce checking specific email block status by 600ms
    const debounceTimer = setTimeout(() => {
      checkBlockStatus(email);
    }, 600);

    return () => clearTimeout(debounceTimer);
  }, [email, isLogin]);


  // Countdown timer interval for block screen
  useEffect(() => {
    if (!isBlocked || blockRemainingSec <= 0) return;

    const timer = setInterval(() => {
      setBlockRemainingSec((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          checkBlockStatus(email);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isBlocked, blockRemainingSec, email]);

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const pad = (n: number) => n.toString().padStart(2, "0");
    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  // Club namespaces support
  const [clubs, setClubs] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [selectedClubId, setSelectedClubId] = useState("");
  const [registerNewClub, setRegisterNewClub] = useState(false);
  const [newClubName, setNewClubName] = useState("");
  const [newClubSlug, setNewClubSlug] = useState("");

  // Fetch all existing clubs
  useEffect(() => {
    async function loadClubs() {
      try {
        const data = await api<{ clubs: Array<{ id: string; name: string; slug: string }> }>("/clubs");
        setClubs(data.clubs || []);
        if (data.clubs && data.clubs.length > 0) {
          setSelectedClubId(data.clubs[0].id);
        }
      } catch (err) {
        console.error("Failed to load clubs", err);
      }
    }
    loadClubs();
  }, []);

  // If already logged in, redirect
  useEffect(() => {
    if (user && (user.isApproved || user.role === "GUEST")) router.push(redirectTarget);
  }, [user, router, redirectTarget]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        try {
          await login(email, password);
          router.push(redirectTarget);
        } catch (loginErr: any) {
          // Check if response contains blocked rate limit info
          if (loginErr?.blocked || loginErr?.remainingSeconds) {
            setIsBlocked(true);
            setBlockRemainingSec(loginErr.remainingSeconds || 1200);
            setBlockTier(loginErr.tier || 1);
            setBlockMessage(loginErr.error || loginErr.message || "Login access blocked.");
          } else {
            await checkBlockStatus(email);
          }
          throw loginErr;
        }
      } else {
        if (!/^\d{10}$/.test(phone)) {
          throw new Error("Mobile number must be exactly 10 numeric digits");
        }
        await register(name, email, password, {
          studentId,
          phone,
          department,
          institute,
          semester,
          ...(selectedClubId ? { clubId: selectedClubId } : {})
        });
        setRegisteredPending(true);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setError(""); setEmail(""); setPassword(""); setName(""); setStudentId("");
    setPhone(""); setDepartment(""); setInstitute(""); setSemester("");
    setRegisteredPending(false);
  };

  if (isBlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#030712] text-white font-mono">
        <PlexusBackground />
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg relative z-10">
          <div className="bg-[#0A030D]/95 backdrop-blur-2xl rounded-3xl p-8 shadow-[0_0_50px_rgba(239,68,68,0.25)] text-center border-2 border-red-500/50 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-amber-500 to-red-600 animate-pulse" />
            
            <div className="w-20 h-20 rounded-full bg-red-950/80 border-2 border-red-500/80 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(239,68,68,0.5)]">
              <ShieldAlert className="w-10 h-10 text-red-500 animate-bounce" />
            </div>

            <span className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/40 text-red-400 text-[10px] font-bold tracking-widest uppercase mb-3 inline-block">
              SECURITY LOCKOUT IN EFFECT
            </span>

            <h2 className="text-2xl font-black text-white font-mono mb-2 tracking-wider">
              {blockTier === 1 ? "20-MINUTE ACCESS BLOCK" : "5-HOUR MAXIMUM LOCKOUT"}
            </h2>

            <p className="text-slate-300 text-xs mb-6 max-w-md mx-auto leading-relaxed">
              {blockMessage || "Multiple failed authentication attempts detected. Access from this IP address, account email, or private browser window has been totally blocked by server rate-limiting security."}
            </p>

            {/* Countdown Timer Display */}
            <div className="bg-black/80 border border-red-500/30 rounded-2xl p-6 mb-6">
              <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase block mb-1">
                TIME REMAINING UNTIL UNLOCK
              </span>
              <div className="text-4xl sm:text-5xl font-black text-red-400 font-mono tracking-wider animate-pulse">
                {formatTimer(blockRemainingSec)}
              </div>
              <span className="text-[10px] text-amber-400/80 font-mono mt-2 block">
                {blockTier === 1
                  ? "Tier 1 Block (4 Failed Attempts). 1 chance will be granted after timer expires."
                  : "Tier 2 Maximum Block (Final Chance Failed). Strict 5-hour timeout active."}
              </span>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center justify-center gap-2">
              <Lock className="w-3.5 h-3.5 text-red-400" />
              <span>Incognito & Private Browser Sessions Are Also Blocked by Server Security</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (registeredPending) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#030712] text-white">
        <PlexusBackground />
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md relative z-10">
          <div className="bg-[#050A18]/90 backdrop-blur-xl rounded-2xl p-8 shadow-2xl text-center border border-[#121F3D]">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FFD700] via-[#D4AF37] to-[#00F5D4] flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(255,215,0,0.5)] border border-[#FFD700]/50 text-black">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-[#FFD700] font-mono mb-2">OPERATIVE REGISTRATION COMPLETE</h2>
            <p className="text-slate-300 text-sm mb-6">
              Your account has been initialized and is pending coordinator clearance. You&apos;ll receive confirmation once clearance is granted.
            </p>
            <button onClick={() => { setIsLogin(true); resetForm(); }} className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FFD700] to-[#D4AF37] text-black font-bold font-mono text-sm hover:opacity-95 transition-all shadow-[0_0_15px_rgba(255,215,0,0.3)] cursor-pointer">
              Return to Sign In
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 lg:p-12 relative overflow-hidden bg-[#030712] text-white font-sans">
      {/* 7-Tier Rotating Chakravyuh Canvas */}
      <PlexusBackground />

      {/* Top Header */}
      <div className="relative z-10 flex items-center justify-between max-w-7xl mx-auto w-full mb-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#121F3D] bg-black/40 hover:border-[#00F5D4]/40 hover:text-[#00F5D4] transition-all font-mono text-[10px] text-zinc-400 font-bold">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Terminal
          </Link>
          <SentinalLogo animateDrawing={false} />
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-[#00F5D4] bg-black/40 px-3 py-1.5 rounded-full border border-[#00F5D4]/30 backdrop-blur">
          <Shield className="w-3.5 h-3.5 text-[#00F5D4]" />
          <span>CYBER DEFENSE GATEWAY</span>
        </div>
      </div>

      {/* Central Login Card */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5, ease: "easeOut" }} 
          className={`w-full ${isLogin ? "max-w-md" : "max-w-xl"} transition-all duration-300`}
        >
          {/* Card Wrapper */}
          <div className="bg-[#050A18]/90 backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-2xl relative border border-[#121F3D] hover:border-[#FFD700]/30 transition-all">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#FFD700] to-transparent opacity-70" />
            
            {/* Title Header */}
            <div className="text-center mb-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wider font-mono bg-gradient-to-r from-[#FFD700] via-[#F0F8FF] to-[#00F5D4] bg-clip-text text-transparent">
                CHAKRAVYUH CLUB
              </h1>
              <p className="text-xs font-mono text-[#00F5D4] uppercase tracking-widest mt-1">
                {isLogin ? "[// STRATEGIC ACCESS GATEWAY]" : "[// NEW OPERATIVE INITIALIZATION]"}
              </p>
            </div>

            {/* Tab Toggle */}
            <div className="flex gap-1 p-1 rounded-xl bg-black/60 mb-6 border border-[#121F3D]">
              <button 
                type="button"
                onClick={() => { setIsLogin(true); resetForm(); }} 
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold font-mono tracking-widest transition-all duration-200 cursor-pointer ${
                  isLogin 
                    ? "bg-gradient-to-r from-[#FFD700] to-[#D4AF37] text-black shadow-[0_0_15px_rgba(255,215,0,0.4)]" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                SIGN IN
              </button>
              <button 
                type="button"
                onClick={() => { setIsLogin(false); resetForm(); }} 
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold font-mono tracking-widest transition-all duration-200 cursor-pointer ${
                  !isLogin 
                    ? "bg-gradient-to-r from-[#FFD700] to-[#D4AF37] text-black shadow-[0_0_15px_rgba(255,215,0,0.4)]" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                REGISTER
              </button>
            </div>

            <AnimatePresence mode="wait">
              <motion.form 
                key={isLogin ? "login" : "register"} 
                initial={{ opacity: 0, x: isLogin ? -20 : 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: isLogin ? 20 : -20 }} 
                transition={{ duration: 0.3 }} 
                onSubmit={handleSubmit} 
                className="space-y-4"
              >
                {!isLogin && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[10px] font-mono text-[#FFD700] uppercase tracking-wider mb-1">Full Name</label>
                        <div className="relative">
                          <User className="w-4 h-4 text-[#00F5D4] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input type="text" placeholder="Operative Name" value={name} onChange={(e) => setName(e.target.value)} required={!isLogin} className="w-full bg-[#080E24] border border-[#121F3D] focus:border-[#FFD700] focus:outline-none rounded-xl text-xs text-white pl-11 pr-3.5 py-2.5 font-mono" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-[#FFD700] uppercase tracking-wider mb-1">Student / Employee ID</label>
                        <div className="relative">
                          <GraduationCap className="w-4 h-4 text-[#00F5D4] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input type="text" placeholder="e.g. 24CS101 or EMP101" value={studentId} onChange={(e) => setStudentId(e.target.value)} required={!isLogin} className="w-full bg-[#080E24] border border-[#121F3D] focus:border-[#FFD700] focus:outline-none rounded-xl text-xs text-white pl-11 pr-3.5 py-2.5 font-mono" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[10px] font-mono text-[#FFD700] uppercase tracking-wider mb-1">Institute</label>
                        <div className="relative">
                          <Building className="w-4 h-4 text-[#00F5D4] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <select 
                            value={institute} 
                            onChange={(e) => {
                              const newInst = e.target.value;
                              setInstitute(newInst);
                              const depts = INSTITUTE_DEPARTMENTS[newInst] || [];
                              setDepartment(depts.length > 0 ? depts[0] : "");
                            }} 
                            required={!isLogin} 
                            className="w-full bg-[#080E24] border border-[#121F3D] focus:border-[#FFD700] focus:outline-none rounded-xl text-xs text-white pl-11 pr-3.5 py-2.5 font-mono cursor-pointer"
                          >
                            <option value="" className="bg-[#050A18] text-slate-400">Select Institute...</option>
                            {INSTITUTES.map((inst) => (
                              <option key={inst} value={inst} className="bg-[#050A18] text-white">{inst}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-[#FFD700] uppercase tracking-wider mb-1">Department</label>
                        <div className="relative">
                          <Building className="w-4 h-4 text-[#00F5D4] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <select 
                            value={department} 
                            onChange={(e) => setDepartment(e.target.value)} 
                            required={!isLogin} 
                            disabled={!institute}
                            className="w-full bg-[#080E24] border border-[#121F3D] focus:border-[#FFD700] focus:outline-none rounded-xl text-xs text-white pl-11 pr-3.5 py-2.5 font-mono cursor-pointer disabled:opacity-50"
                          >
                            {!institute ? (
                              <option value="" className="bg-[#050A18]">Select Institute first</option>
                            ) : (
                              (INSTITUTE_DEPARTMENTS[institute] || []).map((dept) => (
                                <option key={dept} value={dept} className="bg-[#050A18] text-white">{dept}</option>
                              ))
                            )}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[10px] font-mono text-[#FFD700] uppercase tracking-wider mb-1">Semester (1-8)</label>
                        <div className="relative">
                          <GraduationCap className="w-4 h-4 text-[#00F5D4] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <select 
                            value={semester} 
                            onChange={(e) => setSemester(e.target.value)} 
                            className="w-full bg-[#080E24] border border-[#121F3D] focus:border-[#FFD700] focus:outline-none rounded-xl text-xs text-white pl-11 pr-3.5 py-2.5 font-mono cursor-pointer"
                          >
                            <option value="" className="bg-[#050A18] text-slate-400">Select Semester (Faculty leave blank)</option>
                            {SEMESTERS.map((sem) => (
                              <option key={sem} value={sem} className="bg-[#050A18] text-white">Semester {sem}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-[#FFD700] uppercase tracking-wider mb-1">Mobile Number (10 Digits)</label>
                        <div className="relative">
                          <Smartphone className="w-4 h-4 text-[#00F5D4] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input 
                            type="text" 
                            placeholder="10-digit mobile number" 
                            value={phone} 
                            maxLength={10}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} 
                            required={!isLogin} 
                            className="w-full bg-[#080E24] border border-[#121F3D] focus:border-[#FFD700] focus:outline-none rounded-xl text-xs text-white pl-11 pr-3.5 py-2.5 font-mono" 
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-[10px] font-mono text-[#FFD700] uppercase tracking-wider mb-1">
                    {isLogin ? "Email Address" : "College Email ID"}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#00F5D4] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input 
                      type="email" 
                      placeholder="user@chakravyuh.edu" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      required 
                      className="w-full bg-[#080E24] border border-[#121F3D] focus:border-[#FFD700] focus:outline-none rounded-xl text-xs text-white pl-11 pr-3.5 py-2.5 font-mono" 
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] font-mono text-[#FFD700] uppercase tracking-wider">Password</label>
                    {isLogin && (
                      <a href="/auth/forgot-password" className="text-[10px] text-[#00F5D4] hover:underline font-mono">
                        Forgot Password?
                      </a>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#00F5D4] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••••••" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      required 
                      minLength={6} 
                      className="w-full bg-[#080E24] border border-[#121F3D] focus:border-[#FFD700] focus:outline-none rounded-xl text-xs text-white pl-11 pr-10 py-2.5 font-mono" 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#00F5D4] transition cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-xs text-red-400 bg-red-950/60 border border-red-800/50 p-3 rounded-xl font-mono">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    {error}
                  </motion.div>
                )}

                <button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FFD700] to-[#D4AF37] text-black font-bold font-mono text-xs uppercase tracking-widest hover:opacity-95 transition-all shadow-[0_0_15px_rgba(255,215,0,0.3)] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>{isLogin ? "AUTHENTICATE GATEWAY" : "INITIALIZE OPERATIVE"}<ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </motion.form>
            </AnimatePresence>

            {/* Google OAuth Section */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#121F3D]" />
                </div>
                <div className="relative flex justify-center text-[10px] font-mono uppercase tracking-widest">
                  <span className="px-3 bg-[#050A18] text-slate-400">Or continue with</span>
                </div>
              </div>

              <div className="mt-4 flex justify-center">
                <GoogleLogin
                  onSuccess={async (credentialResponse) => {
                    if (credentialResponse.credential) {
                      setLoading(true);
                      try {
                        await loginWithGoogle(credentialResponse.credential);
                        router.push(redirectTarget);
                      } catch (err: unknown) {
                        setError(err instanceof Error ? err.message : "Google Login Failed");
                      } finally {
                        setLoading(false);
                      }
                    }
                  }}
                  onError={() => setError("Google Login Failed")}
                  theme="filled_black"
                  shape="pill"
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center py-2 text-[10px] font-mono text-zinc-500">
        © {new Date().getFullYear()} Chakravyuh Club • Strategic Defense Network
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#030712] text-[#FFD700] font-mono text-xs">
        <div className="w-8 h-8 border-2 border-[#FFD700]/30 border-t-[#FFD700] rounded-full animate-spin" />
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}

