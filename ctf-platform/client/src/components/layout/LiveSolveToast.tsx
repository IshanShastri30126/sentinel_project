// Created: 2026-08-11 | Modified: Initial creation — Animated live solve toast

"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flag } from "lucide-react";
import { LiveSolveEvent } from "@/hooks/useSocket";

interface LiveSolveToastProps {
    event: LiveSolveEvent | null;
}

export function LiveSolveToast({ event }: LiveSolveToastProps) {
    const [visible, setVisible] = useState(false);
    const [currentEvent, setCurrentEvent] = useState<LiveSolveEvent | null>(null);

    useEffect(() => {
        if (!event) return;
        setCurrentEvent(event);
        setVisible(true);

        const timer = setTimeout(() => {
            setVisible(false);
        }, 4000);

        return () => clearTimeout(timer);
    }, [event]);

    return (
        <AnimatePresence>
            {visible && currentEvent && (
                <motion.div
                    initial={{ opacity: 0, y: -20, x: 20 }}
                    animate={{ opacity: 1, y: 0, x: 0 }}
                    exit={{ opacity: 0, y: -20, x: 20 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="fixed top-4 right-4 z-50 flex items-center gap-3 rounded-lg border px-4 py-3"
                    style={{
                        backgroundColor: "var(--ctf-card)",
                        borderColor: "var(--ctf-green)",
                        boxShadow: "0 0 20px var(--ctf-green-glow)",
                    }}
                >
                    <Flag className="size-4 text-[var(--ctf-green)] shrink-0" />
                    <div>
                        <p className="text-sm font-medium" style={{ color: "var(--ctf-green)" }}>
                            Flag Captured!
                        </p>
                        <p className="text-xs" style={{ color: "#888" }}>
                            <span className="font-semibold text-[var(--foreground)]">
                                {currentEvent.solverName}
                            </span>{" "}
                            solved a challenge
                        </p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
