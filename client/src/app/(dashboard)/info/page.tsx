"use client";

import React, { useState, useEffect } from "react";
import {
  Settings, Shield, Cpu, Lock, Database, Globe, Bell, ChevronRight,
  Save, Check, Zap, Loader, Image, Palette
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { useThemeBranding } from "@/components/ThemeProvider";

interface SettingField { label: string; value: string | number; type?: string; disabled?: boolean; unit?: string; description?: string; }

interface SettingSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  fields: SettingField[];
}

const SECTIONS: SettingSection[] = [
  {
    id: "system",
    title: "SYSTEM CONFIGURATION",
    icon: <Cpu className="w-4 h-4" />,
    color: "#7c3aed",
    fields: [
      { label: "Platform Version", value: "Chakravyuh Club v2.0", disabled: true, description: "Current platform build version" },
      { label: "Academic Year", value: "2025-2026", disabled: true, description: "Active academic session" },
      { label: "Environment", value: "PRODUCTION", disabled: true, description: "Deployment environment" },
    ]
  },
  {
    id: "escalation",
    title: "ESCALATION POLICY",
    icon: <Bell className="w-4 h-4" />,
    color: "#f59e0b",
    fields: [
      { label: "Escalation Threshold", value: 48, type: "number", unit: "hours", disabled: true, description: "Hours before auto-escalation triggers" },
      { label: "Max Approval Levels", value: 3, type: "number", disabled: true, description: "Maximum approval chain depth" },
    ]
  },
  {
    id: "security",
    title: "SECURITY SETTINGS",
    icon: <Lock className="w-4 h-4" />,
    color: "#06b6d4",
    fields: [
      { label: "Session Timeout", value: "24 hours", disabled: true, description: "Automatic session expiration" },
      { label: "Auth Method", value: "JWT + Cookie", disabled: true, description: "Active authentication protocol" },
    ]
  },
  {
    id: "data",
    title: "DATA & STORAGE",
    icon: <Database className="w-4 h-4" />,
    color: "#10b981",
    fields: [
      { label: "Database", value: "PostgreSQL 15", disabled: true, description: "Primary data store" },
      { label: "File Storage", value: "Local / S3 Compatible", disabled: true, description: "Asset storage backend" },
    ]
  },
];

export default function InfoPage() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState("system");



  const section = SECTIONS.find(s => s.id === activeSection) || SECTIONS[0];

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-[var(--ck-primary)] animate-pulse shadow-[0_0_8px_var(--ck-primary)]" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--ck-primary)]">SYSTEM CONSOLE</span>
          </div>
          <h1 className="text-3xl font-black font-mono tracking-tighter text-[var(--ck-text)]">
            INFO <span className="text-[var(--ck-primary)]">PANEL</span>
          </h1>
          <p className="text-xs text-[var(--ck-text-muted)] mt-1 font-mono">COORDINATOR ACCESS ONLY · NAMESPACE PARAMETERS</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--ck-primary)]/20 bg-[var(--ck-primary)]/5">
          <Shield className="w-4 h-4 text-[var(--ck-primary)]" />
          <span className="text-xs font-mono text-[var(--ck-primary)] font-bold">COORDINATOR SIGNATURE APPROVED</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4">
        {/* Sidebar Nav */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className="space-y-1"
        >
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all cursor-pointer ${activeSection === s.id
                ? "border shadow-[0_0_15px_rgba(0,0,0,0.4)]"
                : "border border-transparent text-[var(--ck-text-muted)] hover:text-[var(--ck-text)] hover:bg-white/3"
              }`}
              style={activeSection === s.id ? {
                background: `${s.color}10`,
                borderColor: `${s.color}25`,
                color: s.color
              } : {}}
            >
              <span style={activeSection === s.id ? { color: s.color } : { color: "#52525b" }}>{s.icon}</span>
              <span className="text-[11px] font-black uppercase tracking-wider">{s.title.split(" ")[0]}</span>
              <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-50" />
            </button>
          ))}
        </motion.div>

        {/* Main Panel */}
        <AnimatePresence mode="wait">
          <motion.div key={activeSection}
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border overflow-hidden pb-4"
            style={{
              borderColor: `${section.color}20`,
              background: `${section.color}05`
            }}
          >
            {/* Panel header */}
            <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: `${section.color}15` }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center border" style={{
                background: `${section.color}15`,
                borderColor: `${section.color}30`
              }}>
                <span style={{ color: section.color }}>{section.icon}</span>
              </div>
              <div>
                <h2 className="text-sm font-black uppercase tracking-widest" style={{ color: section.color }}>{section.title}</h2>
                <p className="text-[10px] text-zinc-650 font-mono mt-0.5">PLATFORM CONFIGURATION PARAMETERS</p>
              </div>
            </div>

            {/* Custom Content for Branding Section (Removed) */}
            
            {/* Fields for default sections */}
            <div className="p-6 space-y-4">
              {section.fields.map((field, i) => (
                <motion.div key={field.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="space-y-1.5"
                >
                  <label className="block text-[10px] font-bold uppercase tracking-widest font-mono" style={{ color: section.color }}>
                    {field.label}
                  </label>
                  {field.description && (
                    <p className="text-[11px] text-zinc-650">{field.description}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <div
                      className="flex-1 px-4 py-2.5 rounded-xl text-sm border font-mono bg-black/40 text-[var(--ck-text)] flex items-center"
                      style={{ borderColor: "rgba(255,255,255,0.08)" }}
                    >
                      {field.value}
                    </div>
                    {field.unit && <span className="text-xs text-[var(--ck-text-muted)] font-mono shrink-0">{field.unit}</span>}
                    {field.disabled && (
                      <div className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center border border-white/5 bg-white/3">
                        <Lock className="w-3 h-3 text-[var(--ck-text-muted)]" />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* System Status */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {[
          { label: "UPTIME",      value: "99.97%",  color: "#10b981" },
          { label: "API VERSION", value: "v2.0.0",  color: "#7c3aed" },
          { label: "DB STATUS",   value: "ONLINE",  color: "#06b6d4" },
          { label: "ENV",         value: "PROD",    color: "#f59e0b" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 + i * 0.07 }}
            className="p-3 rounded-xl border border-white/5 bg-white/2 text-center"
          >
            <p className="text-[9px] uppercase tracking-widest text-zinc-650 font-mono">{s.label}</p>
            <p className="text-sm font-black font-mono mt-1" style={{ color: s.color }}>{s.value}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
