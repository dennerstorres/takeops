import { Button } from "@/components/ui/button";
import { changeTeamRole } from "@/server/team-actions";
import { roleLabel } from "@/server/team";
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
  return (
    <form action={changeTeamRole} className="flex shrink-0 items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <label className="sr-only" htmlFor={`papel-${userId}`}>
        Papel
      </label>
      <Select id={`papel-${userId}`} name="role" defaultValue={role}>
        {roles.map((item) => (
          <option key={item} value={item}>
            {roleLabel(item)}
          </option>
        ))}
      </Select>
      <Button type="submit" variant="outline" className="min-h-11">
        Salvar
      </Button>
    </form>
  );
}
