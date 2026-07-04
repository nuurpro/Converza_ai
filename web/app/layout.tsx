import type { Metadata } from "next";
import { Geist, JetBrains_Mono, Instrument_Serif } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Converza — Co-Pilot",
  description: "Autonomous AI marketing swarm for e-commerce businesses",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${mono.variable} ${serif.variable}`}
      style={{ colorScheme: "light" }}
    >
      <body className={`${geist.className} font-sans`}>
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  );
}
