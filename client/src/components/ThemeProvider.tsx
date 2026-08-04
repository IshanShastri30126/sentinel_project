"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

export interface ClubBranding {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  themeMode: string;
  fontFamily: string;
}

interface ThemeContextType {
  club: ClubBranding | null;
  loading: boolean;
  refreshBranding: () => Promise<void>;
  changeClub: (slug: string) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  club: null,
  loading: true,
  refreshBranding: async () => { },
  changeClub: () => { },
});

export const useThemeBranding = () => useContext(ThemeContext);

export function ThemeBrandingProvider({ children }: { children: React.ReactNode }) {
  const [club, setClub] = useState<ClubBranding | null>(null);
  const [loading, setLoading] = useState(true);

  const applyBranding = React.useCallback((branding: ClubBranding) => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;

    const defaultGreen = "#00F5D4";
    const defaultBlue = "#00E1FF";

    const pColor = (branding.primaryColor && !["#FFD700", "#CCFF00", "#FF4D00"].includes(branding.primaryColor)) ? branding.primaryColor : defaultGreen;
    const sColor = (branding.secondaryColor && !["#FF4D00", "#FF8800", "#FFD700"].includes(branding.secondaryColor)) ? branding.secondaryColor : defaultBlue;

    root.style.setProperty("--ck-lime", pColor);
    root.style.setProperty("--ck-green", pColor);
    root.style.setProperty("--ck-primary", pColor);
    root.style.setProperty("--ck-primary-light", pColor);

    root.style.setProperty("--ck-orange", sColor);
    root.style.setProperty("--ck-blue", sColor);
    root.style.setProperty("--ck-accent", sColor);
    root.style.setProperty("--ck-accent-light", sColor);

    if (branding.fontFamily) {
      const fontId = `ck-font-${branding.fontFamily.replace(/\s+/g, "-").toLowerCase()}`;
      if (!document.getElementById(fontId)) {
        const link = document.createElement("link");
        link.id = fontId;
        link.rel = "stylesheet";
        link.href = `https://fonts.googleapis.com/css2?family=${branding.fontFamily.replace(/\s+/g, "+")}:wght@300;400;500;600;700;800;900&display=swap`;
        document.head.appendChild(link);
      }
      root.style.setProperty("--font-sans", `'${branding.fontFamily}', sans-serif`);
      root.style.fontFamily = `'${branding.fontFamily}', sans-serif`;
    }

    if (branding.themeMode === "light") {
      const lightGradient = "#F8FAFC";
      root.style.setProperty("--ck-bg", "#F8FAFC");
      root.style.setProperty("--ck-bg-gradient", lightGradient);
      root.style.setProperty("--ck-bg-secondary", "#F1F5F9");
      root.style.setProperty("--ck-bg-card", "#FFFFFF");
      root.style.setProperty("--ck-bg-elevated", "#E2E8F0");
      root.style.setProperty("--ck-text", "#0F172A");
      root.style.setProperty("--ck-text-secondary", "#475569");
      root.style.setProperty("--ck-text-muted", "#94A3B8");
      root.style.setProperty("--ck-border", "#E2E8F0");
      root.style.setProperty("--ck-border-bright", "#CBD5E1");
      root.style.setProperty("--ck-glass-bg", "rgba(255,255,255,0.85)");
      root.style.setProperty("--ck-glass-border", "rgba(15,23,42,0.1)");
      document.body.style.background = lightGradient;
      document.body.style.color = "#0F172A";
    } else {
      const darkGradient = "#05070A";
      root.style.setProperty("--ck-bg", "#05070A");
      root.style.setProperty("--ck-bg-gradient", darkGradient);
      root.style.setProperty("--ck-bg-secondary", "#080A0F");
      root.style.setProperty("--ck-bg-card", "#0D0F14");
      root.style.setProperty("--ck-bg-elevated", "#121519");
      root.style.setProperty("--ck-text", "#F0F4FF");
      root.style.setProperty("--ck-text-secondary", "#8892A4");
      root.style.setProperty("--ck-text-muted", "#4B5563");
      root.style.setProperty("--ck-border", "#1A1E26");
      root.style.setProperty("--ck-border-bright", "#252B35");
      root.style.setProperty("--ck-glass-bg", "rgba(13,15,20,0.85)");
      root.style.setProperty("--ck-glass-border", "rgba(0,245,212,0.12)");
      document.body.style.background = darkGradient;
      document.body.style.color = "#F0F4FF";
    }
  }, []);

  const fetchBranding = React.useCallback(async () => {
    try {
      const slug = localStorage.getItem("ck_active_club_slug") || "chakravyuh";
      const data = await api<{ club?: ClubBranding }>(`/clubs/${slug}`);
      if (data.club) {
        setClub(data.club);
        applyBranding(data.club);
      }
    } catch (err) {
      console.error("[ThemeProvider] Failed to load branding:", err);
    } finally {
      setLoading(false);
    }
  }, [applyBranding]);

  useEffect(() => {
    fetchBranding();

    const handleStorageChange = () => {
      fetchBranding();
    };
    window.addEventListener("ck_club_changed", handleStorageChange);
    return () => window.removeEventListener("ck_club_changed", handleStorageChange);
  }, [fetchBranding]);

  const changeClub = (slug: string) => {
    localStorage.setItem("ck_active_club_slug", slug);
    fetchBranding();
    window.dispatchEvent(new Event("ck_club_changed"));
  };

  return (
    <ThemeContext.Provider value={{ club, loading, refreshBranding: fetchBranding, changeClub }}>
      {children}
    </ThemeContext.Provider>
  );
}
