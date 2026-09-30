"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  schedulePublicationAction,
  type PublicationFormState,
} from "@/server/publication-actions";
import { Input } from "@/components/ui/input";

export function SchedulePublicationForm({
  projectId,
  publicationId,
  scheduledLocal,
}: {
  projectId: string;
  publicationId: string;
  // Horário de parede no fuso do workspace, no formato do datetime-local.
  scheduledLocal: string;
}) {
  const [state, action, pending] = useActionState(
    schedulePublicationAction,
    null as PublicationFormState,
  );

  return (
    <form action={action} className="grid gap-2">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="publicationId" value={publicationId} />
      {state?.message ? (
        <p role="alert" className="text-sm text-destructive">
          {state.fields
            ? (Object.values(state.fields)[0] ?? state.message)
            : state.message}
        </p>
      ) : null}
      <label className="flex flex-col gap-1 text-sm">
        Data e hora da publicação
        <Input
          type="datetime-local"
          name="scheduledAt"
          defaultValue={scheduledLocal}
          className="sm:w-64"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          name="intent"
          value="schedule"
          disabled={pending}
          className="min-h-11"
        >
          {scheduledLocal ? "Reagendar" : "Agendar"}
        </Button>
        {scheduledLocal ? (
          <Button
            type="submit"
            name="intent"
            value="clear"
            variant="outline"
            disabled={pending}
            className="min-h-11"
          >
            Tirar agendamento
          </Button>
        ) : null}
      </div>
    </form>
  );
}
