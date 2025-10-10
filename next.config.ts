import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  outputFileTracingRoot: __dirname,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  distDir: "out",
  generateBuildId: async () => {
    return "build";
  },
};

export default nextConfig;
