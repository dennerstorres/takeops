"use client";

import { useTranslations } from "next-intl";
import { useActionState, useId } from "react";
import { Button } from "@/components/ui/button";
import {
  createShotAction,
  updateShotAction,
  type ShotFormState,
} from "@/server/shot-actions";
import {
  framingPresets,
  shotStatuses,
  shotStatusLabel,
  shotTypeLabel,
  shotTypes,
  type ShotStatus,
  type ShotType,
} from "@/server/shot-labels";

const fieldClass =
  "h-11 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export type ShotFormValues = {
  projectId: string;
  sceneId: string;
  shotId?: string;
  name: string;
  cameraLabel: string;
  shotType: ShotType;
  framing: string;
  angle: string;
  subject: string;
  movement: string;
  description: string;
  requiredTakes: string;
  notes: string;
  status: ShotStatus;
};

const textFields = [
  ["cameraLabel", "Câmera", 80],
  ["angle", "Ângulo", 80],
  ["subject", "Assunto", 120],
  ["movement", "Movimento", 80],
] as const;

export function ShotForm({ values }: { values: ShotFormValues }) {
  const t = useTranslations();
  const editing = Boolean(values.shotId);
  const [state, action, pending] = useActionState(
    editing ? updateShotAction : createShotAction,
    null as ShotFormState,
  );
  const framingList = useId();

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="projectId" value={values.projectId} />
      <input type="hidden" name="sceneId" value={values.sceneId} />
      {values.shotId ? (
        <input type="hidden" name="shotId" value={values.shotId} />
      ) : null}
      {state?.message ? (
        <p role="alert" className="text-sm text-destructive sm:col-span-2">
          {state.fields
            ? (Object.values(state.fields)[0] ?? state.message)
            : state.message}
        </p>
      ) : null}
      <label className="flex flex-col gap-1 text-sm">
        Nome
        <input
          name="name"
          maxLength={120}
          defaultValue={values.name}
          placeholder="Shot A"
          className={fieldClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Tipo
        <select
          name="shotType"
          defaultValue={values.shotType}
          className={fieldClass}
        >
          {shotTypes.map((type) => (
            <option key={type} value={type}>
              {shotTypeLabel(t, type)}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Enquadramento
        <input
          name="framing"
          maxLength={80}
          list={framingList}
          defaultValue={values.framing}
          className={fieldClass}
        />
        <datalist id={framingList}>
          {framingPresets.map((preset) => (
            <option key={preset} value={preset} />
          ))}
        </datalist>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Takes necessários
        <input
          name="requiredTakes"
          type="number"
          inputMode="numeric"
          min={1}
          max={99}
          defaultValue={values.requiredTakes}
          className={fieldClass}
        />
      </label>
      {textFields.map(([name, label, max]) => (
        <label key={name} className="flex flex-col gap-1 text-sm">
          {label}
          <input
            name={name}
            maxLength={max}
            defaultValue={values[name]}
            className={fieldClass}
          />
        </label>
      ))}
      {editing ? (
        <label className="flex flex-col gap-1 text-sm">
          Status
          <select
            name="status"
            defaultValue={values.status}
            className={fieldClass}
          >
            {shotStatuses.map((status) => (
              <option key={status} value={status}>
                {shotStatusLabel(t, status)}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        Descrição
        <textarea
          name="description"
          rows={2}
          maxLength={2000}
          defaultValue={values.description}
          className={`${fieldClass} h-auto min-h-16 py-2`}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        Notas
        <textarea
          name="notes"
          rows={2}
          maxLength={2000}
          defaultValue={values.notes}
          className={`${fieldClass} h-auto min-h-16 py-2`}
        />
      </label>
      <Button type="submit" disabled={pending} className="min-h-11 w-fit">
        {editing ? "Salvar shot" : "Adicionar shot"}
      </Button>
    </form>
  );
}
