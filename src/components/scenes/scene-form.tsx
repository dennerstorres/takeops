"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import {
  AutosaveStatusText,
  useFormAutosave,
} from "@/components/feedback/form-autosave";
import { Button } from "@/components/ui/button";
import {
  autosaveSceneAction,
  createSceneAction,
  updateSceneAction,
  type SceneFormState,
} from "@/server/scene-actions";
import {
  sceneStatuses,
  sceneStatusLabel,
  sceneTypeLabel,
  sceneTypes,
  type SceneStatus,
  type SceneType,
} from "@/server/scene-labels";

const fieldClass =
  "w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export type SceneFormValues = {
  projectId: string;
  sceneId?: string;
  title: string;
  description: string;
  type: SceneType;
  speakerId: string;
  dialogue: string;
  action: string;
  estimatedDurationSeconds: string;
  cameraInstructions: string;
  editingInstructions: string;
  continuityNotes: string;
  status: SceneStatus;
};

export function SceneForm({
  values,
  people,
  editing,
}: {
  values: SceneFormValues;
  people: { id: string; label: string }[];
  editing: boolean;
}) {
  const t = useTranslations();
  const [state, action, pending] = useActionState(
    editing ? updateSceneAction : createSceneAction,
    null as SceneFormState,
  );
  const autosave = useFormAutosave(editing, autosaveSceneAction);

  return (
    <form
      action={action}
      onChange={
        editing ? (event) => autosave.schedule(event.currentTarget) : undefined
      }
      onSubmit={editing ? () => autosave.cancel() : undefined}
      className="grid gap-3"
    >
      <input type="hidden" name="projectId" value={values.projectId} />
      {values.sceneId ? (
        <input type="hidden" name="sceneId" value={values.sceneId} />
      ) : null}
      {state?.message ? (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      ) : null}
      <label className="flex flex-col gap-1 text-sm">
        Título
        <input
          name="title"
          required
          maxLength={120}
          defaultValue={values.title}
          className={`${fieldClass} h-11`}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Tipo
        <select
          name="type"
          defaultValue={values.type}
          className={`${fieldClass} h-11`}
        >
          {sceneTypes.map((type) => (
            <option key={type} value={type}>
              {sceneTypeLabel(t, type)}
            </option>
          ))}
        </select>
      </label>
      {editing ? (
        <label className="flex flex-col gap-1 text-sm">
          Status
          <select
            name="status"
            defaultValue={values.status}
            className={`${fieldClass} h-11`}
          >
            {sceneStatuses.map((status) => (
              <option key={status} value={status}>
                {sceneStatusLabel(t, status)}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <label className="flex flex-col gap-1 text-sm">
        Quem fala
        <select
          name="speakerId"
          defaultValue={values.speakerId}
          className={`${fieldClass} h-11`}
        >
          <option value="">Ninguém</option>
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Fala
        <textarea
          name="dialogue"
          rows={3}
          maxLength={4000}
          defaultValue={values.dialogue}
          className={`${fieldClass} min-h-20 py-2`}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Descrição
        <textarea
          name="description"
          rows={2}
          maxLength={4000}
          defaultValue={values.description}
          className={`${fieldClass} min-h-16 py-2`}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Ação
        <input
          name="action"
          maxLength={2000}
          defaultValue={values.action}
          className={`${fieldClass} h-11`}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Duração em segundos
        <input
          name="estimatedDurationSeconds"
          inputMode="numeric"
          defaultValue={values.estimatedDurationSeconds}
          className={`${fieldClass} h-11`}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Câmera
        <input
          name="cameraInstructions"
          maxLength={2000}
          defaultValue={values.cameraInstructions}
          className={`${fieldClass} h-11`}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Edição
        <input
          name="editingInstructions"
          maxLength={2000}
          defaultValue={values.editingInstructions}
          className={`${fieldClass} h-11`}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Continuidade
        <input
          name="continuityNotes"
          maxLength={2000}
          defaultValue={values.continuityNotes}
          className={`${fieldClass} h-11`}
        />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending} className="min-h-11 w-fit">
          {editing ? "Salvar cena" : "Adicionar cena"}
        </Button>
        {editing ? (
          <AutosaveStatusText
            status={autosave.status}
            message={autosave.message}
          />
        ) : null}
      </div>
    </form>
  );
}
