import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : "127.0.0.1";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Listing gallery / possession uploads allow up to 5 MB (see listings actions).
  serverActions: {
    bodySizeLimit: "5mb",
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
