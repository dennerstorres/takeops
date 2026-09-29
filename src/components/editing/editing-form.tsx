"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  saveEditingAction,
  type EditingFormState,
} from "@/server/editing-actions";
import {
  aspectLabel,
  aspectRatios,
  type AspectRatio,
} from "@/server/project-labels";

const fieldClass =
  "w-full rounded-lg border border-input bg-transparent px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export type EditingFormValues = {
  projectId: string;
  editorId: string;
  software: string;
  projectFileUrl: string;
  notes: string;
  targetResolution: string;
  targetFps: string;
  aspectRatio: AspectRatio | "";
  captionsRequired: boolean;
  musicRequired: boolean;
};

export function EditingForm({
  values,
  people,
}: {
  values: EditingFormValues;
  people: { id: string; label: string }[];
}) {
  const t = useTranslations();
  const [state, action, pending] = useActionState(
    saveEditingAction,
    null as EditingFormState,
  );
  const error = state && !state.saved ? state : null;

  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="projectId" value={values.projectId} />
      {error?.message ? (
        <p role="alert" className="text-sm text-destructive">
          {error.fields
            ? (Object.values(error.fields)[0] ?? error.message)
            : error.message}
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Editor
          <select
            name="editorId"
            defaultValue={values.editorId}
            className={`${fieldClass} h-11`}
          >
            <option value="">Ninguém definido</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Software
          <input
            name="software"
            maxLength={80}
            defaultValue={values.software}
            placeholder="Premiere Pro, DaVinci Resolve"
            className={`${fieldClass} h-11`}
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        Link do projeto de edição
        <input
          name="projectFileUrl"
          type="url"
          inputMode="url"
          maxLength={2048}
          defaultValue={values.projectFileUrl}
          placeholder="https://..."
          className={`${fieldClass} h-11`}
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          Resolução
          <input
            name="targetResolution"
            maxLength={40}
            defaultValue={values.targetResolution}
            placeholder="1080x1920"
            className={`${fieldClass} h-11`}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          FPS
          <input
            name="targetFps"
            inputMode="decimal"
            maxLength={8}
            defaultValue={values.targetFps}
            placeholder="30"
            className={`${fieldClass} h-11`}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Proporção
          <select
            name="aspectRatio"
            defaultValue={values.aspectRatio}
            className={`${fieldClass} h-11`}
          >
            <option value="">Não definida</option>
            {aspectRatios.map((ratio) => (
              <option key={ratio} value={ratio}>
                {aspectLabel(t, ratio)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex flex-wrap gap-x-6">
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="captionsRequired"
            defaultChecked={values.captionsRequired}
            className="size-5"
          />
          Precisa de legenda
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="musicRequired"
            defaultChecked={values.musicRequired}
            className="size-5"
          />
          Precisa de música
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        Notas para a edição
        <textarea
          name="notes"
          maxLength={4000}
          rows={4}
          defaultValue={values.notes}
          className={`${fieldClass} py-2`}
        />
      </label>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending} className="min-h-11 w-fit">
          Salvar edição
        </Button>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {pending ? "Salvando..." : state?.saved ? "Salvo" : ""}
        </p>
      </div>
    </form>
  );
}
