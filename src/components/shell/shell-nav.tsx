import Link from "next/link";
import { cn } from "@/lib/utils";
import { shellNavItems } from "@/components/shell/navigation";

const itemClass =
  "flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium";

export function ShellNav() {
  return (
    <nav aria-label="Principal" className="flex flex-col gap-1 p-3">
      {shellNavItems.map((item) => {
        const Icon = item.icon;

        if (!item.href) {
          return (
            <span
              key={item.label}
              className={cn(itemClass, "text-muted-foreground")}
            >
              <Icon aria-hidden="true" />
              {item.label}
            </span>
          );
        }

        return (
          <Link
            key={item.label}
            href={item.href}
            aria-current="page"
            className={cn(
              itemClass,
              "bg-sidebar-accent text-sidebar-accent-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
            )}
          >
            <Icon aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
