"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

export function ErrorState({
  title,
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  const t = useTranslations("common");
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-xl border border-destructive/30 bg-destructive-muted p-6"
    >
      <div className="space-y-1">
        <h2 className="text-base font-medium">{title ?? t("loadFailed")}</h2>
        <p className="text-sm text-destructive">
          {description ?? t("tryAgain")}
        </p>
      </div>
      {action}
    </div>
  );
}
