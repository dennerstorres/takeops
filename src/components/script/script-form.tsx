"use client";

import {
  AutosaveStatusText,
  useFormAutosave,
} from "@/components/feedback/form-autosave";
import { Button } from "@/components/ui/button";
import { autosaveScriptAction } from "@/server/script-actions";

const fieldClass =
  "w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const fields = [
  { name: "hook", label: "Gancho", max: 2000, rows: 2 },
  { name: "mainMessage", label: "Mensagem principal", max: 2000, rows: 2 },
  { name: "cta", label: "Chamada para ação", max: 2000, rows: 2 },
  { name: "notes", label: "Notas", max: 4000, rows: 4 },
] as const;

export type ScriptFormValues = Record<(typeof fields)[number]["name"], string>;

export function ScriptForm({
  projectId,
  values,
}: {
  projectId: string;
  values: ScriptFormValues;
}) {
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
          {field.label}
          <textarea
            name={field.name}
            rows={field.rows}
            maxLength={field.max}
            defaultValue={values[field.name]}
            className={`${fieldClass} min-h-16`}
          />
        </label>
      ))}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          disabled={autosave.status === "saving"}
          className="min-h-11 w-fit"
        >
          Salvar roteiro
        </Button>
        <AutosaveStatusText
          status={autosave.status}
          message={autosave.message}
        />
      </div>
    </form>
  );
}
