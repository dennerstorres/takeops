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
import { Select } from "@/components/ui/input";

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
      <Select
        id={`pessoa-${projectId}`}
        name="userId"
        required
        className="min-w-40 flex-1"
      >
        {people.map((person) => (
          <option key={person.id} value={person.id}>
            {person.label}
          </option>
        ))}
      </Select>
      <label className="sr-only" htmlFor={`funcao-${projectId}`}>
        Função
      </label>
      <Select id={`funcao-${projectId}`} name="role" defaultValue="PRODUCER">
        {projectRoles
          .filter((role) => canManageApprovers || role !== "APPROVER")
          .map((role) => (
            <option key={role} value={role}>
              {projectRoleLabel(t, role)}
            </option>
          ))}
      </Select>
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
