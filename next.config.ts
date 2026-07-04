import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Listing photos live on Cloudflare R2 behind the CDN — never on hosting disk.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.r2.dev" },
      { protocol: "https", hostname: "img.propia.com.py" },
    ],
  },
  // Shared-hosting friendly: standalone output keeps the deployed footprint small.
  output: "standalone",
};

export default nextConfig;
