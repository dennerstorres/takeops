import {
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
  href?: string;
  icon: LucideIcon;
};

// As outras rotas entram na APP-001. Equipe existe desde a TEAM-001.
export const shellNavItems: ShellNavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Ideias", icon: Lightbulb },
  { label: "Produções", icon: Clapperboard },
  { label: "Calendário", icon: Calendar },
  { label: "Templates", icon: LayoutTemplate },
  { label: "Equipe", href: "/equipe", icon: Users },
  { label: "Configurações", icon: Settings },
];
