import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allows running standalone node server in Docker/production container deployments
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
