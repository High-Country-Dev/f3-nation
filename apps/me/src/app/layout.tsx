import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@acme/ui/toast";

import { AuthProvider } from "@/lib/auth/AuthProvider";
import { Navbar } from "@/components/navbar";
import { SaveProvider } from "@/lib/save-context";
import { GoogleAnalytics } from "@/components/google-analytics";
import { VersionInfo } from "@/components/version-info";
import { getChangelog } from "@/lib/changelog";
import { resolveBaseUrl } from "@/lib/utils";
import { env } from "@/env";
import packageJson from "../../package.json";

const inter = Inter({ subsets: ["latin"] });

// NEXT_PUBLIC_SITE_URL is typed required, but under skipValidation
// (CI/lint builds) env.* passes through unvalidated and can be
// undefined — resolveBaseUrl's fallback covers that.
const meBaseUrl = resolveBaseUrl(
  env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL,
  "http://localhost:3003",
);

export const metadata: Metadata = {
  metadataBase: meBaseUrl,
  title: "F3 Me — Profile Manager",
  description:
    "Manage your F3 Nation profile, avatar, emergency contacts, and more.",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const channel = env.F3_CHANNEL;
  const changelog = getChangelog().slice(0, 10);

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} flex min-h-screen flex-col overflow-x-hidden overscroll-y-none bg-background text-foreground antialiased`}
      >
        <GoogleAnalytics />
        <AuthProvider>
          <SaveProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <VersionInfo
              version={packageJson.version}
              channel={channel}
              changelog={changelog}
            />
          </SaveProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
