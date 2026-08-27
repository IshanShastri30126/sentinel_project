"use client";

import { useEffect, useState } from "react";

/**
 * NetworkInspectionGuard
 *
 * Client-Side Shield for Network & Runtime Inspection Defense.
 * - Prevents DevTools shortcut triggering (F12, Ctrl+Shift+I/J/C, Ctrl+U)
 * - Intercepts context menu inspection (Right Click)
 * - Sanitizes console logs to prevent runtime secret / network leakage
 * - Monitors for DevTools inspection docking/detaching
 */
export function NetworkInspectionGuard() {
  const [isInspectionDetected, setIsInspectionDetected] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // ── 1. Disable DevTools & View Source Keyboard Shortcuts ────────────────
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === "F12" || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+Shift+I (DevTools) / Cmd+Opt+I (macOS)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "I" || e.key === "i" || e.keyCode === 73)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+Shift+J (Console) / Cmd+Opt+J (macOS)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "J" || e.key === "j" || e.keyCode === 74)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+Shift+C (Inspect Element) / Cmd+Opt+C (macOS)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "C" || e.key === "c" || e.keyCode === 67)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+U / Cmd+Opt+U (View Source)
      if ((e.ctrlKey || e.metaKey) && (e.key === "u" || e.key === "U" || e.keyCode === 85)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+S / Cmd+S (Save Page)
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S" || e.keyCode === 83)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // ── 2. Intercept Context Menu (Right Click Inspect) ─────────────────────
    const handleContextMenu = (e: MouseEvent) => {
      // Allow right clicks on text inputs / textareas for paste, otherwise block
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        return;
      }
      e.preventDefault();
      return false;
    };

    // ── 3. Production Console Log Sanitization ──────────────────────────────
    if (process.env.NODE_ENV === "production") {
      const noop = () => {};
      try {
        window.console.log = noop;
        window.console.info = noop;
        window.console.debug = noop;
        window.console.dir = noop;
        window.console.table = noop;
      } catch {
        // Safe fallback
      }
    }

    // ── 4. DevTools Open State Detection ────────────────────────────────────
    const threshold = 160;
    const checkInspectionState = () => {
      const widthDiff = window.outerWidth - window.innerWidth > threshold;
      const heightDiff = window.outerHeight - window.innerHeight > threshold;

      if (widthDiff || heightDiff) {
        if (process.env.NODE_ENV === "production") {
          setIsInspectionDetected(true);
        }
      } else {
        setIsInspectionDetected(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("contextmenu", handleContextMenu, true);
    window.addEventListener("resize", checkInspectionState);

    const interval = setInterval(checkInspectionState, 2000);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("contextmenu", handleContextMenu, true);
      window.removeEventListener("resize", checkInspectionState);
      clearInterval(interval);
    };
  }, []);

  if (!isInspectionDetected) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(10, 10, 15, 0.96)",
        backdropFilter: "blur(16px)",
        zIndex: 999999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#f87171",
        fontFamily: "monospace",
        padding: "24px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "48px", marginBottom: "16px" }}>🛡️</div>
      <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#fca5a5", marginBottom: "8px" }}>
        SECURITY ENFORCEMENT ACTIVE
      </h2>
      <p style={{ fontSize: "14px", color: "#9ca3af", maxWidth: "480px", lineHeight: "1.6" }}>
        Network inspection, DevTools debugger, and unauthorized traffic interception tools are restricted
        under Chakravyuh Security Policy. Please close external inspector windows to continue.
      </p>
    </div>
  );
}
