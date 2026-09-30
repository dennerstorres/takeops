"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { changeTeamRole } from "@/server/team-actions";
import type { WorkspaceRole } from "@/server/workspace-repository";
import { Select } from "@/components/ui/input";

export function MemberRoleForm({
  userId,
  role,
  roles,
}: {
  userId: string;
  role: WorkspaceRole;
  roles: WorkspaceRole[];
}) {
  const t = useTranslations();
  return (
    <form action={changeTeamRole} className="flex shrink-0 items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <label className="sr-only" htmlFor={`papel-${userId}`}>
        {t("team.role")}
      </label>
      <Select id={`papel-${userId}`} name="role" defaultValue={role}>
        {roles.map((item) => (
          <option key={item} value={item}>
            {t(`team.roles.${item}`)}
          </option>
        ))}
      </Select>
      <Button type="submit" variant="outline" className="min-h-11">
        {t("team.save")}
      </Button>
    </form>
  );
}
