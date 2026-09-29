import type { NextConfig } from "next";

const maxUploadSizeMb = Number(process.env.MAX_UPLOAD_SIZE_MB) || 20;

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.9.200.75"],
  experimental: {
    serverActions: {
      bodySizeLimit: `${maxUploadSizeMb}mb`,
    },
  },
};

export default nextConfig;
