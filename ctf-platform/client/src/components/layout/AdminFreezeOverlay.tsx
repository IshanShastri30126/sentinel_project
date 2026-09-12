// Created: 2026-08-11 | Modified: Initial creation — 5-second admin freeze overlay

"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { AdminFreezeEvent } from "@/hooks/useSocket";

interface AdminFreezeOverlayProps {
    freezeEvent: AdminFreezeEvent | null;
    onComplete: () => void;
}

const FREEZE_DURATION = 5;

export function AdminFreezeOverlay({
    freezeEvent,
    onComplete,
}: AdminFreezeOverlayProps) {
    const [countdown, setCountdown] = useState(FREEZE_DURATION);

    useEffect(() => {
        if (!freezeEvent) return;

        setCountdown(FREEZE_DURATION);

        const interval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    onComplete();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [freezeEvent, onComplete]);

    return (
        <AnimatePresence>
            {freezeEvent && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center"
                    style={{
                        backgroundColor: "rgba(0, 0, 0, 0.92)",
                        backdropFilter: "blur(8px)",
                        pointerEvents: "all",
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="flex flex-col items-center gap-6 text-center px-8"
                    >
                        {/* Warning icon */}
                        <motion.div
                            animate={{ rotate: [0, -10, 10, -10, 0] }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <AlertTriangle
                                className="size-16"
                                style={{ color: "var(--ctf-amber)" }}
                            />
                        </motion.div>

                        {/* Title */}
                        <h2
                            className="text-2xl font-bold tracking-tight"
                            style={{
                                fontFamily: "var(--font-heading)",
                                color: "var(--ctf-amber)",
                            }}
                        >
                            CHALLENGE MODIFIED
                        </h2>

                        {/* Message */}
                        <p className="text-base max-w-md" style={{ color: "#A1A1AA" }}>
                            {freezeEvent.message ||
                                "A challenge has been updated by an admin. Please review the changes."}
                        </p>

                        {/* Countdown */}
                        <div className="relative mt-4">
                            <motion.div
                                key={countdown}
                                initial={{ scale: 1.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                                className="text-8xl font-bold glow-green-text"
                                style={{
                                    fontFamily: "var(--font-mono)",
                                    color: "var(--ctf-green)",
                                }}
                            >
                                {countdown}
                            </motion.div>
                        </div>

                        {/* Subtitle */}
                        <p
                            className="text-xs tracking-widest uppercase mt-2"
                            style={{ color: "#555" }}
                        >
                            Resuming in {countdown} second{countdown !== 1 ? "s" : ""}...
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
