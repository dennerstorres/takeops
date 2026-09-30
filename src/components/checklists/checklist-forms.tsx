"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  addChecklistItemAction,
  createChecklistTemplateAction,
  updateChecklistItemAction,
  updateChecklistTemplateAction,
  type ChecklistFormState,
} from "@/server/checklist-actions";
import { Input, Select } from "@/components/ui/input";

const checklistTypes = ["SHOOT", "OTHER"] as const;

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
  const t = useTranslations();
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
        {t("checklists.name")}
        <Input
          name="name"
          required
          maxLength={120}
          defaultValue={values.name}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {t("checklists.type")}
        <Select name="type" defaultValue={values.type}>
          {checklistTypes.map((value) => (
            <option key={value} value={value}>
              {t(`checklists.types.${value}`)}
            </option>
          ))}
        </Select>
      </label>
      <Button
        type="submit"
        disabled={pending}
        className="min-h-11 w-fit self-end"
      >
        {editing ? t("checklists.save") : t("checklists.create")}
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
  const t = useTranslations();
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
        {t("checklists.item")}
      </label>
      <Input
        id={`item-${itemId ?? "novo"}`}
        name="text"
        required
        maxLength={200}
        defaultValue={text}
        placeholder={itemId ? undefined : t("checklists.itemPlaceholder")}
      />
      <Button type="submit" disabled={pending} className="min-h-11 w-fit">
        {itemId ? t("checklists.save") : t("checklists.add")}
      </Button>
    </form>
  );
}
