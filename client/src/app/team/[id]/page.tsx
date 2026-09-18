"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  User, 
  Calendar, 
  IdCard, 
  Building, 
  Share2, 
  Link2, 
  ShieldAlert, 
  Check 
} from "lucide-react";
import { api, getFileUrl } from "@/lib/api";
import { FALLBACK_TEAM_CADRE, formatSocialUrl, formatPhoneNumber, getTeamRoleGroup, getTeamRoleLabel } from "@/lib/fallbackTeam";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import { ProfileCard } from "@/components/ProfileCard";
import { CyberButton } from "@/components/ui/CyberButton";
import { CyberBadge } from "@/components/ui/CyberBadge";
import { SystemLabel } from "@/components/ui/SystemLabel";
import { CyberCard } from "@/components/ui/CyberCard";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  designation?: string;
  department?: string;
  email?: string;
  phone?: string;
  studentId?: string;
  employeeId?: string;
  joinedDate?: string;
  about?: string;
  imageUrl?: string;
  avatarUrl?: string;
  coverPosterUrl?: string;
  linkedin?: string;
  github?: string;
  instagram?: string;
  cyberName?: string;
  cyberBackstory?: string;
  cyberAvatarUrl?: string;
  cyberSpecialAbility?: string;
}

const GithubIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ width: '1em', height: '1em' }}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const LinkedinIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ width: '1em', height: '1em' }}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const InstagramIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ width: "1em", height: "1em" }}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

/**
 * MemberProfilePage
 *
 * Tactical operative dossier displaying service records, clearance tier,
 * role-based profile management (Employee ID for Faculty, Student ID for students),
 * and interactive 3D credential holographic card.
 *
 * @returns {JSX.Element} Rendered operative profile dossier.
 */
