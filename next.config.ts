import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Idioma resolvido por requisição, sem prefixo na URL (ADR-041).
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Imagem Docker enxuta: só o servidor e o que ele importa (ADR-037).
  output: "standalone",
  // O dev server trata 127.0.0.1 como outra origem e bloqueia o HMR.
  allowedDevOrigins: ["127.0.0.1"],
};

export default withNextIntl(nextConfig);
