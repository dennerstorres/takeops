"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useId, useTransition } from "react";
import { toast } from "sonner";
import { locales } from "@/i18n/locale";
import { setLocaleAction } from "@/server/locale-actions";
import { Select } from "@/components/ui/input";

export function LocaleSwitcher() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const id = useId();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs text-muted-foreground">
        {t("shell.language")}
      </label>
      <Select
        id={id}
        value={locale}
        disabled={pending}

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
      </Select>
    </div>
  );
}
