"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

const options = [
  { value: "light", icon: Sun, key: "themeLight" },
  { value: "dark", icon: Moon, key: "themeDark" },
  { value: "system", icon: Monitor, key: "themeSystem" },
] as const;

const noop = () => () => {};

export function ThemeSwitcher() {
  const t = useTranslations("shell");
  const { theme, setTheme } = useTheme();
  // O tema só é conhecido no navegador; no servidor nenhum botão fica marcado
  // para não haver diferença de hidratação.
  const mounted = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

  return (
    <div
      role="radiogroup"
      aria-label={t("theme")}
      className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1"
    >
      {options.map(({ value, icon: Icon, key }) => {
        const checked = mounted && theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={t(key)}
            title={t(key)}
            onClick={() => setTheme(value)}
            className={cn(
              "flex min-h-11 items-center justify-center rounded-md text-muted-foreground transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
              checked && "bg-background text-foreground shadow-sm",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
