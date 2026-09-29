"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { shellNavItems } from "@/components/shell/navigation";

const itemClass =
  "flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium";

function isCurrent(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

// Contagens por href (hoje só avisos não lidos), vindas do servidor.
export function ShellNav({ counts = {} }: { counts?: Record<string, number> }) {
  const pathname = usePathname();
  const t = useTranslations("shell");

  return (
    <nav aria-label={t("mainNav")} className="flex flex-col gap-1 p-3">
      {shellNavItems.map((item) => {
        const Icon = item.icon;

        const current = isCurrent(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={current ? "page" : undefined}
            className={cn(
              itemClass,
              "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
              current
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/60",
            )}
          >
            <Icon className="size-5" aria-hidden="true" />
            {t(`nav.${item.labelKey}`)}
            {counts[item.href] ? (
              <span className="ml-auto rounded-full bg-primary px-2 text-xs text-primary-foreground tabular-nums">
                {counts[item.href]}
                <span className="sr-only">{t("unreadSuffix")}</span>
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
