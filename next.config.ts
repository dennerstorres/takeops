import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Imagem Docker enxuta: só o servidor e o que ele importa (ADR-037).
  output: "standalone",
  // O dev server trata 127.0.0.1 como outra origem e bloqueia o HMR.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
