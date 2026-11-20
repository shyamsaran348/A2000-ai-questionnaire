import type { Metadata } from "next";
import "./globals.css";
import SiteFooter from "@/components/SiteFooter";

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
    <html lang="en">
      <head>
        <link rel="preload" href="/a2000-logo.png" as="image" />
      </head>
      <body className="flex min-h-screen flex-col font-sans text-[15px] leading-normal antialiased">
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
