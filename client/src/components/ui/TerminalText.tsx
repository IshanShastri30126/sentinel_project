"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface TerminalTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  words: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  delayBetweenWords?: number;
  cursorChar?: string;
}

/**
 * TerminalText
 *
 * Emulates a hacker terminal command typing effect with cyclic word transitions
 * and a blinking monospace block cursor.
 *
 * @param {TerminalTextProps} props - Target phrases, speeds, pauses, and cursor styling.
 * @returns {JSX.Element} Rendered typing text span.
 */
export function TerminalText({
  words,
  typingSpeed = 70,
  deletingSpeed = 40,
  delayBetweenWords = 1800,
  cursorChar = "█",
  className,
  ...props
}: TerminalTextProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!words || words.length === 0) return;

    const currentWord = words[currentWordIndex];

    const timer = setTimeout(() => {
      if (!isDeleting) {
        // Typing forward
        if (displayedText.length < currentWord.length) {
          setDisplayedText(currentWord.slice(0, displayedText.length + 1));
        } else {
          // Finished typing word, wait before deleting
          setTimeout(() => setIsDeleting(true), delayBetweenWords);
        }
      } else {
        // Deleting backward
        if (displayedText.length > 0) {
          setDisplayedText(currentWord.slice(0, displayedText.length - 1));
        } else {
          // Finished deleting, move to next word
          setIsDeleting(false);
          setCurrentWordIndex((prev) => (prev + 1) % words.length);
        }
      }
    }, isDeleting ? deletingSpeed : typingSpeed);

    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, currentWordIndex, words, typingSpeed, deletingSpeed, delayBetweenWords]);

  return (
    <span
      className={cn("inline-flex items-center font-mono tracking-tight", className)}
      {...props}
    >
      <span>{displayedText}</span>
      <span className="ml-0.5 inline-block text-[#00F5D4] animate-pulse">
        {cursorChar}
      </span>
    </span>
  );
}
