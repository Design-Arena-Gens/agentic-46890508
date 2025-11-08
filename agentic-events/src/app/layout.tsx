import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://agentic-46890508.vercel.app"),
  title: "Atlas Agent | Live World Event Intelligence",
  description:
    "Realtime agent that aggregates and normalizes breaking events from trusted international newsrooms.",
  openGraph: {
    title: "Atlas Agent",
    description:
      "Stay ahead of unfolding global events with a unified intelligence feed.",
    url: "https://agentic-46890508.vercel.app",
    siteName: "Atlas Agent",
  },
  twitter: {
    card: "summary_large_image",
    title: "Atlas Agent | Live World Event Intelligence",
    description:
      "Realtime agent that aggregates and normalizes breaking events from trusted international newsrooms.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
