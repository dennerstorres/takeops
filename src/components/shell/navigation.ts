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
  label: string;
  href: string;
  icon: LucideIcon;
};

export const shellNavItems: ShellNavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Avisos", href: "/avisos", icon: Bell },
  { label: "Ideias", href: "/ideias", icon: Lightbulb },
  { label: "Produções", href: "/producoes", icon: Clapperboard },
  { label: "Calendário", href: "/calendario", icon: Calendar },
  { label: "Templates", href: "/templates", icon: LayoutTemplate },
  { label: "Equipe", href: "/equipe", icon: Users },
  { label: "Configurações", href: "/configuracoes", icon: Settings },
];
