// Created: 2026-08-11 | Modified: Initial creation — Root layout with dark theme and fonts

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "CTF Wars — Capture The Flag",
    description:
        "High-performance Capture The Flag competition platform. Solve cybersecurity challenges, compete on live leaderboards, and capture flags in real-time.",
    keywords: ["CTF", "Capture The Flag", "Cybersecurity", "Hacking", "Competition"],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark" suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body className="min-h-screen bg-grid antialiased">
                {children}
            </body>
        </html>
    );
}
