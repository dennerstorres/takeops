import * as React from "react";
import { cn } from "@/lib/utils";

function ItemList({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="item-list"
      className={cn(
        "flex flex-col divide-y rounded-md border bg-card",
        className,
      )}
      {...props}
    />
  );
}

function ItemListRow({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="item-list-row"
      className={cn("flex min-h-11 items-center gap-3 px-3 py-2", className)}
      {...props}
    />
  );
}

export { ItemList, ItemListRow };
