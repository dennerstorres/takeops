import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Video Production Manager",
  description: "Organização da produção de vídeos, da ideia à publicação.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
