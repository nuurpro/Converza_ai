import type { Metadata } from "next";
import { Geist, JetBrains_Mono, Instrument_Serif } from "next/font/google";

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
  title: "Converza — Autonomous Revenue Team",
  description:
    "Fire your $5,000 marketing agency. Hire a 19-agent AI team that creates video ads and closes inbound DMs 24/7.",
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${geist.variable} ${mono.variable} ${serif.variable} landing-page relative min-h-screen bg-[#F9F8F6] text-[#1C1B19] antialiased`}
      style={{ fontFamily: "var(--font-geist), Inter, system-ui, sans-serif" }}
    >
      {/* Faint architectural grid background */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(68,64,60,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(68,64,60,0.045) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage:
            "radial-gradient(ellipse at center, black 0%, black 60%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 0%, black 60%, transparent 100%)",
        }}
      />
      {/* Override the global dark body bg for marketing routes. */}
      <style>{`
        html, body { background: #F9F8F6 !important; color: #1C1B19 !important; }
        html { color-scheme: light !important; }
        .landing-page h1,
        .landing-page h2,
        .landing-page h3 {
          font-family: var(--font-serif), Georgia, Cambria, "Times New Roman", serif;
          font-weight: 400;
          letter-spacing: -0.035em;
        }
      `}</style>
      {/* Global noise texture */}
      <svg
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[1] h-full w-full opacity-[0.04] mix-blend-multiply"
      >
        <filter id="converza-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="2"
            stitchTiles="stitch"
          />
          <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#converza-noise)" />
      </svg>
      <div className="relative z-[2]">{children}</div>
    </div>
  );
}
