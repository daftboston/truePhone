import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : "127.0.0.1";

/**
 * Listing gallery / possession / identity photo uploads. Clients compress to
 * ~900 KB first (see src/lib/images/compress-image.ts); this ceiling only
 * catches originals that skipped compression. Kept at 4 MB because Vercel caps
 * function request bodies near 4.5 MB — a higher value would surface as a
 * platform 413 instead of our Spanish error.
 * Restart `next dev` after changing this — Turbopack does not always hot-reload it.
 */
const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHost,
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
