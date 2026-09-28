"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  addChecklistItemAction,
  createChecklistTemplateAction,
  updateChecklistItemAction,
  updateChecklistTemplateAction,
  type ChecklistFormState,
} from "@/server/checklist-actions";

const fieldClass =
  "h-11 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const typeLabels = { SHOOT: "Gravação", OTHER: "Outro" } as const;

function Alert({ state }: { state: ChecklistFormState }) {
  if (!state?.message) return null;
  return (
    <p role="alert" className="text-sm text-destructive sm:col-span-full">
      {state.fields
        ? (Object.values(state.fields)[0] ?? state.message)
        : state.message}
    </p>
  );
}

export function TemplateForm({
  values,
}: {
  values: { templateId?: string; name: string; type: "SHOOT" | "OTHER" };
}) {
  const editing = Boolean(values.templateId);
  const [state, action, pending] = useActionState(
    editing ? updateChecklistTemplateAction : createChecklistTemplateAction,
    null as ChecklistFormState,
  );
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-[1fr_12rem_auto]">
      {values.templateId ? (
        <input type="hidden" name="templateId" value={values.templateId} />
      ) : null}
      <Alert state={state} />
      <label className="flex flex-col gap-1 text-sm">
        Nome
        <input
          name="name"
          required
          maxLength={120}
          defaultValue={values.name}
          className={fieldClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Tipo
        <select name="type" defaultValue={values.type} className={fieldClass}>
          {Object.entries(typeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <Button
        type="submit"
        disabled={pending}
        className="min-h-11 w-fit self-end"
      >
        {editing ? "Salvar" : "Criar checklist"}
      </Button>
    </form>
  );
}

export function ItemForm({
  templateId,
  itemId,
  text,
}: {
  templateId: string;
  itemId?: string;
  text: string;
}) {
  const [state, action, pending] = useActionState(
    itemId ? updateChecklistItemAction : addChecklistItemAction,
    null as ChecklistFormState,
  );
  return (
    <form action={action} className="grid gap-2 sm:grid-cols-[1fr_auto]">
      <input type="hidden" name="templateId" value={templateId} />
      {itemId ? <input type="hidden" name="itemId" value={itemId} /> : null}
      <Alert state={state} />
      <label className="sr-only" htmlFor={`item-${itemId ?? "novo"}`}>
        Item
      </label>
      <input
        id={`item-${itemId ?? "novo"}`}
        name="text"
        required
        maxLength={200}
        defaultValue={text}
        placeholder={itemId ? undefined : "Novo item"}
        className={fieldClass}
      />
      <Button type="submit" disabled={pending} className="min-h-11 w-fit">
        {itemId ? "Salvar" : "Adicionar"}
      </Button>
    </form>
  );
}
