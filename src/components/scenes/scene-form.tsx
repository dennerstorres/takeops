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
import { Input, Select, Textarea } from "@/components/ui/input";

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
  characterIds?: string[];
};

export function SceneForm({
  values,
  people,
  editing,
  characters = [],
}: {
  values: SceneFormValues;
  people: { id: string; label: string }[];
  editing: boolean;
  // Só na edição: a cena nova ainda não tem com quem ligar.
  characters?: { id: string; name: string }[];
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
        {t("common.title")}
        <Input
          name="title"
          required
          maxLength={120}
          defaultValue={values.title}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {t("common.type")}
        <Select name="type" defaultValue={values.type}>
          {sceneTypes.map((type) => (
            <option key={type} value={type}>
              {sceneTypeLabel(t, type)}
            </option>
          ))}
        </Select>
      </label>
      {editing ? (
        <label className="flex flex-col gap-1 text-sm">
          {t("common.status")}
          <Select name="status" defaultValue={values.status}>
            {sceneStatuses.map((status) => (
              <option key={status} value={status}>
                {sceneStatusLabel(t, status)}
              </option>
            ))}
          </Select>
        </label>
      ) : null}
      <label className="flex flex-col gap-1 text-sm">
        {t("scenes.speaker")}
        <Select name="speakerId" defaultValue={values.speakerId}>
          <option value="">{t("scenes.nobody")}</option>
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.label}
            </option>
          ))}
        </Select>
      </label>
      {editing && characters.length ? (
        <fieldset className="flex flex-col gap-1 text-sm">
          <legend className="mb-1">{t("cast.sceneCharacters")}</legend>
          {/* Marca que a lista veio no envio; sem marcas, todos saem. */}
          <input type="hidden" name="characterField" value="1" />
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {characters.map((character) => (
              <label key={character.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="characterIds"
                  value={character.id}
                  defaultChecked={values.characterIds?.includes(character.id)}
                />
                {character.name}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}
      <label className="flex flex-col gap-1 text-sm">
        {t("scenes.dialogue")}
        <Textarea
          name="dialogue"
          rows={3}
          maxLength={4000}
          defaultValue={values.dialogue}
          className="min-h-20 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {t("common.description")}
        <Textarea
          name="description"
          rows={2}
          maxLength={4000}
          defaultValue={values.description}
          className="min-h-16 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {t("scenes.action")}
        <Input name="action" maxLength={2000} defaultValue={values.action} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {t("projects.durationSeconds")}
        <Input
          name="estimatedDurationSeconds"
          inputMode="numeric"
          defaultValue={values.estimatedDurationSeconds}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {t("scenes.camera")}
        <Input
          name="cameraInstructions"
          maxLength={2000}
          defaultValue={values.cameraInstructions}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {t("tabs.editing")}
        <Input
          name="editingInstructions"
          maxLength={2000}
          defaultValue={values.editingInstructions}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {t("continuity.title")}
        <Input
          name="continuityNotes"
          maxLength={2000}
          defaultValue={values.continuityNotes}
        />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending} className="min-h-11 w-fit">
          {editing ? t("scenes.save") : t("scenes.add")}
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
