"use client";

import { useTranslations } from "next-intl";
import {
  AutosaveStatusText,
  useFormAutosave,
} from "@/components/feedback/form-autosave";
import { Button } from "@/components/ui/button";
import { autosaveScriptAction } from "@/server/script-actions";
import { Textarea } from "@/components/ui/input";

const fields = [
  { name: "hook", label: "script.hook", max: 2000, rows: 2 },
  { name: "mainMessage", label: "script.mainMessage", max: 2000, rows: 2 },
  { name: "cta", label: "script.cta", max: 2000, rows: 2 },
  { name: "notes", label: "common.notes", max: 4000, rows: 4 },
] as const;

export type ScriptFormValues = Record<(typeof fields)[number]["name"], string>;

export function ScriptForm({
  projectId,
  values,
}: {
  projectId: string;
  values: ScriptFormValues;
}) {
  const t = useTranslations();
  const autosave = useFormAutosave(true, autosaveScriptAction);

  return (
    <form
      onChange={(event) => autosave.schedule(event.currentTarget)}
      onSubmit={(event) => {
        // O botão só adianta o autosave. Não há navegação ao salvar.
        event.preventDefault();
        autosave.schedule(event.currentTarget);
        void autosave.flush();
      }}
      className="grid gap-3"
    >
      <input type="hidden" name="projectId" value={projectId} />
      {fields.map((field) => (
        <label key={field.name} className="flex flex-col gap-1 text-sm">
          {t(field.label)}
          <Textarea
            name={field.name}
            rows={field.rows}
            maxLength={field.max}
            defaultValue={values[field.name]}
            className="min-h-16"
          />
        </label>
      ))}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          disabled={autosave.status === "saving"}
          className="min-h-11 w-fit"
        >
          {t("script.save")}
        </Button>
        <AutosaveStatusText
          status={autosave.status}
          message={autosave.message}
        />
      </div>
    </form>
  );
}
