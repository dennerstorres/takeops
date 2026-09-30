"use client";

import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  deleteProductionTemplateAction,
  saveProductionTemplateAction,
  type ProductionTemplateFormState,
} from "@/server/production-template-actions";
import { Input, Textarea } from "@/components/ui/input";

export function ProductionTemplateForm({
  values,
}: {
  values: { templateId?: string; name: string; description: string };
}) {
  const t = useTranslations();
  const [state, action, pending] = useActionState(
    saveProductionTemplateAction,
    null as ProductionTemplateFormState,
  );

  return (
    <form action={action} className="grid gap-3">
      {values.templateId ? (
        <input type="hidden" name="templateId" value={values.templateId} />
      ) : null}
      {state?.message ? (
        <p role="alert" className="text-sm text-destructive">
          {state.fields
            ? (Object.values(state.fields)[0] ?? state.message)
            : state.message}
        </p>
      ) : null}
      <label className="flex flex-col gap-1 text-sm">
        {t("templates.name")}
        <Input
          name="name"
          required
          maxLength={120}
          defaultValue={values.name}
          placeholder={t("templates.namePlaceholder")}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {t("templates.descriptionOptional")}
        <Textarea
          name="description"
          maxLength={2000}
          rows={2}
          defaultValue={values.description}
          className="py-2"
        />
      </label>
      <Button type="submit" disabled={pending} className="min-h-11 w-fit">
        {values.templateId ? t("templates.save") : t("templates.create")}
      </Button>
    </form>
  );
}

export function DeleteProductionTemplateButton({
  templateId,
}: {
  templateId: string;
}) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const formId = `excluir-template-${templateId}`;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="min-h-11"
        onClick={() => setOpen(true)}
      >
        {t("templates.delete")}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={t("templates.deleteTitle")}
        description={t("templates.deleteDescription")}
        confirmLabel={t("templates.deleteConfirm")}
        destructive
        onConfirm={() => {
          const form = document.getElementById(
            formId,
          ) as HTMLFormElement | null;
          form?.requestSubmit();
        }}
      />
      <form id={formId} action={deleteProductionTemplateAction}>
        <input type="hidden" name="templateId" value={templateId} />
      </form>
    </>
  );
}
