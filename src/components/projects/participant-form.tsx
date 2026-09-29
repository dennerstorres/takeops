import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  addParticipantAction,
  removeParticipantAction,
} from "@/server/participant-actions";
import {
  projectRoleLabel,
  projectRoles,
  type ProjectRole,
} from "@/server/participant-labels";

export function ParticipantForm({
  projectId,
  people,
  canManageApprovers,
}: {
  projectId: string;
  people: { id: string; label: string }[];
  canManageApprovers: boolean;
}) {
  const t = useTranslations();
  return (
    <form
      action={addParticipantAction}
      className="flex flex-wrap items-center gap-2"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <label className="sr-only" htmlFor={`pessoa-${projectId}`}>
        Pessoa
      </label>
      <select
        id={`pessoa-${projectId}`}
        name="userId"
        required
        className="h-11 min-w-40 flex-1 rounded-lg border border-input bg-transparent px-3 text-sm"
      >
        {people.map((person) => (
          <option key={person.id} value={person.id}>
            {person.label}
          </option>
        ))}
      </select>
      <label className="sr-only" htmlFor={`funcao-${projectId}`}>
        Função
      </label>
      <select
        id={`funcao-${projectId}`}
        name="role"
        defaultValue="PRODUCER"
        className="h-11 rounded-lg border border-input bg-transparent px-3 text-sm"
      >
        {projectRoles
          .filter((role) => canManageApprovers || role !== "APPROVER")
          .map((role) => (
            <option key={role} value={role}>
              {projectRoleLabel(t, role)}
            </option>
          ))}
      </select>
      <Button type="submit" className="min-h-11">
        Adicionar
      </Button>
    </form>
  );
}

export function RemoveParticipantButton({
  projectId,
  userId,
  role,
}: {
  projectId: string;
  userId: string;
  role: ProjectRole;
}) {
  return (
    <form action={removeParticipantAction}>
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="role" value={role} />
      <Button type="submit" variant="outline" className="min-h-11">
        Remover
      </Button>
    </form>
  );
}
