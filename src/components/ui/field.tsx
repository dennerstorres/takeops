import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

function Field({
  id,
  label,
  error,
  children,
  className,
}: {
  id: string;
  label: ReactNode;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export { Field };
