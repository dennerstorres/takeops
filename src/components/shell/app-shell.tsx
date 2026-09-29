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
import { Button } from "@/components/ui/button";
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

function Brand({ workspaceName }: { workspaceName: string }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-sm leading-tight font-medium">
        Video Production Manager
      </p>
      <p className="truncate text-sm text-muted-foreground">{workspaceName}</p>
    </div>
  );
}

// Conta, tema e idioma ficam juntos no pé do menu, no desktop e no mobile.
function AccountPanel({ userLabel }: { userLabel: string }) {
  return (
    <div className="flex flex-col gap-3 border-t border-sidebar-border p-3">
      <div className="flex min-w-0 items-center gap-3 px-1">
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs font-medium text-sidebar-accent-foreground"
        >
          {initials(userLabel)}
        </span>
        <p className="min-w-0 truncate text-sm">{userLabel}</p>
      </div>
      <ThemeSwitcher />
      <LocaleSwitcher />
      <LogoutButton className="w-full" />
    </div>
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
    <div className="flex min-h-dvh bg-background">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-background focus:px-3 focus:py-2 focus:ring-3 focus:ring-ring/50"
      >
        {t("skipToContent")}
      </a>
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
        <div className="px-5 pt-5 pb-2">
          <Brand workspaceName={workspaceName} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ShellNav counts={counts} />
        </div>
        <AccountPanel userLabel={userLabel} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur md:hidden">
          <Sheet
            open={menu.open}
            onOpenChange={(open) => setMenu({ open, path: pathname })}
          >
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-11"
                  aria-label={t("openMenu")}
                />
              }
            >
              <Menu />
            </SheetTrigger>
            <SheetContent
              side="left"
              className="flex w-72 max-w-[85vw] flex-col gap-0 bg-sidebar p-0 text-sidebar-foreground"
            >
              <SheetHeader className="pr-12">
                <SheetTitle className="sr-only">{t("mainNav")}</SheetTitle>
                <Brand workspaceName={workspaceName} />
              </SheetHeader>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <ShellNav counts={counts} />
              </div>
              <AccountPanel userLabel={userLabel} />
            </SheetContent>
          </Sheet>
          <p className="min-w-0 flex-1 truncate text-sm font-medium">
            {workspaceName}
          </p>
          <Link
            href="/avisos"
            aria-label={
              unread > 0
                ? t("notificationsUnread", { count: unread })
                : t("notificationsLink")
            }
            className="relative flex size-11 items-center justify-center rounded-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <Bell className="size-5" aria-hidden="true" />
            {unread > 0 ? (
              <span
                aria-hidden="true"
                className="absolute top-1.5 right-1.5 min-w-5 rounded-full bg-primary px-1 text-center text-xs leading-5 text-primary-foreground tabular-nums"
              >
                {unread > 99 ? "99+" : unread}
              </span>
            ) : null}
          </Link>
        </header>
        <main id="conteudo" className="flex-1 px-4 py-6 md:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
