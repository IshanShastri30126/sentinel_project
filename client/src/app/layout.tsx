import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ThemeBrandingProvider } from "@/components/ThemeProvider";
import { PWARegistration } from "@/components/PWARegistration";
import { NetworkInspectionGuard } from "@/components/NetworkInspectionGuard";
import { CyberDialogProvider } from "@/components/ui/CyberDialogContext";

export const metadata: Metadata = {
  title: "SENTINAL — Cyber Defense Operations & Command Hub",
  description: "Centralized, strategic operating system for cybersecurity defense operations, events, and CTF wargames.",
  manifest: "/manifest.json",
  icons: {
    icon: "/ck-logo.svg",
    shortcut: "/ck-logo.svg",
    apple: "/ck-logo.svg",
  },
  other: {
    "theme-color": "#00F5D4",
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
          <ThemeBrandingProvider>
            <AuthProvider>
              <CyberDialogProvider>
                {children}
                <PWARegistration />
                <NetworkInspectionGuard />
              </CyberDialogProvider>
            </AuthProvider>
          </ThemeBrandingProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
