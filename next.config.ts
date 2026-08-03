import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "images.pexels.com" },
      { hostname: "images.unsplash.com" },
    ],
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;