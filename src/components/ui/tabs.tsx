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
      className={cn(
        "flex gap-0.5 overflow-x-auto rounded-md bg-frame p-1 text-frame-foreground",
        className,
      )}
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
        "inline-flex h-11 shrink-0 items-center rounded-[2px] px-2.5 font-condensed text-[0.8125rem] font-semibold tracking-wider whitespace-nowrap uppercase transition-colors duration-150 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring sm:h-8",
        current ? "bg-card text-card-foreground shadow-sm" : "hover:bg-card/50",
      )}
    >
      {children}
    </Link>
  );
}

export { TabLink, TabNav };
