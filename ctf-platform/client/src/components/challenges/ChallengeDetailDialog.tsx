// Created: 2026-08-11 | Modified: Initial creation — Challenge detail dialog with flag submission

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flag, Eye, ChevronDown, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Challenge, getChallenge, submitFlag } from "@/lib/api";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ChallengeDetailDialogProps {
    challengeId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSolved: () => void;
    viewers: number;
    onView: (id: string) => void;
    onLeave: (id: string) => void;
}

export function ChallengeDetailDialog({
    challengeId,
    open,
    onOpenChange,
    onSolved,
    viewers,
    onView,
    onLeave,
}: ChallengeDetailDialogProps) {
    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [loading, setLoading] = useState(false);
    const [flag, setFlag] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<"CORRECT" | "INCORRECT" | null>(null);
    const [resultMessage, setResultMessage] = useState("");
    const [pointsAwarded, setPointsAwarded] = useState(0);
    const [expandedHints, setExpandedHints] = useState<Set<string>>(new Set());

    // Fetch challenge details when opened
    useEffect(() => {
        if (!open || !challengeId) return;

        setLoading(true);
        setFlag("");
        setResult(null);
        setResultMessage("");
        setExpandedHints(new Set());

        getChallenge(challengeId).then((res) => {
            if (res.success && res.data) {
                setChallenge(res.data);
            }
            setLoading(false);
        });

        // Emit presence
        onView(challengeId);

        return () => {
            if (challengeId) onLeave(challengeId);
        };
    }, [open, challengeId]);

    const handleSubmit = async () => {
        if (!challengeId || !flag.trim() || submitting) return;

        setSubmitting(true);
        setResult(null);

        const res = await submitFlag(challengeId, flag.trim());

        if (res.success && res.data) {
            if (res.data.result === "CORRECT") {
                setResult("CORRECT");
                setPointsAwarded(res.data.pointsAwarded || 0);
                setResultMessage(`+${res.data.pointsAwarded} points!`);
                onSolved();
            } else {
                setResult("INCORRECT");
                setResultMessage("Wrong flag. Try again.");
            }
        } else {
            setResult("INCORRECT");
            setResultMessage(res.message || "Submission failed.");
        }

        setSubmitting(false);
    };

    const toggleHint = (hintId: string) => {
        setExpandedHints((prev) => {
            const next = new Set(prev);
            if (next.has(hintId)) next.delete(hintId);
            else next.add(hintId);
            return next;
        });
    };

    const isSolved = challenge?.userStatus === "SOLVED" || result === "CORRECT";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="sm:max-w-lg"
                style={{
                    backgroundColor: "var(--ctf-card)",
                    borderColor: isSolved ? "var(--ctf-green)" : "var(--ctf-border)",
                    boxShadow: isSolved ? "0 0 30px var(--ctf-green-glow)" : undefined,
                }}
            >
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="size-6 animate-spin text-[var(--ctf-green)]" />
                    </div>
                ) : challenge ? (
                    <div className="space-y-4">
                        <DialogHeader>
                            <div className="flex items-center gap-2 mb-2">
                                <Badge
                                    variant="outline"
                                    className="text-[10px] uppercase tracking-wider"
                                >
                                    {challenge.category}
                                </Badge>
                                <span className="text-xs" style={{ color: "#666" }}>
                                    {challenge.difficulty}
                                </span>
                                {viewers > 0 && (
                                    <span className="ml-auto flex items-center gap-1 text-xs text-[var(--ctf-amber)]">
                                        <Eye className="size-3" /> {viewers} viewing
                                    </span>
                                )}
                            </div>
                            <DialogTitle
                                className="text-lg"
                                style={{ fontFamily: "var(--font-heading)" }}
                            >
                                {challenge.title}
                            </DialogTitle>
                            <DialogDescription className="leading-relaxed whitespace-pre-wrap">
                                {challenge.description}
                            </DialogDescription>
                        </DialogHeader>

                        {/* Points */}
                        <div
                            className="flex items-center gap-2 rounded-lg border px-4 py-3"
                            style={{
                                backgroundColor: "rgba(0,0,0,0.3)",
                                borderColor: "var(--ctf-border)",
                            }}
                        >
                            <span className="text-xs" style={{ color: "#666" }}>
                                Points:
                            </span>
                            <span
                                className="text-lg font-bold"
                                style={{
                                    fontFamily: "var(--font-mono)",
                                    color: "var(--ctf-green)",
                                }}
                            >
                                {challenge.currentPoints}
                            </span>
                            <span className="text-xs ml-auto" style={{ color: "#555" }}>
                                {challenge.solveCount} solve{challenge.solveCount !== 1 ? "s" : ""}
                            </span>
                        </div>

                        {/* Hints */}
                        {challenge.hints && challenge.hints.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "#666" }}>
                                    Hints
                                </p>
                                {challenge.hints.map((hint) => (
                                    <div
                                        key={hint.id}
                                        className="rounded-lg border overflow-hidden"
                                        style={{
                                            backgroundColor: "rgba(0,0,0,0.2)",
                                            borderColor: "var(--ctf-border)",
                                        }}
                                    >
                                        <button
                                            onClick={() => toggleHint(hint.id)}
                                            className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-white/5 transition-colors"
                                        >
                                            <span style={{ color: "#999" }}>
                                                Hint {hint.orderIndex + 1}
                                                {hint.pointCost > 0 && (
                                                    <span className="ml-2 text-[var(--ctf-amber)]">
                                                        (-{hint.pointCost} pts)
                                                    </span>
                                                )}
                                            </span>
                                            <ChevronDown
                                                className={`size-4 transition-transform ${expandedHints.has(hint.id) ? "rotate-180" : ""
                                                    }`}
                                                style={{ color: "#555" }}
                                            />
                                        </button>
                                        <AnimatePresence>
                                            {expandedHints.has(hint.id) && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <p className="px-3 pb-3 text-sm" style={{ color: "#ccc" }}>
                                                        {hint.content}
                                                    </p>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </div>
                        )}

                        <Separator style={{ backgroundColor: "var(--ctf-border)" }} />

                        {/* Flag Submission */}
                        {isSolved ? (
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="flex flex-col items-center gap-2 py-4"
                            >
                                <CheckCircle2 className="size-10 text-[var(--ctf-green)]" />
                                <p className="text-sm font-bold text-[var(--ctf-green)]">
                                    Challenge Solved!
                                </p>
                                {pointsAwarded > 0 && (
                                    <p
                                        className="text-2xl font-bold glow-green-text"
                                        style={{
                                            fontFamily: "var(--font-mono)",
                                            color: "var(--ctf-green)",
                                        }}
                                    >
                                        +{pointsAwarded}
                                    </p>
                                )}
                            </motion.div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <Input
                                        value={flag}
                                        onChange={(e) => setFlag(e.target.value)}
                                        placeholder="CTF{enter_your_flag_here}"
                                        className="bg-transparent border-[var(--ctf-border)] flex-1"
                                        style={{ fontFamily: "var(--font-mono)" }}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") handleSubmit();
                                        }}
                                    />
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={submitting || !flag.trim()}
                                        className="bg-[var(--ctf-green)] text-black hover:bg-[var(--ctf-green)]/90 font-semibold"
                                    >
                                        {submitting ? (
                                            <Loader2 className="size-4 animate-spin" />
                                        ) : (
                                            <Flag className="size-4" />
                                        )}
                                    </Button>
                                </div>

                                {/* Result feedback */}
                                <AnimatePresence>
                                    {result && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="flex items-center gap-2 text-sm"
                                        >
                                            <AlertCircle className="size-4 text-[var(--ctf-orange)]" />
                                            <span
                                                style={{
                                                    color: "var(--ctf-orange)",
                                                }}
                                            >
                                                {resultMessage}
                                            </span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="text-sm py-8 text-center" style={{ color: "#666" }}>
                        Challenge not found.
                    </p>
                )}
            </DialogContent>
        </Dialog>
    );
}
