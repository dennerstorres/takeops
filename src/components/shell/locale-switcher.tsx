"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useId, useTransition } from "react";
import { toast } from "sonner";
import { locales } from "@/i18n/locale";
import { setLocaleAction } from "@/server/locale-actions";

export function LocaleSwitcher() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const id = useId();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-1 px-3 pb-2">
      <label htmlFor={id} className="text-xs text-muted-foreground">
        {t("shell.language")}
      </label>
      <select
        id={id}
        value={locale}
        disabled={pending}
        className="min-h-11 rounded-lg border bg-background px-2 text-sm"
        onChange={(event) => {
          const next = event.target.value;
          startTransition(async () => {
            const result = await setLocaleAction(next);
            if (!result.ok) {
              toast.error(t("locale.saveFailed"));
              return;
            }
            router.refresh();
          });
        }}
      >
        {locales.map((value) => (
          <option key={value} value={value}>
            {t(`locale.${value}`)}
          </option>
        ))}
      </select>
    </div>
  );
}
