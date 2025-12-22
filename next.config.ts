import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "api.yoldosh.uz",
        port: "",
        pathname: "**",
      },
    ],
  },
};

export default nextConfig;
