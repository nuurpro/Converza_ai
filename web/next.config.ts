import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Pipeline endpoints → FastAPI (port 8000)
      {
        source: "/api/pipeline/:path*",
        destination: "http://localhost:8000/api/pipeline/:path*",
      },
      {
        source: "/api/pipeline",
        destination: "http://localhost:8000/api/pipeline",
      },
      // Brand Passport CRUD → FastAPI
      {
        source: "/api/brand-passport/:path*",
        destination: "http://localhost:8000/api/brand-passport/:path*",
      },
      // Orchestrator (legacy) → FastAPI
      {
        source: "/api/orchestrate",
        destination: "http://localhost:8000/api/orchestrate",
      },
      // Health check → FastAPI
      {
        source: "/health",
        destination: "http://localhost:8000/health",
      },
      // /api/chat is handled by Next.js API route (app/api/chat/route.ts)
      // — no rewrite needed, it goes to OpenClaw via the translation proxy
    ];
  },
};

export default nextConfig;
