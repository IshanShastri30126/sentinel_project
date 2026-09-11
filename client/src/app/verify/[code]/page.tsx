"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { 
  ShieldCheck, 
  ShieldX, 
  Shield, 
  Award, 
  Copy, 
  Check, 
  RefreshCw,
  ArrowLeft,
  Share2
} from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import { CyberButton } from "@/components/ui/CyberButton";
import { CyberBadge } from "@/components/ui/CyberBadge";
import { SystemLabel } from "@/components/ui/SystemLabel";
import { CyberCard } from "@/components/ui/CyberCard";
import { BorderBeam } from "@/components/effects/BorderBeam";

interface VerificationResult {
  valid: boolean;
  tampered?: boolean;
  certificate?: {
    id: string;
    uniqueCode: string;
    recipientName: string;
    recipientEmail?: string | null;
    eventTitle: string;
    eventDate: string;
    generatedAt: string;
    issuingAuthority?: string;
    fileUrl?: string | null;
    checksum?: string | null;
  };
}

const LinkedinIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={{ width: '1em', height: '1em' }}>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

/**
 * DecryptedText
 *
 * Simulates real-time cryptographic deciphering animation for recipient identity.
 */
const DecryptedText = ({ text, delay = 35 }: { text: string; delay?: number }) => {
  const [displayText, setDisplayText] = useState("");
  const chars = "!@#$%^&*()_+{}:<>?|[];',./~`=-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  useEffect(() => {
    if (!text) return;
    let iterations = 0;
    const interval = setInterval(() => {
      setDisplayText(
        text
          .split("")
          .map((char, index) => {
            if (index < iterations) {
              return text[index];
            }
            if (char === " ") return " ";
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("")
      );

      if (iterations >= text.length) {
        clearInterval(interval);
      }
      iterations += 1 / 4;
    }, delay);

    return () => clearInterval(interval);
  }, [text, delay]);

  return <span className="font-mono">{displayText}</span>;
};

/**
 * VerifyPage
 *
 * Cryptographic certificate authentication view validating digital signatures,
 * checksum hashes, and credential registry records.
 *
 * @returns {JSX.Element} Rendered certificate verification interface.
 */
