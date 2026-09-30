import { getLocale } from "next-intl/server";
import { isLocale } from "@/i18n/locale";
import { auth } from "@/server/auth";
import { scriptTemplate } from "@/server/script-template";
import { markdownDownload } from "@/lib/markdown-download";

export const dynamic = "force-dynamic";

// O modelo não depende da produção; a rota fica aqui para o botão da aba
// Roteiro apontar para perto de onde o arquivo será importado.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return new Response(null, { status: 401 });
  const locale = await getLocale();
  return markdownDownload(
    scriptTemplate(isLocale(locale) ? locale : "en"),
    isLocale(locale) && locale === "pt-BR"
      ? "modelo-de-roteiro.md"
      : "script-template.md",
  );
}
