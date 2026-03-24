import type { Metadata, Viewport } from "next";

import { AppShell } from "@/components/app-shell";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "GymFlow",
    template: "%s | GymFlow"
  },
  description: "Set bazında ağırlık ve tekrar takibi yapan kişisel antrenman uygulaması.",
  applicationName: "GymFlow",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "GymFlow",
    statusBarStyle: "black-translucent"
  },
  formatDetection: {
    telephone: false
  },
  icons: {
    apple: [{ url: "/apple-touch-icon.png" }],
    icon: [{ url: "/icon-192.png" }, { url: "/icon-512.png" }]
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#050816",
  colorScheme: "dark"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
