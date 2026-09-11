import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Sanity serves every image asset from its own CDN. Without this the
    // optimizer refuses the host and covers silently fail to load.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        pathname: "/images/**",
      },
    ],
  },
};

export default nextConfig;
