import { headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { resolveLocale } from "@/i18n/locale";
import { auth } from "@/server/auth";

export default getRequestConfig(async () => {
  // Página pública não tem sessão; aí vale só o navegador.
  const session = await auth().catch(() => null);
  const locale = resolveLocale(
    session?.user?.locale,
    (await headers()).get("accept-language"),
  );
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
