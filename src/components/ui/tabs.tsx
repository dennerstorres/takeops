import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

function TabNav({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <nav
      data-slot="tab-nav"
      aria-label={label}
      className={cn("flex gap-1 overflow-x-auto", className)}
    >
      {children}
    </nav>
  );
}

function TabLink({
  href,
  current = false,
  children,
}: {
  href: string;
  current?: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={cn(
        "inline-flex min-h-11 shrink-0 items-center rounded-lg px-3 text-sm",
        current ? "bg-muted font-medium" : "text-muted-foreground",
      )}
    >
      {children}
    </Link>
  );
}

export { TabLink, TabNav };
