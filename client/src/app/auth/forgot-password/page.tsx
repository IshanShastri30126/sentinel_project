"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowRight, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import PlexusBackground from "@/components/PlexusBackground";
import { SentinelLogo } from "@/components/SentinelLogo";
import { CyberButton } from "@/components/ui/CyberButton";
import { SystemLabel } from "@/components/ui/SystemLabel";
import { BorderBeam } from "@/components/effects/BorderBeam";

/**
 * ForgotPasswordPage
 *
 * Password recovery gateway allowing operatives to request an encrypted reset token.
 *
 * @returns {JSX.Element} Rendered password recovery view.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to dispatch recovery instructions.");
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
                DISPATCH COMPLETE
              </h2>
              <p className="text-slate-300 text-xs font-mono leading-relaxed">
                If an authorized account is matched with <span className="text-[#00F5D4]">{email}</span>, encrypted reset instructions have been dispatched.
              </p>
              <Link href="/auth">
                <CyberButton variant="primary" size="md" className="w-full mt-4" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                  RETURN TO SIGN IN
                </CyberButton>
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6 text-center space-y-1">
                <SystemLabel prefix="[// RECOVERY]" showDot={true}>
                  ACCESS CREDENTIAL RESTORATION
                </SystemLabel>
                <h2 className="text-xl font-bold text-white font-mono tracking-wide">
                  RESET PASSWORD
                </h2>
                <p className="font-mono text-xs text-slate-400">
                  Enter your registered institutional email to receive a recovery token.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block font-mono text-xs font-medium uppercase tracking-wider text-slate-300 mb-1">
                    EMAIL ADDRESS
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#00F5D4] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      placeholder="user@chakravyuh.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full h-10 rounded-md bg-[#050A14] border border-white/[0.12] pl-10 pr-3.5 font-mono text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00F5D4] focus:ring-1 focus:ring-[#00F5D4]/40"
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
                  isLoading={loading}
                  className="w-full mt-2"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  DISPATCH INSTRUCTIONS
                </CyberButton>

                <div className="text-center mt-6">
                  <Link
                    href="/auth"
                    className="font-mono text-xs text-slate-400 hover:text-[#00F5D4] inline-flex items-center gap-1.5 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Sign In</span>
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
