"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Shield, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle, 
  Smartphone, 
  Building, 
  GraduationCap, 
  ShieldAlert,
  Briefcase
} from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import PlexusBackground from "@/components/PlexusBackground";
import { SentinalLogo } from "@/components/SentinalLogo";
import { api } from "@/lib/api";
import { CyberButton } from "@/components/ui/CyberButton";
import { CyberCard } from "@/components/ui/CyberCard";
import { CyberBadge } from "@/components/ui/CyberBadge";
import { SystemLabel } from "@/components/ui/SystemLabel";
import { BorderBeam } from "@/components/effects/BorderBeam";

export const INSTITUTES = ["CSPIT", "DEPSTAR", "PDPIAS", "CMPICA", "IIIM"] as const;

export const INSTITUTE_DEPARTMENTS: Record<string, string[]> = {
  CSPIT: ["CE", "IT", "CSE", "ME", "CL", "EC", "AIML", "ELECTRICAL"],
  DEPSTAR: ["CSE", "CE", "IT"],
  IIIM: ["MBA", "BBA"],
  CMPICA: ["BSC.IT", "BCA"],
  PDPIAS: ["MATHS", "BIOSCIENCE", "CHEMISTRY", "PHYSICS"],
};

export const SEMESTERS = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;

/**
 * LoginPageContent
 *
 * Handles user authentication (Sign In) and operative enlistment (Sign Up).
 * Supports role-based registration separating Faculty (Employee ID, no semester)
 * and Student profiles, strict 10-digit numeric phone sanitization, and server
 * rate-limit defense lockouts.
 *
 * @returns {JSX.Element} Rendered authentication gateway.
 */
