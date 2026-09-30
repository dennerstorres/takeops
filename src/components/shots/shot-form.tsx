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
import { Input, Select, Textarea } from "@/components/ui/input";

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
  ["cameraLabel", "scenes.camera", 80],
  ["angle", "shots.angle", 80],
  ["subject", "shots.subject", 120],
  ["movement", "shots.movement", 80],
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
        {t("shots.name")}
        <Input
          name="name"
          maxLength={120}
          defaultValue={values.name}
          placeholder={t("shots.namePlaceholder")}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {t("common.type")}
        <Select name="shotType" defaultValue={values.shotType}>
          {shotTypes.map((type) => (
            <option key={type} value={type}>
              {shotTypeLabel(t, type)}
            </option>
          ))}
        </Select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {t("shots.framing")}
        <Input
          name="framing"
          maxLength={80}
          list={framingList}
          defaultValue={values.framing}
        />
        <datalist id={framingList}>
          {framingPresets.map((preset) => (
            <option key={preset} value={preset} />
          ))}
        </datalist>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {t("shots.requiredTakes")}
        <Input
          name="requiredTakes"
          type="number"
          inputMode="numeric"
          min={1}
          max={99}
          defaultValue={values.requiredTakes}
        />
      </label>
      {textFields.map(([name, label, max]) => (
        <label key={name} className="flex flex-col gap-1 text-sm">
          {t(label)}
          <Input name={name} maxLength={max} defaultValue={values[name]} />
        </label>
      ))}
      {editing ? (
        <label className="flex flex-col gap-1 text-sm">
          {t("common.status")}
          <Select name="status" defaultValue={values.status}>
            {shotStatuses.map((status) => (
              <option key={status} value={status}>
                {shotStatusLabel(t, status)}
              </option>
            ))}
          </Select>
        </label>
      ) : null}
      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        {t("common.description")}
        <Textarea
          name="description"
          rows={2}
          maxLength={2000}
          defaultValue={values.description}
          className="h-auto min-h-16 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        {t("common.notes")}
        <Textarea
          name="notes"
          rows={2}
          maxLength={2000}
          defaultValue={values.notes}
          className="h-auto min-h-16 py-2"
        />
      </label>
      <Button type="submit" disabled={pending} className="min-h-11 w-fit">
        {editing ? t("shots.save") : t("shots.add")}
      </Button>
    </form>
  );
}
