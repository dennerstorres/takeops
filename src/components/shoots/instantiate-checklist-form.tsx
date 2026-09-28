"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  instantiateShootChecklistAction,
  type ShootFormState,
} from "@/server/shoot-actions";

const fieldClass =
  "h-11 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function InstantiateChecklistForm({
  projectId,
  shootId,
  templates,
}: {
  projectId: string;
  shootId: string;
  templates: { id: string; label: string }[];
}) {
  const [state, action, pending] = useActionState(
    instantiateShootChecklistAction,
    null as ShootFormState,
  );

  return (
    <form action={action} className="grid gap-2 sm:grid-cols-[1fr_auto]">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="shootId" value={shootId} />
      {state?.message ? (
        <p role="alert" className="text-sm text-destructive sm:col-span-2">
          {state.fields
            ? (Object.values(state.fields)[0] ?? state.message)
            : state.message}
        </p>
      ) : null}
      <label className="sr-only" htmlFor={`checklist-${shootId}`}>
        Modelo de checklist
      </label>
      <select
        id={`checklist-${shootId}`}
        name="templateId"
        className={fieldClass}
      >
        {templates.map((template) => (
          <option key={template.id} value={template.id}>
            {template.label}
          </option>
        ))}
      </select>
      <Button type="submit" disabled={pending} className="min-h-11 w-fit">
        Usar checklist
      </Button>
    </form>
  );
}
