import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { changeIdeaStatusAction } from "@/server/idea-actions";
import { statusLabel } from "@/server/idea-labels";
import { editableIdeaStatuses } from "@/server/idea-repository";
import type { IdeaStatus } from "@/server/idea-labels";
import { Select } from "@/components/ui/input";

export function IdeaStatusForm({
  ideaId,
  status,
}: {
  ideaId: string;
  status: IdeaStatus;
}) {
  const t = useTranslations();
  return (
    <form
      action={changeIdeaStatusAction}
      className="flex flex-wrap items-center gap-2"
    >
      <input type="hidden" name="ideaId" value={ideaId} />
      <label className="sr-only" htmlFor={`status-${ideaId}`}>
        Status
      </label>
      <Select id={`status-${ideaId}`} name="status" defaultValue={status}>
        {editableIdeaStatuses.map((item) => (
          <option key={item} value={item}>
            {statusLabel(t, item)}
          </option>
        ))}
      </Select>
      <Button type="submit" variant="outline" className="min-h-11">
        Salvar status
      </Button>
    </form>
  );
}
