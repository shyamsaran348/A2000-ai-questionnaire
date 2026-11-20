import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import SiteFooter from "@/components/SiteFooter";

// Self-hosted at build time: no external font request, no flash of unstyled text.
const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "A2000 | AI Enablement",
  description: "A2000 AI Enablement — Confidential Enterprise Discovery Assessment",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${plex.variable} ${plexMono.variable}`}>
      <head>
        <link rel="preload" href="/a2000-logo-cropped.png" as="image" />
      </head>
      <body className="flex min-h-screen flex-col font-sans text-[15px] leading-normal">
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
