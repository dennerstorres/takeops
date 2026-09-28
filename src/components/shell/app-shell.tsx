"use client";

import { Menu } from "lucide-react";
import { ShellNav } from "@/components/shell/shell-nav";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-background">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-background focus:px-3 focus:py-2 focus:ring-3 focus:ring-ring/50"
      >
        Ir para o conteúdo
      </a>
      <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="px-5 pt-5 pb-2">
          <p className="text-sm leading-tight font-medium">
            Video Production Manager
          </p>
        </div>
        <ShellNav />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-2 border-b px-3 md:hidden">
          <Sheet>
            <SheetTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  className="size-11"
                  aria-label="Abrir menu"
                />
              }
            >
              <Menu />
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-72 max-w-[85vw] bg-sidebar p-0"
            >
              <SheetHeader className="pr-12">
                <SheetTitle>Video Production Manager</SheetTitle>
              </SheetHeader>
              <ShellNav />
            </SheetContent>
          </Sheet>
          <p className="truncate text-sm font-medium">
            Video Production Manager
          </p>
        </header>
        <main id="conteudo" className="flex-1 px-4 py-6 md:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
