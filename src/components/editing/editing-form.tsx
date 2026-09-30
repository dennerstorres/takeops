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
import { Checkbox, Input, Select, Textarea } from "@/components/ui/input";

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
          {t("editing.editor")}
          <Select name="editorId" defaultValue={values.editorId}>
            <option value="">{t("editing.noEditor")}</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.label}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t("editing.software")}
          <Input
            name="software"
            maxLength={80}
            defaultValue={values.software}
            placeholder={t("editing.softwarePlaceholder")}
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        {t("editing.projectLink")}
        <Input
          name="projectFileUrl"
          type="url"
          inputMode="url"
          maxLength={2048}
          defaultValue={values.projectFileUrl}
          placeholder="https://..."
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          {t("editing.resolution")}
          <Input
            name="targetResolution"
            maxLength={40}
            defaultValue={values.targetResolution}
            placeholder="1080x1920"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t("editing.fps")}
          <Input
            name="targetFps"
            inputMode="decimal"
            maxLength={8}
            defaultValue={values.targetFps}
            placeholder="30"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t("projects.aspectRatio")}
          <Select name="aspectRatio" defaultValue={values.aspectRatio}>
            <option value="">{t("editing.aspectUnset")}</option>
            {aspectRatios.map((ratio) => (
              <option key={ratio} value={ratio}>
                {aspectLabel(t, ratio)}
              </option>
            ))}
          </Select>
        </label>
      </div>
      <div className="flex flex-wrap gap-x-6">
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <Checkbox
            type="checkbox"
            name="captionsRequired"
            defaultChecked={values.captionsRequired}
            className="size-5"
          />
          {t("editing.captionsRequired")}
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <Checkbox
            type="checkbox"
            name="musicRequired"
            defaultChecked={values.musicRequired}
            className="size-5"
          />
          {t("editing.musicRequired")}
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        {t("editing.notes")}
        <Textarea
          name="notes"
          maxLength={4000}
          rows={4}
          defaultValue={values.notes}
          className="py-2"
        />
      </label>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending} className="min-h-11 w-fit">
          {t("editing.save")}
        </Button>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {pending ? t("common.saving") : state?.saved ? t("common.saved") : ""}
        </p>
      </div>
    </form>
  );
}
