"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  setTemplateChecklistAction,
  type ProductionTemplateFormState,
} from "@/server/production-template-actions";
import { Select } from "@/components/ui/input";

export function TemplateChecklistForm({
  templateId,
  current,
  options,
}: {
  templateId: string;
  current: string;
  options: { id: string; label: string }[];
}) {
  const t = useTranslations();
  const [state, action, pending] = useActionState(
    setTemplateChecklistAction,
    null as ProductionTemplateFormState,
  );

  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="templateId" value={templateId} />
      {state?.message ? (
        <p role="alert" className="text-sm text-destructive">
          {state.fields
            ? (Object.values(state.fields)[0] ?? state.message)
            : state.message}
        </p>
      ) : null}
      <label className="flex flex-col gap-1 text-sm">
        {t("templates.shootChecklist")}
        <Select
          name="checklistTemplateId"
          defaultValue={current}
          className="sm:w-80"
        >
          <option value="">{t("templates.none")}</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </Select>
      </label>
      <Button type="submit" disabled={pending} className="min-h-11 w-fit">
        {t("templates.saveChecklist")}
      </Button>
    </form>
  );
}
