import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [
      { hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
