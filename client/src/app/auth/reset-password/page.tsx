"use client";

import React, { useState, useEffect, Suspense } from "react";
import { SentinalLoader } from "@/components/ui/SentinalLoader";
import { motion } from "framer-motion";
import { Lock, ArrowRight, ArrowLeft, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import PlexusBackground from "@/components/PlexusBackground";
import { SentinelLogo } from "@/components/SentinelLogo";
import { CyberButton } from "@/components/ui/CyberButton";
import { SystemLabel } from "@/components/ui/SystemLabel";
import { BorderBeam } from "@/components/effects/BorderBeam";

/**
 * ResetPasswordPageContent
 *
 * Handles resetting user password using an encrypted URL token.
 *
 * @returns {JSX.Element} Rendered password reset form.
 */
function ResetPasswordPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token. Please request a new password recovery link.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await api("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword: password }),
      });
      setSuccess(true);
      setTimeout(() => {
        router.push("/auth");
      }, 2500);
    } catch (err: any) {
      setError(err.message || "Failed to reset password. The recovery token may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#02050B] text-slate-100 font-sans">
      <PlexusBackground />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="relative rounded-xl bg-[#070D18]/95 backdrop-blur-2xl p-6 sm:p-8 border border-white/[0.12] shadow-[0_12px_40px_rgba(0,0,0,0.8),0_0_25px_rgba(0,245,212,0.08)] hud-brackets">
          <BorderBeam size={160} duration={10} />

          {/* Logo */}
          <div className="flex justify-center mb-6">
            <SentinelLogo animateDrawing={false} />
          </div>

          {success ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-cyan-500/10 border border-[#00F5D4] flex items-center justify-center mx-auto text-[#00F5D4] shadow-[0_0_20px_rgba(0,245,212,0.3)]">
                <CheckCircle className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-white font-mono uppercase tracking-wide">
                CREDENTIALS UPDATED
              </h2>
              <p className="text-slate-300 text-xs font-mono leading-relaxed">
                Your passphrase has been updated and securely re-hashed. Redirecting to gateway...
              </p>
              <Link href="/auth">
                <CyberButton variant="primary" size="md" className="w-full mt-4">
                  LOGIN NOW
                </CyberButton>
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6 text-center space-y-1">
                <SystemLabel prefix="[// SECURITY]" showDot={true}>
                  KEY ROTATION PROTOCOL
                </SystemLabel>
                <h2 className="text-xl font-bold text-white font-mono tracking-wide">
                  SET NEW PASSWORD
                </h2>
                <p className="font-mono text-xs text-slate-400">
                  Define your new high-entropy security credentials.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block font-mono text-xs font-medium uppercase tracking-wider text-slate-300 mb-1">
                    NEW PASSWORD
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#00F5D4] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full h-10 rounded-md bg-[#050A14] border border-white/[0.12] pl-10 pr-10 font-mono text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00F5D4] focus:ring-1 focus:ring-[#00F5D4]/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-xs font-medium uppercase tracking-wider text-slate-300 mb-1">
                    CONFIRM PASSWORD
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#00F5D4] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full h-10 rounded-md bg-[#050A14] border border-white/[0.12] pl-10 pr-10 font-mono text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00F5D4] focus:ring-1 focus:ring-[#00F5D4]/40"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-xs text-[#FF0055] bg-[rgba(255,0,85,0.08)] border border-[rgba(255,0,85,0.35)] p-3 rounded-md font-mono">
                    <AlertCircle className="w-4 h-4 shrink-0 text-[#FF0055]" />
                    <span>{error}</span>
                  </div>
                )}

                <CyberButton
                  type="submit"
                  variant="primary"
                  size="md"
                  glow="primary"
                  disabled={loading || !token}
                  isLoading={loading}
                  className="w-full mt-2"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  UPDATE CREDENTIALS
                </CyberButton>

                {!token && (
                  <div className="text-center mt-6">
                    <Link
                      href="/auth/forgot-password"
                      className="font-mono text-xs text-[#00F5D4] hover:underline transition-colors"
                    >
                      Request new recovery link
                    </Link>
                  </div>
                )}
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#02050B]">
          <SentinalLoader variant="card" size="lg" text="LOADING SECURITY GATEWAY..." />
        </div>
      }
    >
      <ResetPasswordPageContent />
    </Suspense>
  );
}
