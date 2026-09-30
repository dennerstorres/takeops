"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Erro inesperado numa página. O detalhe fica no log do servidor.
export function RouteError({ reset }: { reset: () => void }) {
  const t = useTranslations();
  return (
    <div
      role="alert"
      className="mx-auto flex w-full max-w-3xl flex-col items-start gap-3"
    >
      <h1 className="font-condensed text-xl font-semibold tracking-wider uppercase">
        {t("routeError.title")}
      </h1>
      <p className="text-sm text-muted-foreground">
        {t("routeError.description")}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" className="min-h-11" onClick={() => reset()}>
          {t("routeError.retry")}
        </Button>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center px-2 text-sm font-medium underline-offset-4 hover:underline"
        >
          {t("notFound.home")}
        </Link>
      </div>
    </div>
  );
}
