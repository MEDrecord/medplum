import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@mrd/ui", "@mrd/sdk", "@mrd/shared"],
};

export default nextConfig;
