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

// Rotas além do Dashboard entram na APP-001. O shell já mostra a navegação da spec.
export const shellNavItems: ShellNavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Ideias", icon: Lightbulb },
  { label: "Produções", icon: Clapperboard },
  { label: "Calendário", icon: Calendar },
  { label: "Templates", icon: LayoutTemplate },
  { label: "Equipe", icon: Users },
  { label: "Configurações", icon: Settings },
];
