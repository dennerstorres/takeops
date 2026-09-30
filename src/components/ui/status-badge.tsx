import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { statusTone, type StatusTone } from "@/components/ui/status-tone";

// Tom "primary" usa accent: o par accent/accent-foreground já passa AA
// e não existe primary-muted.
const toneClass: Record<StatusTone, string> = {
  muted: "bg-muted text-foreground",
  info: "bg-info-muted text-info",
  primary: "bg-accent text-accent-foreground",
  warning: "bg-warning-muted text-warning",
  success: "bg-success-muted text-success",
  destructive: "bg-destructive-muted text-destructive",
};

function StatusBadge({
  status,
  tone,
  children,
  className,
}: {
  status?: string;
  tone?: StatusTone;
  children: ReactNode;
  className?: string;
}) {
  const resolved = tone ?? (status ? statusTone(status) : "muted");
  return (
    <span
      data-slot="status-badge"
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        toneClass[resolved],
        className,
      )}
    >
      {children}
    </span>
  );
}

export { StatusBadge };
