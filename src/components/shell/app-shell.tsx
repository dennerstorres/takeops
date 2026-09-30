"use client";

import { Bell, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { LocaleSwitcher } from "@/components/shell/locale-switcher";
import { LogoutButton } from "@/components/shell/logout-button";
import { ShellNav } from "@/components/shell/shell-nav";
import { ThemeSwitcher } from "@/components/shell/theme-switcher";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

function initials(label: string) {
  const parts = label.split(/[\s@.]+/).filter(Boolean);
  return (
    (parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[1][0] : "")
  ).toUpperCase();
}

const barButton =
  "relative flex size-11 shrink-0 items-center justify-center rounded-[2px] text-frame-foreground transition-colors duration-150 hover:bg-card/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring";

// Marca impressa no canto do quadro, como o título no cabeçalho do stripboard.
function Brand({ workspaceName }: { workspaceName: string }) {
  return (
    <Link
      href="/"
      className="flex min-w-0 flex-col justify-center rounded-[2px] leading-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <span className="font-condensed text-base font-semibold tracking-[0.08em] uppercase">
        TakeOps
      </span>
      <span className="mt-0.5 truncate font-condensed text-xs text-frame-foreground/80">
        {workspaceName}
      </span>
    </Link>
  );
}

// Conta, tema e idioma: painel à direita, igual no desktop e no celular.
function AccountSheet({ userLabel }: { userLabel: string }) {
  const t = useTranslations("shell");
  return (
    <Sheet>
      <SheetTrigger
        render={<button type="button" className={barButton} />}
        aria-label={t("account")}
      >
        <span
          aria-hidden="true"
          className="flex size-7 items-center justify-center rounded-[2px] bg-divider font-condensed text-xs font-semibold tracking-wider text-divider-foreground"
        >
          {initials(userLabel)}
        </span>
      </SheetTrigger>
      <SheetContent side="right" className="w-72 max-w-[85vw] gap-0 p-0">
        <SheetHeader className="border-b pr-12">
          <SheetTitle className="font-condensed text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {t("account")}
          </SheetTitle>
          <p className="truncate text-sm font-medium">{userLabel}</p>
        </SheetHeader>
        <div className="flex flex-col gap-4 p-4">
          <ThemeSwitcher />
          <LocaleSwitcher />
          <LogoutButton className="w-full" />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function AppShell({
  children,
  userLabel,
  workspaceName,
  unread = 0,
}: {
  children: React.ReactNode;
  userLabel: string;
  workspaceName: string;
  unread?: number;
}) {
  const t = useTranslations("shell");
  const pathname = usePathname();
  const [menu, setMenu] = useState({ open: false, path: pathname });
  // Navegar fecha o menu mobile: o link leva a outra página e o painel
  // aberto esconderia o conteúdo que acabou de carregar.
  if (menu.open && menu.path !== pathname)
    setMenu({ open: false, path: pathname });
  const counts = { "/avisos": unread };

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-[2px] focus:bg-card focus:px-3 focus:py-2 focus:outline-2 focus:outline-ring"
      >
        {t("skipToContent")}
      </a>
      <header className="sticky top-0 z-30 border-b-2 border-divider bg-frame text-frame-foreground">
        <div className="flex h-12 items-center gap-2 px-1.5 lg:gap-4 lg:px-3">
          <Sheet
            open={menu.open}
            onOpenChange={(open) => setMenu({ open, path: pathname })}
          >
            <SheetTrigger
              render={
                <button
                  type="button"
                  className={`${barButton} lg:hidden`}
                  aria-label={t("openMenu")}
                />
              }
            >
              <Menu className="size-5" aria-hidden="true" />
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-72 max-w-[85vw] gap-0 bg-frame p-0 text-frame-foreground"
            >
              <SheetHeader className="pr-12">
                <SheetTitle className="sr-only">{t("mainNav")}</SheetTitle>
                <Brand workspaceName={workspaceName} />
              </SheetHeader>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <ShellNav counts={counts} />
              </div>
            </SheetContent>
          </Sheet>
          <Brand workspaceName={workspaceName} />
          <div className="hidden min-w-0 flex-1 self-stretch border-l border-frame-foreground/20 pl-3 lg:flex lg:items-center">
            <ShellNav counts={counts} variant="bar" />
          </div>
          <div className="ml-auto flex items-center lg:ml-0">
            <Link
              href="/avisos"
              aria-label={
                unread > 0
                  ? t("notificationsUnread", { count: unread })
                  : t("notificationsLink")
              }
              className={barButton}
            >
              <Bell className="size-5" aria-hidden="true" />
              {unread > 0 ? (
                <span
                  aria-hidden="true"
                  className="absolute top-1.5 right-0.5 min-w-4 rounded-[2px] bg-divider px-1 text-center font-condensed text-[0.6875rem] leading-4 text-divider-foreground tabular-nums"
                >
                  {unread > 99 ? "99+" : unread}
                </span>
              ) : null}
            </Link>
            <AccountSheet userLabel={userLabel} />
          </div>
        </div>
      </header>
      <main id="conteudo" className="flex-1 px-3 py-4 md:px-5 md:py-5">
        {children}
      </main>
    </div>
  );
}
