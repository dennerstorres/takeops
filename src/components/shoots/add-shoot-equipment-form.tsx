"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  addShootEquipmentAction,
  type ShootFormState,
} from "@/server/shoot-actions";

const fieldClass =
  "h-11 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function AddShootEquipmentForm({
  projectId,
  shootId,
  options,
}: {
  projectId: string;
  shootId: string;
  options: { id: string; label: string }[];
}) {
  const [state, action, pending] = useActionState(
    addShootEquipmentAction,
    null as ShootFormState,
  );

  return (
    <form action={action} className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="shootId" value={shootId} />
      {state?.message ? (
        <p role="alert" className="text-sm text-destructive sm:col-span-3">
          {state.fields
            ? (Object.values(state.fields)[0] ?? state.message)
            : state.message}
        </p>
      ) : null}
      <label className="sr-only" htmlFor={`kit-${shootId}`}>
        Equipamento
      </label>
      <select
        id={`kit-${shootId}`}
        name="equipmentItemId"
        className={fieldClass}
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="required"
          defaultChecked
          className="size-5"
        />
        Obrigatório
      </label>
      <Button type="submit" disabled={pending} className="min-h-11 w-fit">
        Adicionar
      </Button>
    </form>
  );
}
