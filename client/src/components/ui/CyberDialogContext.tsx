"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X, ShieldAlert } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

export interface ConfirmModalOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "primary";
}

export interface AlertModalOptions {
  title: string;
  message: string;
  type?: ToastType;
  buttonText?: string;
}

interface CyberDialogContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  confirmModal: (options: ConfirmModalOptions) => Promise<boolean>;
  alertModal: (options: AlertModalOptions) => Promise<void>;
}

const CyberDialogContext = createContext<CyberDialogContextValue | null>(null);

export function CyberDialogProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  
  // Confirm Modal State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<ConfirmModalOptions>({ title: "", message: "" });
  const confirmResolveRef = useRef<((value: boolean) => void) | null>(null);

  // Alert Modal State
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState<AlertModalOptions>({ title: "", message: "" });
  const alertResolveRef = useRef<(() => void) | null>(null);

  const showToast = useCallback((message: string, type: ToastType = "info", duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const confirmModal = useCallback((options: ConfirmModalOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      confirmResolveRef.current = resolve;
      setConfirmConfig(options);
      setConfirmOpen(true);
    });
  }, []);

  const handleConfirmClose = (result: boolean) => {
    setConfirmOpen(false);
    if (confirmResolveRef.current) {
      confirmResolveRef.current(result);
      confirmResolveRef.current = null;
    }
  };

  const alertModal = useCallback((options: AlertModalOptions): Promise<void> => {
    return new Promise((resolve) => {
      alertResolveRef.current = resolve;
      setAlertConfig(options);
      setAlertOpen(true);
    });
  }, []);

  const handleAlertClose = () => {
    setAlertOpen(false);
    if (alertResolveRef.current) {
      alertResolveRef.current();
      alertResolveRef.current = null;
    }
  };

  return (
    <CyberDialogContext.Provider value={{ showToast, confirmModal, alertModal }}>
      {children}

      {/* ─── Cyber Toast Notifications ─────────────────────────────── */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map((t) => {
            const isSuccess = t.type === "success";
            const isError = t.type === "error";
            const isWarning = t.type === "warning";

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl border backdrop-blur-xl shadow-2xl transition-all ${
                  isSuccess
                    ? "bg-[#09151B]/95 border-[#00F5D4]/40 text-[#00F5D4] shadow-[0_8px_30px_rgba(0,245,212,0.15)]"
                    : isError
                    ? "bg-[#180A0E]/95 border-red-500/40 text-red-400 shadow-[0_8px_30px_rgba(239,68,68,0.15)]"
                    : isWarning
                    ? "bg-[#17130A]/95 border-amber-500/40 text-amber-300 shadow-[0_8px_30px_rgba(245,158,11,0.15)]"
                    : "bg-[#090F19]/95 border-cyan-500/30 text-cyan-300 shadow-[0_8px_30px_rgba(6,182,212,0.15)]"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {isSuccess && <CheckCircle2 className="w-4 h-4 shrink-0 text-[#00F5D4]" />}
                  {isError && <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />}
                  {isWarning && <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />}
                  {!isSuccess && !isError && !isWarning && <Info className="w-4 h-4 shrink-0 text-cyan-400" />}
                  <span className="text-xs font-mono font-medium tracking-tight break-words text-slate-100">
                    {t.message}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeToast(t.id)}
                  className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ─── Cyber Confirm Dialog Modal ───────────────────────────── */}
      <DialogPrimitive.Root open={confirmOpen} onOpenChange={(open) => !open && handleConfirmClose(false)}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[9990] bg-black/80 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-[9991] grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 bg-[#090F19] border border-cyan-500/30 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_30px_rgba(0,245,212,0.1)] rounded-2xl duration-200">
            <div className="flex items-start gap-3">
              <div
                className={`p-2.5 rounded-xl border shrink-0 ${
                  confirmConfig.variant === "danger"
                    ? "border-red-500/30 bg-red-950/30 text-red-400"
                    : confirmConfig.variant === "warning"
                    ? "border-amber-500/30 bg-amber-950/30 text-amber-400"
                    : "border-cyan-500/30 bg-cyan-950/30 text-[#00F5D4]"
                }`}
              >
                {confirmConfig.variant === "danger" ? (
                  <ShieldAlert className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>
              <div className="space-y-1">
                <DialogPrimitive.Title className="text-base font-bold text-white font-mono uppercase tracking-wide">
                  {confirmConfig.title || "Confirm Operation"}
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="text-xs text-slate-300 font-sans leading-relaxed">
                  {confirmConfig.message}
                </DialogPrimitive.Description>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.06] mt-2">
              <button
                type="button"
                onClick={() => handleConfirmClose(false)}
                className="px-4 py-2 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 hover:text-white text-slate-400 text-xs font-mono font-bold uppercase transition"
              >
                {confirmConfig.cancelText || "Cancel"}
              </button>
              <button
                type="button"
                onClick={() => handleConfirmClose(true)}
                className={`px-4 py-2 rounded-lg text-xs font-mono font-black uppercase tracking-wider transition ${
                  confirmConfig.variant === "danger"
                    ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] hover:shadow-[0_0_25px_rgba(239,68,68,0.7)]"
                    : confirmConfig.variant === "warning"
                    ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)] hover:shadow-[0_0_25px_rgba(245,158,11,0.7)]"
                    : "bg-gradient-to-r from-[#00F5D4] to-[#00E1FF] text-black shadow-[0_0_15px_rgba(0,245,212,0.5)] hover:shadow-[0_0_25px_rgba(0,245,212,0.8)]"
                }`}
              >
                {confirmConfig.confirmText || "Confirm"}
              </button>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      {/* ─── Cyber Alert Modal ────────────────────────────────────── */}
      <DialogPrimitive.Root open={alertOpen} onOpenChange={(open) => !open && handleAlertClose()}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[9990] bg-black/80 backdrop-blur-md" />
          <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-[9991] grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 bg-[#090F19] border border-cyan-500/30 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.9)] rounded-2xl">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl border border-cyan-500/30 bg-cyan-950/30 text-[#00F5D4] shrink-0">
                <Info className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <DialogPrimitive.Title className="text-base font-bold text-white font-mono uppercase tracking-wide">
                  {alertConfig.title || "Notice"}
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="text-xs text-slate-300 font-sans leading-relaxed">
                  {alertConfig.message}
                </DialogPrimitive.Description>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-white/[0.06] mt-2">
              <button
                type="button"
                onClick={handleAlertClose}
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#00F5D4] to-[#00E1FF] text-black text-xs font-mono font-black uppercase tracking-wider shadow-[0_0_15px_rgba(0,245,212,0.5)] hover:shadow-[0_0_25px_rgba(0,245,212,0.8)] transition"
              >
                {alertConfig.buttonText || "Acknowledge"}
              </button>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </CyberDialogContext.Provider>
  );
}

export function useCyberDialog() {
  const ctx = useContext(CyberDialogContext);
  if (!ctx) {
    throw new Error("useCyberDialog must be used within a CyberDialogProvider");
  }
  return ctx;
}
