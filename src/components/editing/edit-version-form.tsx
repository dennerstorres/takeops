"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  createEditVersionAction,
  type EditVersionFormState,
} from "@/server/edit-version-actions";
import { Input, Textarea } from "@/components/ui/input";

export function EditVersionForm({
  projectId,
  nextLabel,
}: {
  projectId: string;
  nextLabel: string;
}) {
  const [state, action, pending] = useActionState(
    createEditVersionAction,
    null as EditVersionFormState,
  );

  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="projectId" value={projectId} />
      {state?.message ? (
        <p role="alert" className="text-sm text-destructive">
          {state.fields
            ? (Object.values(state.fields)[0] ?? state.message)
            : state.message}
        </p>
      ) : null}
      <label className="flex flex-col gap-1 text-sm">
        Título (opcional)
        <Input name="title" maxLength={120} placeholder="Primeiro corte" />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Link de preview
          <Input
            name="previewUrl"
            type="url"
            inputMode="url"
            maxLength={2048}
            placeholder="https://vimeo.com/..."
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Link do arquivo
          <Input
            name="fileUrl"
            type="url"
            inputMode="url"
            maxLength={2048}
            placeholder="https://drive.google.com/..."
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        O que mudou (opcional)
        <Textarea name="notes" maxLength={4000} rows={3} className="py-2" />
      </label>
      <Button type="submit" disabled={pending} className="min-h-11 w-fit">
        Enviar {nextLabel}
      </Button>
    </form>
  );
}
