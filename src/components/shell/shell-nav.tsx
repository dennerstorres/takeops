"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { shellNavItems } from "@/components/shell/navigation";

function isCurrent(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

// "bar" é o cabeçalho impresso do quadro no desktop; "sheet" é a lista do
// menu no celular. Nos dois a página atual é a tira clara no trilho.
const layout = {
  bar: {
    nav: "flex items-center gap-0.5",
    item: "h-8 px-2.5 font-condensed text-[0.8125rem] font-semibold tracking-wider uppercase",
  },
  sheet: {
    nav: "flex flex-col gap-px p-2",
    item: "min-h-11 px-3 text-sm font-medium",
  },
} as const;

// Contagens por href (hoje só avisos não lidos), vindas do servidor.
export function ShellNav({
  counts = {},
  variant = "sheet",
}: {
  counts?: Record<string, number>;
  variant?: keyof typeof layout;
}) {
  const pathname = usePathname();
  const t = useTranslations("shell");
  const styles = layout[variant];

  return (
    <nav aria-label={t("mainNav")} className={styles.nav}>
      {shellNavItems.map((item) => {
        const Icon = item.icon;
        const current = isCurrent(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={current ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-[2px] whitespace-nowrap transition-colors duration-150 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
              styles.item,
              current
                ? "bg-card text-card-foreground shadow-sm"
                : "text-frame-foreground hover:bg-card/50",
            )}
          >
            {variant === "sheet" ? (
              <Icon className="size-4" aria-hidden="true" />
            ) : null}
            {t(`nav.${item.labelKey}`)}
            {counts[item.href] ? (
              <span
                className={cn(
                  "rounded-[2px] bg-divider px-1.5 font-condensed text-xs leading-5 text-divider-foreground tabular-nums",
                  variant === "sheet" && "ml-auto",
                )}
              >
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
