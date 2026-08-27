import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ThemeBrandingProvider } from "@/components/ThemeProvider";
import { PWARegistration } from "@/components/PWARegistration";
import { NetworkInspectionGuard } from "@/components/NetworkInspectionGuard";

export const metadata: Metadata = {
  title: "Chakravyuh Club — Digital Operations & Cyber Defense Hub",
  description: "Centralized, strategic operating system for the Chakravyuh Club",
  manifest: "/manifest.json",
  icons: {
    icon: "/ck-logo.svg",
    shortcut: "/ck-logo.svg",
    apple: "/ck-logo.svg",
  },
  other: {
    "theme-color": "#FFD700",
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
              {children}
              <PWARegistration />
              <NetworkInspectionGuard />
            </AuthProvider>
          </ThemeBrandingProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
