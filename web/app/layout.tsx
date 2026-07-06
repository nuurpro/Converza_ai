import type { Metadata } from "next";
import {
  Geist,
  JetBrains_Mono,
  Instrument_Serif,
  Syne,
  DM_Sans,
  DM_Mono,
} from "next/font/google";
import MainLayout from "@/components/layout/MainLayout";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["italic", "normal"],
  variable: "--font-serif",
  display: "swap",
});

const workspaceDisplay = Syne({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
});

const workspaceSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-sans",
  display: "swap",
});

const workspaceMono = DM_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Converza — Agent Workspace",
  description: "A squad of named AI agents for marketing, sales, and video execution.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${mono.variable} ${serif.variable} ${workspaceDisplay.variable} ${workspaceSans.variable} ${workspaceMono.variable}`}
      style={{ colorScheme: "light" }}
    >
      <body className={`${geist.className} font-sans`}>
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  );
}
