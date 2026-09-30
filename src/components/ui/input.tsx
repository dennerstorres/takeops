import * as React from "react";
import { cn } from "@/lib/utils";

// text-base no mobile evita o zoom do iOS ao focar (DESIGN.md).
const controlClass =
  "w-full rounded-lg border border-input bg-transparent px-3 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm";

function withHeight(className: string | undefined, fallback: string) {
  if (className && /\b(?:min-h-|h-)/.test(className)) return className;
  return cn(fallback, className);
}

function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      data-slot="input"
      className={cn(controlClass, withHeight(className, "min-h-11"))}
      {...props}
    />
  );
}

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(controlClass, "py-2", withHeight(className, "min-h-24"))}
      {...props}
    />
  );
}

function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className={cn(controlClass, withHeight(className, "min-h-11"))}
      {...props}
    />
  );
}

function Checkbox({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type="checkbox"
      data-slot="checkbox"
      className={cn(
        "size-5 shrink-0 rounded border border-input accent-primary disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Checkbox, Input, Select, Textarea };
