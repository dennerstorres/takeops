"use client";

import { MoreHorizontal } from "lucide-react";
import { useState, type ReactNode } from "react";
import { stripIconButton } from "@/components/ui/strip";
import { cn } from "@/lib/utils";

// Ações da tira. No desktop ficam em linha e esmaecidas até a tira receber
// foco ou ponteiro; no celular recolhem num botão de 44px para a tira
// continuar fina.
export function StripActions({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative flex justify-end">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={cn(stripIconButton, "sm:hidden")}
      >
        <MoreHorizontal aria-hidden="true" />
      </button>
      <span
        data-open={open ? "" : undefined}
        className="absolute top-full right-0 z-20 mt-1 hidden gap-0.5 rounded-md border bg-popover p-1 shadow-md data-open:flex sm:static sm:mt-0 sm:flex sm:border-0 sm:bg-transparent sm:p-0 sm:opacity-60 sm:shadow-none sm:transition-opacity sm:group-focus-within:opacity-100 sm:group-hover:opacity-100"
      >
        {children}
      </span>
    </span>
  );
}
