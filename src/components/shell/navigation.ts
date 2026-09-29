import {
  Bell,
  Calendar,
  Clapperboard,
  LayoutDashboard,
  LayoutTemplate,
  Lightbulb,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

export type ShellNavItem = {
  // Chave em `shell.nav` nos catálogos.
  labelKey:
    | "dashboard"
    | "notifications"
    | "ideas"
    | "projects"
    | "calendar"
    | "templates"
    | "team"
    | "settings";
  href: string;
  icon: LucideIcon;
};

export const shellNavItems: ShellNavItem[] = [
  { labelKey: "dashboard", href: "/", icon: LayoutDashboard },
  { labelKey: "notifications", href: "/avisos", icon: Bell },
  { labelKey: "ideas", href: "/ideias", icon: Lightbulb },
  { labelKey: "projects", href: "/producoes", icon: Clapperboard },
  { labelKey: "calendar", href: "/calendario", icon: Calendar },
  { labelKey: "templates", href: "/templates", icon: LayoutTemplate },
  { labelKey: "team", href: "/equipe", icon: Users },
  { labelKey: "settings", href: "/configuracoes", icon: Settings },
];
