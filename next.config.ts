import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Listing photos live on Cloudflare R2 behind the CDN — never on hosting disk.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.r2.dev" },
      { protocol: "https", hostname: "img.propia.com.py" },
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
  // Shared-hosting friendly: standalone output keeps the deployed footprint small.
  output: "standalone",
  experimental: {
    /**
     * The import upload posts the spreadsheet itself to a server action, twice
     * — once to preview, once to commit — so the bytes the operator approved
     * are the bytes that get written. The 1 MB default cuts that off at a few
     * hundred rows. `MAX_UPLOAD_BYTES` in lib/import/intake.ts is the real
     * limit and is set below this on purpose, so an oversized file gets a
     * Spanish error instead of a framework stack trace.
     */
    serverActions: { bodySizeLimit: "8mb" },
  },
};

export default nextConfig;
