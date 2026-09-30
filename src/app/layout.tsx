import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Sans_Condensed } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
});
// Letra do cabeçalho impresso e das tiras: estreita para caber a etiqueta
// inteira (nº, título, dono, data) numa linha de 28px.
const plexCondensed = IBM_Plex_Sans_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-strip",
});

// Contrato de direção do redesign (ADR-045), mantido no HTML de produção
// para a revisão final conferir a tela contra ele.
const directionContract = `<!--
THESIS: cada produção e cada cena é uma tira fina no quadro; a cor da tira é a etapa. Recusa cards arredondados em colunas.
OWN-WORLD: tiras de 28px em cartolina dessaturada (branco, amarelo, azul, verde, cinza) com código de letra; divisórias pretas; moldura de alumínio; cabeçalho impresso em Plex Condensed caixa-alta; cantos de 4px; estado pela ponta da tira (contínuo, riscado, vazado).
STORY: a equipe vê de relance o que está em cada etapa, quem cuida e quando grava, e abre a tira para agir.
FIRST VIEWPORT: barra do quadro fina no topo (marca, navegação impressa, avisos, conta); abaixo, o quadro na largura toda, grupos por etapa separados por tiras pretas; nova produção à direita da barra de filtros.
FORM: Quadro de tiras (stripboard), escolhido na rodada de direções; seed f096d5ba; build code-led.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
-->`;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return {
    title: "Video Production Manager",
    description: t("description"),
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      className={cn("font-sans", plexSans.variable, plexCondensed.variable)}
      suppressHydrationWarning
    >
      <body>
        <div hidden dangerouslySetInnerHTML={{ __html: directionContract }} />
        <NextIntlClientProvider>
          <ThemeProvider>
            {children}
            <Toaster />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
