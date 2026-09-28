import { Button } from "@/components/ui/button";
import { changeTeamRole } from "@/server/team-actions";
import { roleLabel } from "@/server/team";
import type { WorkspaceRole } from "@/server/workspace-repository";

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
      <select
        id={`papel-${userId}`}
        name="role"
        defaultValue={role}
        className="h-11 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {roles.map((item) => (
          <option key={item} value={item}>
            {roleLabel(item)}
          </option>
        ))}
      </select>
      <Button type="submit" variant="outline" className="min-h-11">
        Salvar
      </Button>
    </form>
  );
}
