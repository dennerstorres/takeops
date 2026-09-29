"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  createShootAction,
  updateShootAction,
  type ShootFormState,
} from "@/server/shoot-actions";
import {
  shootStatuses,
  shootStatusLabel,
  type ShootStatus,
} from "@/server/shoot-labels";

const fieldClass =
  "h-11 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export type ShootFormValues = {
  projectId: string;
  shootId?: string;
  title: string;
  // Horário de parede no fuso do workspace, formato do datetime-local.
  scheduledAt: string;
  endAt: string;
  location: string;
  notes: string;
  status: ShootStatus;
};

export function ShootForm({
  values,
  timezone,
}: {
  values: ShootFormValues;
  timezone: string;
}) {
  const t = useTranslations();
  const editing = Boolean(values.shootId);
  const [state, action, pending] = useActionState(
    editing ? updateShootAction : createShootAction,
    null as ShootFormState,
  );

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="projectId" value={values.projectId} />
      {values.shootId ? (
        <input type="hidden" name="shootId" value={values.shootId} />
      ) : null}
      {state?.message ? (
        <p role="alert" className="text-sm text-destructive sm:col-span-2">
          {state.fields
            ? (Object.values(state.fields)[0] ?? state.message)
            : state.message}
        </p>
      ) : null}
      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        Título
        <input
          name="title"
          maxLength={120}
          defaultValue={values.title}
          placeholder="Sessão no estúdio"
          className={fieldClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Início
        <input
          name="scheduledAt"
          type="datetime-local"
          required
          defaultValue={values.scheduledAt}
          className={fieldClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Fim
        <input
          name="endAt"
          type="datetime-local"
          defaultValue={values.endAt}
          className={fieldClass}
        />
      </label>
      <p className="text-xs text-muted-foreground sm:col-span-2">
        Horário de {timezone}.
      </p>
      <label className="flex flex-col gap-1 text-sm">
        Local
        <input
          name="location"
          maxLength={200}
          defaultValue={values.location}
          className={fieldClass}
        />
      </label>
      {editing ? (
        <label className="flex flex-col gap-1 text-sm">
          Status
          <select
            name="status"
            defaultValue={values.status}
            className={fieldClass}
          >
            {shootStatuses.map((status) => (
              <option key={status} value={status}>
                {shootStatusLabel(t, status)}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        Notas
        <textarea
          name="notes"
          rows={2}
          maxLength={4000}
          defaultValue={values.notes}
          className={`${fieldClass} h-auto min-h-16 py-2`}
        />
      </label>
      <Button type="submit" disabled={pending} className="min-h-11 w-fit">
        {editing ? "Salvar gravação" : "Agendar gravação"}
      </Button>
    </form>
  );
}
