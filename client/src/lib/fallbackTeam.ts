/**
 * Fallback Team Cadre Dataset
 *
 * Provides a resilient, pre-compiled team directory for Sentinel.
 * Utilized when API requests are rejected by firewall policies (e.g. IP block list),
 * offline network states, or cold-start conditions.
 */

export interface TeamCadreMember {
  id: string;
  name: string;
  role: string;
  designation: string;
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

export const FALLBACK_TEAM_CADRE: TeamCadreMember[] = [
  {
    id: "member_1786134186573",
    name: "Dr. Pritesh Prajapati",
    role: "FACULTY",
    designation: "Faculty Mentor",
    department: "CE - CSPIT",
    email: "priteshprajapati@charusat.ac.in",
    phone: "9999999999",
    employeeId: "115",
    studentId: "115",
    joinedDate: "August 2026",
    imageUrl: "https://res.cloudinary.com/da36ypzco/image/upload/v1786134294/cyberkavach/yhkduiyofyema7dw2ui7.jpg",
    coverPosterUrl: "https://res.cloudinary.com/da36ypzco/image/upload/v1786134312/cyberkavach/bjlwh4gypzfllstguy6n.png",
    cyberAvatarUrl: "https://res.cloudinary.com/da36ypzco/image/upload/v1786134336/cyberkavach/we8922ughoslocywbc9t.jpg",
    cyberName: "INSEPTOR",
    cyberSpecialAbility: "RED TEAM & DEFENSIVE ARCHITECTURE",
    cyberBackstory: "Guiding the Chakravyuh student corps with advanced vulnerability assessment methodologies, threat modeling, and defensive system hardening.",
    about: "Specialization: Cloud Security & Penetration Testing\nResearch: Adversary Simulation & Zero-Trust Frameworks\nMentorship: Overseeing student-led offensive security operations and cyber defense research.",
    linkedin: "priteshprajapati",
    github: "priteshprajapati",
    instagram: "chakravyuh.charusat"
  },
  {
    id: "member_1789071279197",
    name: "Kush Amit Shah",
    role: "STUDENT_COORDINATOR",
    designation: "Lead Security Researcher",
    department: "CE - CSPIT",
    email: "d25ce145@charusat.edu.in",
    phone: "9999888877",
    studentId: "D25CE145",
    joinedDate: "July 2026",
    imageUrl: "https://res.cloudinary.com/da36ypzco/image/upload/v1789071330/sentinel/ppglscj9cl4f5iyn1hbl.png",
    coverPosterUrl: "https://res.cloudinary.com/da36ypzco/image/upload/v1789071343/sentinel/ggr9pkmhsggxbvivebuk.png",
    cyberAvatarUrl: "https://res.cloudinary.com/da36ypzco/image/upload/v1789071362/sentinel/rwhqjxeqivxwnpihtin9.png",
    cyberName: "GhosttyyyViber",
    cyberSpecialAbility: "FULL-STACK DEFENSE & PROTOCOL REVERSE ENGINEERING",
    cyberBackstory: "Chief architect of the Sentinel operations console. Specializes in real-time intrusion monitoring, hardened cryptographic transport, and offensive security tooling.",
    about: "Domain: Application Security & Zero-Trust Auth\nFocus: Real-time telemetry, tamper-proof audit trails, and automated firewall orchestration\nAffiliation: Chakravyuh Core Technical Cadre",
    linkedin: "kush-shah",
    github: "kush-shah",
    instagram: "chakravyuh.charusat"
  },
  {
    id: "member_1789071404245",
    name: "Ishan Shastri",
    role: "STUDENT_COORDINATOR",
    designation: "Security Operations Coordinator",
    department: "CE - CSPIT",
    email: "24ce115@charusat.edu.in",
    phone: "8888999900",
    studentId: "24CE115",
    joinedDate: "July 2026",
    imageUrl: "/images/cyber_avatar.png",
    coverPosterUrl: "",
    cyberAvatarUrl: "/images/cyber_avatar.png",
    cyberName: "ShadowOps",
    cyberSpecialAbility: "NETWORK RECONNAISSANCE & THREAT INTEL",
    cyberBackstory: "Lead operative coordinating incident response drills, student workshops, and technical CTF challenges across the university campus.",
    about: "Domain: Network Defense & Threat Hunting\nFocus: Traffic anomaly detection and student intelligence workflows\nAffiliation: Chakravyuh Core Operations",
    linkedin: "ishanshastri",
    github: "ishanshastri",
    instagram: "chakravyuh.charusat"
  }
];

/**
 * Format a social URL safely regardless of whether input is a username,
 * handle with '@', or full URL.
 */
export function formatSocialUrl(type: "linkedin" | "github" | "instagram", raw?: string): string {
  if (!raw || !raw.trim()) {
    if (type === "instagram") return "https://instagram.com/chakravyuh.charusat";
    return "#";
  }
  const clean = raw.trim();
  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    return clean;
  }
  const handle = clean.replace(/^@/, "");
  if (type === "linkedin") return `https://www.linkedin.com/in/${handle}`;
  if (type === "github") return `https://github.com/${handle}`;
  if (type === "instagram") return `https://www.instagram.com/${handle}/`;
  return "#";
}

/**
 * Strictly format mobile number to exactly 10 digits as integer string
 */
export function formatPhoneNumber(phone?: string): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  return digits.slice(0, 10);
}
