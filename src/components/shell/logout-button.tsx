"use client";

import { useTranslations } from "next-intl";
import { logout } from "@/server/auth-actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LogoutButton({ className }: { className?: string }) {
  const t = useTranslations("shell");
  return (
    <form action={logout}>
      <Button
        type="submit"
        variant="ghost"
        className={cn("min-h-11 justify-start", className)}
      >
        {t("logout")}
      </Button>
    </form>
  );
}
