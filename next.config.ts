import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A stray lockfile in the parent directory (~/Desktop) otherwise makes
  // Next.js misdetect the workspace root.
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.sanity.io" },
      { protocol: "https", hostname: "images.museofseoul.com" },
    ],
  },
};

export default nextConfig;