export default function VerifyPage() {
  const params = useParams();
  const code = params.code as string;
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // 3D Card tilt states
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({});
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const verify = async () => {
      try {
        const data = await api<VerificationResult>(`/certificates/verify/${code}`);
        setResult(data);
      } catch {
        setResult({ valid: false });
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [code]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const xc = rect.width / 2;
    const yc = rect.height / 2;

    const rotateX = -((y - yc) / yc) * 10;
    const rotateY = ((x - xc) / xc) * 10;

    setCoords({ x, y });
    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
      transition: "none",
    });
  };

  const handleMouseEnter = () => setIsHovered(true);

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTiltStyle({
      transform: `perspective(1000px) rotateX(0deg) rotateY(0deg)`,
      transition: "transform 0.5s ease-out",
    });
  };

  const copyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getLinkedInShareUrl = () => {
    if (!result?.certificate || typeof window === "undefined") return "#";
    const cert = result.certificate;
    const date = cert.generatedAt ? new Date(cert.generatedAt) : new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    const verifyUrl = window.location.href;
    const name = `${cert.eventTitle} Certification`;
    const org = cert.issuingAuthority || "Chakravyuh Club";

    return `https://www.linkedin.com/profile/add?startTask=CERTIFICATION&name=${encodeURIComponent(name)}&organizationName=${encodeURIComponent(org)}&issueYear=${year}&issueMonth=${month}&certUrl=${encodeURIComponent(verifyUrl)}&certId=${encodeURIComponent(cert.uniqueCode)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#02050B] text-slate-100 gap-4">
        <RefreshCw className="w-8 h-8 text-[#00F5D4] animate-spin" />
        <p className="text-xs font-mono text-[#00F5D4] uppercase tracking-widest animate-pulse">
          CRYPTOGRAPHIC INTEGRITY VERIFICATION IN PROGRESS...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#02050B] text-slate-100 font-sans selection:bg-[#00F5D4]/20 relative overflow-x-hidden">
      {/* Universal Tactical Navigation */}
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 relative z-10">
        {/* Verification Subheader */}
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center gap-2 bg-[#070D18] border border-cyan-500/30 px-3.5 py-1.5 rounded-full">
            <Shield className="w-4 h-4 text-[#00F5D4] animate-pulse" />
            <span className="text-xs font-mono font-bold tracking-widest text-[#00F5D4] uppercase">
              CHAKRAVYUH TRUST VERIFICATION UNIT
            </span>
          </div>
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            SECURE CREDENTIAL VALIDATION NETWORK
          </p>
        </div>

        {/* Verification Body */}
        <div className="space-y-6">
          {result?.valid && result.certificate ? (
            <>
              {/* Interactive 3D Holographic Card */}
              <div
                onMouseMove={handleMouseMove}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                style={tiltStyle}
                className="relative overflow-hidden cursor-pointer w-full aspect-[8/5.3] max-w-lg mx-auto rounded-2xl border border-cyan-500/30 shadow-[0_0_35px_rgba(0,245,212,0.15)] bg-gradient-to-br from-[#0B1526] via-[#070D18] to-[#040810] p-6 sm:p-8 flex flex-col justify-between select-none hud-brackets"
              >
                {/* Spotlight shine */}
                {isHovered && (
                  <div
                    className="absolute inset-0 pointer-events-none z-20"
                    style={{
                      background: `radial-gradient(circle 200px at ${coords.x}px ${coords.y}px, rgba(0, 245, 212, 0.12), transparent 80%)`,
                    }}
                  />
                )}

                {/* Laser scanline */}
                <div
                  className="absolute left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#00F5D4] to-transparent shadow-[0_0_8px_#00F5D4] pointer-events-none z-10"
                  style={{
                    animation: "laser-sweep 4s linear infinite",
                  }}
                />

                {/* Top Border Accent */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00F5D4] via-[#00E1FF] to-[#00F5D4] opacity-80" />

                {/* Card Header */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#00F5D4]" />
                    <span className="text-[11px] font-mono font-bold text-[#00F5D4] uppercase tracking-widest">
                      AUTHENTIC CERTIFICATE
                    </span>
                  </div>
                  <Award className="w-7 h-7 text-[#00E1FF]/70" />
                </div>

                {/* Card Core Info */}
                <div className="my-auto space-y-2">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">
                      CREDENTIAL HOLDER
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white capitalize">
                      <DecryptedText text={result.certificate.recipientName} />
                    </h2>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">
                      RECOGNITION OF PARTICIPATION / EXCELLENCE
                    </span>
                    <p className="text-xs sm:text-sm font-mono text-[#00F5D4] font-bold uppercase tracking-wide truncate">
                      {result.certificate.eventTitle}
                    </p>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="flex justify-between items-end border-t border-white/[0.08] pt-3">
                  <div>
                    <span className="text-[8px] font-mono text-slate-500 uppercase">DATE ISSUED</span>
                    <p className="text-[10px] font-mono text-slate-300">
                      {new Date(result.certificate.eventDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }).toUpperCase()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] font-mono text-slate-500 uppercase">VERIFICATION HASH</span>
                    <p className="text-[10px] font-mono text-[#00F5D4] font-bold">
                      {result.certificate.uniqueCode}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Toolkit */}
              <div className="rounded-xl bg-[#070D18] border border-white/[0.08] p-6 space-y-5 max-w-lg mx-auto">
                <div className="text-center space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-xs font-mono text-[#00F5D4] bg-[rgba(0,245,212,0.08)] px-3 py-1 rounded-full border border-[rgba(0,245,212,0.25)]">
                    <Check className="w-3.5 h-3.5" />
                    <span>CRYPTOGRAPHIC SIGNATURE VALIDATED</span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-1">
                    This credential has been digitally signed and validated against the Chakravyuh vault.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-mono bg-[#050A14] p-3.5 rounded-lg border border-white/[0.06]">
                  <div>
                    <span className="text-slate-500 text-[10px] block">ISSUING AUTHORITY:</span>
                    <p className="text-slate-200 font-bold">{result.certificate.issuingAuthority || "Chakravyuh Council"}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">TIMESTAMP:</span>
                    <p className="text-slate-200 font-bold">{new Date(result.certificate.generatedAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <CyberButton
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={copyLink}
                    leftIcon={copied ? <Check className="w-3.5 h-3.5 text-[#00F5D4]" /> : <Copy className="w-3.5 h-3.5" />}
                  >
                    {copied ? "LINK COPIED" : "COPY VERIFY LINK"}
                  </CyberButton>

                  <a
                    href={getLinkedInShareUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full"
                  >
                    <CyberButton
                      variant="primary"
                      size="sm"
                      className="w-full bg-[#0077b5] text-white hover:bg-[#006295] border-[#0091db]"
                      leftIcon={<LinkedinIcon className="w-3.5 h-3.5" />}
                    >
                      ADD TO LINKEDIN
                    </CyberButton>
                  </a>
                </div>
              </div>
            </>
          ) : (
            /* Invalid or Tampered Result */
            <div className="max-w-md mx-auto p-8 text-center rounded-xl bg-[#0F050A] border border-[rgba(255,0,85,0.3)] shadow-[0_0_30px_rgba(255,0,85,0.15)] space-y-4">
              <div className="w-16 h-16 rounded-full bg-[rgba(255,0,85,0.1)] flex items-center justify-center mx-auto border border-[rgba(255,0,85,0.3)] text-[#FF0055]">
                <ShieldX className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-bold text-[#FF0055] font-mono uppercase tracking-wider">
                VERIFICATION FAILURE
              </h2>
              <p className="text-xs text-slate-300 font-mono leading-relaxed">
                {result?.tampered
                  ? "CRITICAL ALERT: THE DIGITAL CHECKSUM DOES NOT MATCH RECORDED VAULT STATE. TAMPERING DETECTED."
                  : "NO CREDENTIAL CORRESPONDING TO THIS UNIQUE IDENTIFIER WAS DISCOVERED IN THE SECURE REPOSITORY."}
              </p>
              <div className="text-[10px] font-mono text-slate-500 bg-black/40 p-2.5 rounded border border-white/[0.06]">
                IDENTIFIER CODE: {code}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Universal Tactical Footer */}
      <Footer />

      <style jsx global>{`
        @keyframes laser-sweep {
          0% { top: 0%; opacity: 0; }
          5% { opacity: 1; }
          95% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
