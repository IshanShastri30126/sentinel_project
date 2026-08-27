"use client";

import React, { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const STORAGE_KEY = "pwa_prompt_dismissed";

export function PWARegistration() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as unknown as { standalone?: boolean }).standalone);
  });
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) === "true";
  });

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").then(
          (registration) => {
            console.log("[PWA] ServiceWorker registered: ", registration.scope);
          },
          (err) => {
            console.error("[PWA] ServiceWorker registration failed: ", err);
          }
        );
      });
    }

    let matchMedia: MediaQueryList | null = null;
    let handleChange: ((evt: MediaQueryListEvent) => void) | null = null;

    if (typeof window !== "undefined") {
      matchMedia = window.matchMedia("(display-mode: standalone)");
      handleChange = (evt: MediaQueryListEvent) => {
        setIsStandalone(evt.matches);
      };
      matchMedia.addEventListener("change", handleChange);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (localStorage.getItem(STORAGE_KEY) !== "true") {
        setIsInstallable(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      if (matchMedia && handleChange) {
        matchMedia.removeEventListener("change", handleChange);
      }
      if (typeof window !== "undefined") {
        window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      }
    };
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, "true");
    }
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] User response to install prompt: ${outcome}`);
    setDeferredPrompt(null);
    setIsInstallable(false);
    handleDismiss();
  };

  const requestNotificationPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const permission = await Notification.requestPermission();
      console.log(`[PWA] Notification permission: ${permission}`);
    }
  };

  if (!isInstallable || isStandalone || isDismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full p-4 rounded-xl bg-slate-900/95 border border-[#00F5D4]/30 shadow-2xl backdrop-blur-md font-mono text-xs text-slate-200 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <div className="p-2 rounded-lg bg-[#00F5D4]/10 border border-[#00F5D4]/30 text-[#00F5D4] shrink-0">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-sm">INSTALL APP</h4>
            <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed font-sans">
              Install Chakravyuh Club for offline telemetry access and instant event updates.
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-white transition-colors p-1"
          aria-label="Close Install App Popup"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-4 flex gap-2 justify-end">
        <button
          onClick={handleDismiss}
          className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-colors uppercase text-[10px]"
        >
          Later
        </button>
        <button
          onClick={() => {
            handleInstallClick();
            requestNotificationPermission();
          }}
          className="px-3 py-1.5 rounded-lg bg-[#00F5D4] text-slate-950 font-bold hover:bg-[#00E1FF] transition-colors uppercase text-[10px] shadow-[0_0_12px_rgba(0,245,212,0.4)]"
        >
          Install Now
        </button>
      </div>
    </div>
  );
}
