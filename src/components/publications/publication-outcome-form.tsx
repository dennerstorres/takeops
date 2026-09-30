"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  recordOutcomeAction,
  type PublicationFormState,
} from "@/server/publication-actions";
import { Input } from "@/components/ui/input";

export function PublicationOutcomeForm({
  projectId,
  publicationId,
  publishedLocal,
  url,
}: {
  projectId: string;
  publicationId: string;
  publishedLocal: string;
  url: string;
}) {
  const [state, action, pending] = useActionState(
    recordOutcomeAction,
    null as PublicationFormState,
  );

  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="publicationId" value={publicationId} />
      {state?.message ? (
        <p role="alert" className="text-sm text-destructive">
          {state.fields
            ? (Object.values(state.fields)[0] ?? state.message)
            : state.message}
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Link da publicação
          <Input
            name="url"
            type="url"
            inputMode="url"
            maxLength={2048}
            defaultValue={url}
            placeholder="https://..."
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Publicada em (vazio = agora)
          <Input
            type="datetime-local"
            name="publishedAt"
            defaultValue={publishedLocal}
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          name="status"
          value="PUBLISHED"
          disabled={pending}
          className="min-h-11"
        >
          Marcar como publicada
        </Button>
        <Button
          type="submit"
          name="status"
          value="FAILED"
          variant="outline"
          disabled={pending}
          className="min-h-11"
        >
          Falhou
        </Button>
        <Button
          type="submit"
          name="status"
          value="CANCELED"
          variant="outline"
          disabled={pending}
          className="min-h-11"
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