export default function MemberProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [member, setMember] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [headerImgFailed, setHeaderImgFailed] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  useEffect(() => {
    const fetchMember = async () => {
      try {
        const res = await api<{ team: TeamMember[] }>("/settings/landing-team");
        const list = Array.isArray(res.team) ? res.team : FALLBACK_TEAM_CADRE;
        const found = list.find((m: TeamMember) => m.id === id);
        if (found) {
          setMember(found);
        } else {
          const fallbackFound = FALLBACK_TEAM_CADRE.find((m) => m.id === id);
          if (fallbackFound) setMember(fallbackFound as TeamMember);
        }
      } catch (err) {
        console.warn("[MemberProfilePage] Remote dossier unavailable, utilizing secure cache:", err);
        const found = FALLBACK_TEAM_CADRE.find((m) => m.id === id);
        if (found) setMember(found as TeamMember);
      } finally {
        setLoading(false);
      }
    };
    fetchMember();
  }, [id]);

  const handleShare = () => {
    const profileUrl = typeof window !== "undefined" ? window.location.href : "";
    navigator.clipboard.writeText(profileUrl);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const handleSaveLink = () => {
    const profileUrl = typeof window !== "undefined" ? window.location.href : "";
    navigator.clipboard.writeText(profileUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#02050B] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-[#00F5D4] rounded-full animate-spin" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-[#02050B] text-slate-100 flex flex-col items-center justify-center gap-4 font-mono">
        <ShieldAlert className="w-12 h-12 text-[#FF0055] animate-bounce" />
        <h2 className="text-base uppercase tracking-widest text-[#FF0055]">
          OPERATIVE DOSSIER NOT FOUND
        </h2>
        <Link href="/team">
          <CyberButton variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            RETURN TO CADRE
          </CyberButton>
        </Link>
      </div>
    );
  }

  const skillLines = member.about ? member.about.split("\n").filter((l: string) => l.trim().length > 0) : [];
  const isFaculty = getTeamRoleGroup(member.role) === "faculty";
  const identifierCode = isFaculty ? (member.employeeId || member.studentId) : member.studentId;
  const sanitizedPhone = formatPhoneNumber(member.phone);

  return (
    <div className="min-h-screen bg-[#02050B] text-slate-100 font-sans relative selection:bg-[#00F5D4]/20 overflow-x-hidden">
      {/* Universal Tactical Navigation */}
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 relative z-10 space-y-6">
        {/* Back Link */}
        <div className="flex items-center">
          <button
            onClick={() => {
              if (typeof window !== "undefined" && window.history.length > 1) {
                router.back();
              } else {
                router.push("/team");
              }
            }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-[#070D18] hover:bg-[#00F5D4]/10 border border-white/10 hover:border-[#00F5D4]/50 text-slate-300 hover:text-[#00F5D4] text-xs font-mono uppercase tracking-wider transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#00F5D4]" />
            <span>BACK TO CADRE</span>
          </button>
        </div>

        {/* Hero Card Container */}
        <div className="rounded-xl border border-white/[0.08] bg-[#070D18]/90 backdrop-blur-md overflow-hidden relative shadow-2xl">
          {/* Cover Poster Banner */}
          <div className="h-44 w-full bg-[#050A14] overflow-hidden relative border-b border-white/[0.08]">
            {member.coverPosterUrl ? (
              <img src={getFileUrl(member.coverPosterUrl)} alt="Cover Banner" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#040810] via-[#070D18] to-[#040810] relative flex items-center justify-center">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,245,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,245,212,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />
              </div>
            )}
          </div>

          {/* Profile Header Overlay */}
          <div className="p-6 relative flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-16 sm:-mt-12 z-10">
            <div className="w-28 h-28 rounded-full border-4 border-[#070D18] bg-[#050A14] overflow-hidden shadow-2xl relative shrink-0">
              {(member.imageUrl || member.avatarUrl || member.cyberAvatarUrl) && !headerImgFailed ? (
                <img
                  src={getFileUrl(member.imageUrl || member.avatarUrl || member.cyberAvatarUrl)}
                  alt={member.name}
                  onError={() => setHeaderImgFailed(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center relative overflow-hidden bg-[#050A14]">
                  <img
                    src="/images/cyber_avatar.png"
                    alt="Operative"
                    className="w-20 h-20 object-contain opacity-85"
                  />
                </div>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl font-black font-mono tracking-tight text-white">{member.name}</h1>
                <CyberBadge variant="normal" size="sm">
                  {getTeamRoleLabel(member.role).toUpperCase()}
                </CyberBadge>
              </div>
              <p className="text-xs font-mono text-[#00F5D4] font-semibold uppercase">{member.designation}</p>
              {member.department && (
                <p className="text-[11px] font-mono text-slate-400">{member.department}</p>
              )}
            </div>
          </div>
        </div>

        {/* 2-Column Dossier Layout */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Left Column: Mission Briefing & Biography */}
          <div className="md:col-span-3 space-y-6">
            <CyberCard variant="panel" className="p-6 bg-[#070D18] border-white/[0.08] space-y-4">
              <SystemLabel prefix="[// DOSSIER]" showDot={true}>
                OPERATIVE BRIEFING & SPECIALTIES
              </SystemLabel>

              {skillLines.length === 0 ? (
                <p className="text-sm text-slate-300 leading-relaxed font-sans">
                  {member.about || "No additional technical dossier recorded for this operative."}
                </p>
              ) : (
                <div className="space-y-3">
                  {skillLines.map((line: string, index: number) => {
                    const colonIdx = line.indexOf(":");
                    if (colonIdx !== -1) {
                      const boldPart = line.substring(0, colonIdx + 1);
                      const normPart = line.substring(colonIdx + 1);
                      return (
                        <div key={index} className="text-xs font-mono leading-relaxed text-slate-300 flex items-start gap-2">
                          <span className="text-[#00F5D4] font-mono select-none mt-0.5 shrink-0">{"//"}</span>
                          <span>
                            <strong className="text-white font-semibold">{boldPart}</strong>
                            {normPart}
                          </span>
                        </div>
                      );
                    }
                    return (
                      <div key={index} className="text-xs font-mono leading-relaxed text-slate-300 flex items-start gap-2">
                        <span className="text-[#00F5D4] font-mono select-none mt-0.5 shrink-0">{"//"}</span>
                        <span>{line}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CyberCard>

            {/* Cyber Operative Profile (Lore & Tactical Ability) */}
            {(member.cyberName || member.cyberSpecialAbility || member.cyberBackstory) && (
              <CyberCard variant="panel" className="p-6 bg-[#070D18] border-white/[0.08] space-y-4">
                <SystemLabel prefix="[// TACTICAL]" showDot={true}>
                  CYBER OPERATIVE PROFILE
                </SystemLabel>
                <div className="space-y-3 font-mono text-xs">
                  {member.cyberName && (
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                      <span className="text-slate-400 uppercase text-[10px]">Callsign</span>
                      <span className="text-[#00F5D4] font-bold tracking-wider">{member.cyberName}</span>
                    </div>
                  )}
                  {member.cyberSpecialAbility && (
                    <div className="border-b border-white/[0.06] pb-2 space-y-1">
                      <span className="text-slate-400 uppercase text-[10px] block">Special Ability / Tactical Focus</span>
                      <span className="text-white font-semibold">{member.cyberSpecialAbility}</span>
                    </div>
                  )}
                  {member.cyberBackstory && (
                    <div className="pt-1 space-y-1">
                      <span className="text-slate-400 uppercase text-[10px] block">Tactical Briefing</span>
                      <p className="text-slate-300 leading-relaxed font-sans text-xs">{member.cyberBackstory}</p>
                    </div>
                  )}
                </div>
              </CyberCard>
            )}
          </div>

          {/* Right Column: Holographic ID Card & Telemetry */}
          <div className="md:col-span-2 space-y-6">
            {/* Holographic 3D Card */}
            <div className="flex justify-center">
              <ProfileCard
                name={member.name}
                title={member.designation || member.role}
                handle={identifierCode || member.id || "operative"}
                status="Active Clearance"
                contactText="Send Mail"
                avatarUrl={
                  member.avatarUrl || member.imageUrl || member.cyberAvatarUrl
                    ? getFileUrl(member.avatarUrl || member.imageUrl || member.cyberAvatarUrl)
                    : "/images/cyber_avatar.png"
                }
                miniAvatarUrl={
                  member.avatarUrl || member.imageUrl || member.cyberAvatarUrl
                    ? getFileUrl(member.avatarUrl || member.imageUrl || member.cyberAvatarUrl)
                    : "/images/cyber_avatar.png"
                }
                showUserInfo={true}
                enableTilt={true}
                behindGlowEnabled={true}
                behindGlowColor="rgba(0, 245, 212, 0.45)"
                innerGradient="linear-gradient(145deg, rgba(0, 245, 212, 0.12) 0%, rgba(4, 9, 18, 0.96) 50%, rgba(2, 5, 12, 0.98) 100%)"
                onContactClick={() => {
                  if (member.email) window.location.href = `mailto:${member.email}`;
                }}
              />
            </div>

            {/* Member Info Card */}
            <div className="rounded-xl border border-white/[0.08] bg-[#070D18] p-5 space-y-3 font-mono text-xs">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                {"// SERVICE RECORD"}
              </h3>

              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-[#00F5D4] shrink-0" />
                <div>
                  <p className="text-[9px] uppercase text-slate-500">Classification</p>
                  <p className="text-white uppercase font-bold">{getTeamRoleLabel(member.role)}</p>
                </div>
              </div>

              {member.department && (
                <div className="flex items-center gap-3">
                  <Building className="w-4 h-4 text-[#00F5D4] shrink-0" />
                  <div>
                    <p className="text-[9px] uppercase text-slate-500">Department</p>
                    <p className="text-white uppercase">{member.department}</p>
                  </div>
                </div>
              )}

              {member.joinedDate && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-[#00F5D4] shrink-0" />
                  <div>
                    <p className="text-[9px] uppercase text-slate-500">Commission Date</p>
                    <p className="text-white">{member.joinedDate}</p>
                  </div>
                </div>
              )}

              {/* Role-based identifier constraint: Employee ID for Faculty, Student ID for others */}
              {identifierCode && (
                <div className="flex items-center gap-3">
                  <IdCard className="w-4 h-4 text-[#00F5D4] shrink-0" />
                  <div>
                    <p className="text-[9px] uppercase text-slate-500">
                      {isFaculty ? "Employee ID" : "Student ID"}
                    </p>
                    <p className="text-white font-bold">{identifierCode}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Contact Channels */}
            {(member.email || sanitizedPhone || member.linkedin || member.github || member.instagram) && (
              <div className="rounded-xl border border-white/[0.08] bg-[#070D18] p-5 space-y-3 font-mono text-xs">
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                  {"// SECURE CONTACT"}
                </h3>

                {member.email && (
                  <div className="flex items-center gap-3 truncate">
                    <Mail className="w-4 h-4 text-[#00F5D4] shrink-0" />
                    <div className="truncate">
                      <p className="text-[9px] uppercase text-slate-500">Email</p>
                      <a href={`mailto:${member.email.trim()}`} className="text-white hover:text-[#00F5D4] transition break-all">
                        {member.email}
                      </a>
                    </div>
                  </div>
                )}

                {sanitizedPhone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-[#00F5D4] shrink-0" />
                    <div>
                      <p className="text-[9px] uppercase text-slate-500">Secure Line (10-Digit)</p>
                      <a href={`tel:${sanitizedPhone}`} className="text-white hover:text-[#00F5D4] transition font-mono">
                        {sanitizedPhone}
                      </a>
                    </div>
                  </div>
                )}

                {member.linkedin && (
                  <div className="flex items-center gap-3 truncate">
                    <LinkedinIcon className="w-4 h-4 text-[#00F5D4] shrink-0" />
                    <div className="truncate">
                      <p className="text-[9px] uppercase text-slate-500">LinkedIn</p>
                      <a
                        href={formatSocialUrl("linkedin", member.linkedin)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white hover:text-[#00F5D4] transition truncate block font-mono"
                      >
                        {member.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, "").replace(/\/$/, "")}
                      </a>
                    </div>
                  </div>
                )}

                {member.github && (
                  <div className="flex items-center gap-3 truncate">
                    <GithubIcon className="w-4 h-4 text-[#00F5D4] shrink-0" />
                    <div className="truncate">
                      <p className="text-[9px] uppercase text-slate-500">GitHub</p>
                      <a
                        href={formatSocialUrl("github", member.github)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white hover:text-[#00F5D4] transition truncate block font-mono"
                      >
                        {member.github.replace(/^https?:\/\/(www\.)?github\.com\//, "").replace(/\/$/, "")}
                      </a>
                    </div>
                  </div>
                )}

                {member.instagram && (
                  <div className="flex items-center gap-3 truncate">
                    <InstagramIcon className="w-4 h-4 text-[#00F5D4] shrink-0" />
                    <div className="truncate">
                      <p className="text-[9px] uppercase text-slate-500">Instagram</p>
                      <a
                        href={formatSocialUrl("instagram", member.instagram)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white hover:text-[#00F5D4] transition truncate block font-mono"
                      >
                        @{member.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/$/, "").replace(/^@/, "")}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleShare}
                className="p-2 rounded-md border border-white/[0.08] bg-[#050A14] hover:bg-white/[0.05] text-xs font-mono text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                {copiedShare ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#00F5D4]" />
                    <span>COPIED</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>SHARE</span>
                  </>
                )}
              </button>

              <button
                onClick={handleSaveLink}
                className="p-2 rounded-md border border-white/[0.08] bg-[#050A14] hover:bg-white/[0.05] text-xs font-mono text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#00F5D4]" />
                    <span>SAVED</span>
                  </>
                ) : (
                  <>
                    <Link2 className="w-3.5 h-3.5" />
                    <span>SAVE LINK</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Universal Tactical Footer */}
      <Footer />
    </div>
  );
}
