import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // O dev server trata 127.0.0.1 como outra origem e bloqueia o HMR.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
