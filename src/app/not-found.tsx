import { getTranslations } from "next-intl/server";
import Link from "next/link";

export default async function NotFound() {
  const t = await getTranslations();
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col justify-center gap-3 px-4">
      <h1 className="font-condensed text-xl font-semibold tracking-wider uppercase">
        {t("notFound.title")}
      </h1>
      <p className="text-sm text-muted-foreground">
        {t("notFound.description")}
      </p>
      <Link
        href="/"
        className="inline-flex min-h-11 items-center text-sm font-medium underline-offset-4 hover:underline"
      >
        {t("notFound.home")}
      </Link>
    </main>
  );
}