function LoginPageContent() {
  const { login, loginWithGoogle, register, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams?.get("redirect") || "/dashboard";

  const [isLogin, setIsLogin] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [identifier, setIdentifier] = useState(""); // Student ID or Employee ID
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [institute, setInstitute] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registeredPending, setRegisteredPending] = useState(false);

  // Rate Limiting Block State
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockRemainingSec, setBlockRemainingSec] = useState(0);
  const [blockTier, setBlockTier] = useState<1 | 2>(1);
  const [blockMessage, setBlockMessage] = useState("");

  /**
   * checkBlockStatus
   *
   * Queries the server rate-limit endpoint to verify whether the client IP or target account
   * has triggered a brute-force block.
   *
   * @param {string} [targetEmail] - Optional target email address.
   */
  const checkBlockStatus = async (targetEmail?: string) => {
    try {
      const query = targetEmail ? `?email=${encodeURIComponent(targetEmail)}` : "";
      const status = await api<{ blocked?: boolean; remainingSeconds?: number; tier?: 1 | 2; message?: string }>(
        `/auth/login-status${query}`
      );
      if (status.blocked) {
        setIsBlocked(true);
        setBlockRemainingSec(status.remainingSeconds || 1200);
        setBlockTier(status.tier || 1);
        setBlockMessage(status.message || "Login access blocked due to multiple failed attempts.");
      } else {
        setIsBlocked(false);
        setBlockRemainingSec(0);
      }
    } catch (err) {
      console.warn("Failed to check rate limit block status", err);
    }
  };

  // Check IP block status on initial load or when switching to Sign In tab
  useEffect(() => {
    if (isLogin) {
      checkBlockStatus();
    }
  }, [isLogin]);

  // Debounced check only when user enters a valid email address
  useEffect(() => {
    if (!isLogin || !email) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) return;

    const debounceTimer = setTimeout(() => {
      checkBlockStatus(email.trim());
    }, 800);

    return () => clearTimeout(debounceTimer);
  }, [email, isLogin]);

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
    if (hrs > 0) return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    return `${pad(mins)}:${pad(secs)}`;
  };

  // Club namespace support
  const [clubs, setClubs] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [selectedClubId, setSelectedClubId] = useState("");

  useEffect(() => {
    async function loadClubs() {
      try {
        const data = await api<{ clubs: Array<{ id: string; name: string; slug: string }> }>("/clubs");
        setClubs(data.clubs || []);
        if (data.clubs && data.clubs.length > 0) {
          setSelectedClubId(data.clubs[0].id);
        }
      } catch (err) {
        console.warn("Clubs load notice:", err);
      }
    }
    loadClubs();
  }, []);

  useEffect(() => {
    if (user && (user.isApproved || user.role === "GUEST")) {
      router.push(redirectTarget);
    }
  }, [user, router, redirectTarget]);

  /**
   * handleSubmit
   *
   * Validates form credentials, enforces exactly 10 digits for mobile numbers,
   * passes employeeId vs studentId depending on role, and initiates authentication.
   *
   * @param {React.FormEvent} e - Form submission event.
   */
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
        // Enforce strict 10-digit mobile constraint
        if (!/^\d{10}$/.test(phone)) {
          throw new Error("Mobile number must contain exactly 10 integer digits (no letters or symbols).");
        }

        await register(name, email, password, {
          studentId: identifier,
          phone,
          department,
          institute,
          ...(selectedClubId ? { clubId: selectedClubId } : {})
        });
        setRegisteredPending(true);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication request failed.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setError("");
    setEmail("");
    setPassword("");
    setName("");
    setIdentifier("");
    setPhone("");
    setDepartment("");
    setInstitute("");
    setRegisteredPending(false);
  };

  // Lockout Screen
  if (isBlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#02050B] text-slate-100 font-mono">
        <PlexusBackground />
        <div className="w-full max-w-lg relative z-10">
          <CyberCard variant="panel" className="bg-[#0D0408]/95 border-red-500/50 p-8 text-center shadow-[0_0_50px_rgba(255,0,85,0.25)]">
            <div className="w-16 h-16 rounded-full bg-red-950/80 border border-red-500 flex items-center justify-center mx-auto mb-5 shadow-[0_0_25px_rgba(255,0,85,0.4)]">
              <ShieldAlert className="w-8 h-8 text-[#FF0055]" />
            </div>

            <CyberBadge variant="danger" dot={true} pulseDot={true} className="mb-3">
              SECURITY LOCKOUT IN EFFECT
            </CyberBadge>

            <h2 className="text-xl sm:text-2xl font-black text-white font-mono mb-2 tracking-wider">
              {blockTier === 1 ? "20-MINUTE ACCESS BLOCK" : "5-HOUR MAXIMUM LOCKOUT"}
            </h2>

            <p className="text-slate-300 text-xs mb-6 max-w-md mx-auto leading-relaxed">
              {blockMessage || "Multiple failed authentication attempts detected. Access has been quarantined by server rate-limiting security."}
            </p>

            <div className="bg-black/80 border border-red-500/30 rounded-lg p-5 mb-5">
              <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase block mb-1">
                TIME REMAINING UNTIL UNLOCK
              </span>
              <div className="text-3xl sm:text-4xl font-black text-[#FF0055] font-mono tracking-wider">
                {formatTimer(blockRemainingSec)}
              </div>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center justify-center gap-2">
              <Lock className="w-3.5 h-3.5 text-[#FF0055]" />
              <span>IP & session credentials strictly monitored.</span>
            </div>
          </CyberCard>
        </div>
      </div>
    );
  }

  // Registration Pending Clearance Screen
  if (registeredPending) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#02050B] text-slate-100 font-sans">
        <PlexusBackground />
        <div className="w-full max-w-md relative z-10">
          <CyberCard variant="hud" className="p-8 text-center bg-[#070D18]/95 border-cyan-500/30 shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-cyan-500/10 border border-[#00F5D4] flex items-center justify-center mx-auto mb-4 text-[#00F5D4] shadow-[0_0_20px_rgba(0,245,212,0.3)]">
              <CheckCircle className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-[#00F5D4] font-mono mb-2 uppercase tracking-wide">
              OPERATIVE REGISTRATION COMPLETE
            </h2>
            <p className="text-slate-300 text-xs mb-6 font-mono leading-relaxed">
              Your credentials have been recorded. Account access is currently pending administrative clearance by the SENTINAL security council.
            </p>
            <CyberButton
              variant="primary"
              size="md"
              className="w-full"
              onClick={() => { setIsLogin(true); resetForm(); }}
            >
              RETURN TO GATEWAY
            </CyberButton>
          </CyberCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 lg:p-10 relative overflow-hidden bg-[#02050B] text-slate-100 font-sans">
      {/* Dimmed Background Canvas */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-25">
        <PlexusBackground />
      </div>

      {/* Top Header Bar */}
      <div className="relative z-10 flex items-center justify-between max-w-6xl mx-auto w-full mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-white/10 bg-black/40 hover:border-[#00F5D4]/40 hover:text-[#00F5D4] transition-all font-mono text-xs text-slate-400 font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>RETURN TO PORTAL</span>
        </Link>
        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-[#00F5D4] bg-[#070D18]/80 px-3 py-1.5 rounded border border-cyan-500/30 backdrop-blur">
          <Shield className="w-3.5 h-3.5 text-[#00F5D4]" />
          <span>SECURE AUTHENTICATION GATEWAY</span>
        </div>
      </div>

      {/* Center Auth Window */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={`w-full ${isLogin ? "max-w-md" : "max-w-xl"} transition-all duration-300`}
        >
          <div className="relative rounded-lg bg-[#070E1A] p-6 sm:p-8 border border-[#1E293B] shadow-[0_12px_40px_rgba(0,0,0,0.9),0_0_20px_rgba(0,245,212,0.06)] hud-brackets">
            <BorderBeam size={180} duration={12} />

            {/* Header Identity */}
            <div className="text-center mb-6">
              <div className="flex justify-center mb-3">
                <SentinalLogo animateDrawing={false} />
              </div>
              <SystemLabel prefix="[// AUTH.GATEWAY]" showDot={true}>
                {isLogin ? "IDENTITY VERIFICATION" : "NEW OPERATIVE REGISTRATION"}
              </SystemLabel>
            </div>

            {/* Form Mode Toggle */}
            <div className="flex p-1 rounded-lg bg-[#040810] border border-white/[0.08] mb-6">
              <span
                role="button"
                tabIndex={0}
                onClick={() => { setIsLogin(true); resetForm(); }}
                className={`flex-1 py-2 text-center rounded-md font-mono text-xs font-bold uppercase tracking-wider cursor-pointer transition-all duration-200 ${
                  isLogin
                    ? "bg-gradient-to-r from-[#00F5D4] to-[#00E1FF] text-black shadow-[0_0_12px_rgba(0,245,212,0.3)]"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                SIGN IN
              </span>
              <span
                role="button"
                tabIndex={0}
                onClick={() => { setIsLogin(false); resetForm(); }}
                className={`flex-1 py-2 text-center rounded-md font-mono text-xs font-bold uppercase tracking-wider cursor-pointer transition-all duration-200 ${
                  !isLogin
                    ? "bg-gradient-to-r from-[#00F5D4] to-[#00E1FF] text-black shadow-[0_0_12px_rgba(0,245,212,0.3)]"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                SIGN UP
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Registration Fields */}
              {!isLogin && (
                <div className="space-y-4">

                  {/* Name and Identifier */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-mono text-xs font-medium uppercase tracking-wider text-slate-300 mb-1">
                        FULL NAME
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-[#00F5D4] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Operative Name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required={!isLogin}
                          className="w-full h-10 rounded-md bg-[#050A14] border border-white/[0.12] pl-10 pr-3.5 font-mono text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00F5D4] focus:ring-1 focus:ring-[#00F5D4]/40"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-mono text-xs font-medium uppercase tracking-wider text-slate-300 mb-1">
                        STUDENT ID
                      </label>
                      <div className="relative">
                        <GraduationCap className="w-4 h-4 text-[#00F5D4] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="e.g. 24DCS101"
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          required={!isLogin}
                          className="w-full h-10 rounded-md bg-[#050A14] border border-white/[0.12] pl-10 pr-3.5 font-mono text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00F5D4] focus:ring-1 focus:ring-[#00F5D4]/40"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Institute and Department */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-mono text-xs font-medium uppercase tracking-wider text-slate-300 mb-1">
                        INSTITUTE
                      </label>
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
                          className="w-full h-10 rounded-md bg-[#050A14] border border-white/[0.12] pl-10 pr-3.5 font-mono text-xs text-white focus:outline-none focus:border-[#00F5D4] cursor-pointer"
                        >
                          <option value="" className="bg-[#050A14] text-slate-500">Select Institute...</option>
                          {INSTITUTES.map((inst) => (
                            <option key={inst} value={inst} className="bg-[#050A14] text-white">
                              {inst}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-mono text-xs font-medium uppercase tracking-wider text-slate-300 mb-1">
                        DEPARTMENT
                      </label>
                      <div className="relative">
                        <Building className="w-4 h-4 text-[#00F5D4] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <select
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          required={!isLogin}
                          disabled={!institute}
                          className="w-full h-10 rounded-md bg-[#050A14] border border-white/[0.12] pl-10 pr-3.5 font-mono text-xs text-white focus:outline-none focus:border-[#00F5D4] cursor-pointer disabled:opacity-50"
                        >
                          {!institute ? (
                            <option value="" className="bg-[#050A14]">Select Institute first</option>
                          ) : (
                            (INSTITUTE_DEPARTMENTS[institute] || []).map((dept) => (
                              <option key={dept} value={dept} className="bg-[#050A14] text-white">
                                {dept}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Number */}
                  <div className="grid grid-cols-1 gap-3">

                    <div>
                      <label className="block font-mono text-xs font-medium uppercase tracking-wider text-slate-300 mb-1">
                        MOBILE NUMBER (EXACTLY 10 DIGITS)
                      </label>
                      <div className="relative">
                        <Smartphone className="w-4 h-4 text-[#00F5D4] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={10}
                          placeholder="9876543210"
                          value={phone}
                          onChange={(e) => {
                            // Strict constraint: exactly integers, no characters
                            const sanitized = e.target.value.replace(/\D/g, "").slice(0, 10);
                            setPhone(sanitized);
                          }}
                          required={!isLogin}
                          className="w-full h-10 rounded-md bg-[#050A14] border border-white/[0.12] pl-10 pr-3.5 font-mono text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00F5D4] focus:ring-1 focus:ring-[#00F5D4]/40"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Email Address */}
              <div>
                <label className="block font-mono text-xs font-medium uppercase tracking-wider text-slate-300 mb-1">
                  EMAIL ADDRESS
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#00F5D4] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    placeholder="operative@sentinal.defense"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full h-10 rounded-md bg-[#050A14] border border-white/[0.12] pl-10 pr-3.5 font-mono text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00F5D4] focus:ring-1 focus:ring-[#00F5D4]/40"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block font-mono text-xs font-medium uppercase tracking-wider text-slate-300">
                    PASSWORD
                  </label>
                  {isLogin && (
                    <Link
                      href="/auth/forgot-password"
                      className="font-mono text-xs text-[#00F5D4] hover:underline cursor-pointer"
                    >
                      Forgot Password?
                    </Link>
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
                    className="w-full h-10 rounded-md bg-[#050A14] border border-white/[0.12] pl-10 pr-10 font-mono text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00F5D4] focus:ring-1 focus:ring-[#00F5D4]/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-xs text-[#FF0055] bg-[rgba(255,0,85,0.08)] border border-[rgba(255,0,85,0.35)] p-3 rounded-md font-mono">
                  <AlertCircle className="w-4 h-4 shrink-0 text-[#FF0055]" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit CTA */}
              <CyberButton
                type="submit"
                variant="primary"
                size="md"
                glow="primary"
                isLoading={loading}
                className="w-full mt-2"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {isLogin ? "AUTHENTICATE GATEWAY" : "INITIALIZE OPERATIVE"}
              </CyberButton>
            </form>

            {/* Clickable Text Toggle between Sign In / Sign Up (strict non-button convention) */}
            <div className="mt-4 text-center font-mono text-xs text-slate-400">
              {isLogin ? (
                <span>
                  New operative requiring credentials?{" "}
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={() => { setIsLogin(false); resetForm(); }}
                    className="text-[#00F5D4] hover:underline cursor-pointer font-bold"
                  >
                    Sign Up
                  </span>
                </span>
              ) : (
                <span>
                  Already hold operative clearance?{" "}
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={() => { setIsLogin(true); resetForm(); }}
                    className="text-[#00F5D4] hover:underline cursor-pointer font-bold"
                  >
                    Sign In
                  </span>
                </span>
              )}
            </div>

            {/* Google OAuth Section */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/[0.08]" />
                </div>
                <div className="relative flex justify-center text-[10px] font-mono uppercase tracking-widest">
                  <span className="px-3 bg-[#070D18] text-slate-500">
                    OR FEDERATED ACCESS
                  </span>
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
                        setError(err instanceof Error ? err.message : "Federated authentication failed.");
                      } finally {
                        setLoading(false);
                      }
                    }
                  }}
                  onError={() => setError("Federated authentication failed.")}
                  theme="filled_black"
                  shape="pill"
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer watermark */}
      <div className="relative z-10 text-center py-2 font-mono text-[10px] text-slate-500">
        © {new Date().getFullYear()} SENTINAL Cyber Defense Operations Hub • Defense Network • TLS 1.3 Certified
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#02050B] text-[#00F5D4] font-mono text-xs">
          <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-[#00F5D4] rounded-full animate-spin" />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
