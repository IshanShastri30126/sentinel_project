"use client";

import { useEffect } from "react";

/**
 * PWARegistration
 *
 * Registers the progressive web app service worker in the background for
 * offline assets and network caching. Intrusive install popup banners on
 * initial loading have been removed to prevent interface clutter.
 */
export function PWARegistration() {
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
  }, []);

  return null;
}

