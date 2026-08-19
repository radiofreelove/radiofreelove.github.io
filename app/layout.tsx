import type { Metadata, Viewport } from "next";
import { withBasePath } from "../lib/base-path";
import "./globals.css";

export const metadata: Metadata = {
  title: "Identity Navigator — WA · OR · ID · UT",
  description:
    "A private, state-aware guide that prepares official adult identity-change court PDF packets on your device.",
  applicationName: "Identity Navigator",
  manifest: withBasePath("/manifest.webmanifest"),
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Identity Navigator",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
  icons: {
    icon: [
      { url: withBasePath("/icon.svg"), type: "image/svg+xml" },
      {
        url: withBasePath("/icons/icon-192.png"),
        sizes: "192x192",
        type: "image/png",
      },
    ],
    shortcut: withBasePath("/icon.svg"),
    apple: [
      {
        url: withBasePath("/icons/apple-touch-icon.png"),
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e5e8dc" },
    { media: "(prefers-color-scheme: dark)", color: "#111917" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
