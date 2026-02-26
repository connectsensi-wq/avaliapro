import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ hostname: "images.pexels.com" }],
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;