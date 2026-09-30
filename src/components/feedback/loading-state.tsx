"use client";

import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";

export function LoadingState({ label }: { label?: string }) {
  const t = useTranslations("common");
  return (
    <div
      role="status"
      aria-live="polite"
      className="space-y-3 rounded-md border bg-card p-6"
    >
      <span className="sr-only">{label ?? t("loading")}</span>
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}
