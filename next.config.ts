import type { NextConfig } from "next";

const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors 'self' https://your-dsfinance.vercel.app" },
        ],
      },
    ];
  },
};

export default nextConfig;
