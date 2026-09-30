import * as React from "react";
import { cn } from "@/lib/utils";

const surfaceClass = "rounded-md border bg-card text-card-foreground";

const surfaceLinkClass =
  "flex min-h-11 rounded-md border bg-card text-card-foreground transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring";

function Card({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="card"
      className={cn(
        "rounded-md border bg-card p-3 text-card-foreground sm:p-4",
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex flex-col gap-1", className)}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="card-title"
      className={cn(
        "font-condensed text-sm font-semibold tracking-wider uppercase",
        className,
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  surfaceClass,
  surfaceLinkClass,
};
