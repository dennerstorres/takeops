"use client";

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
        Nome
        <Input
          name="name"
          required
          maxLength={120}
          defaultValue={values.name}
          placeholder="Demonstração de Feature"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Descrição (opcional)
        <Textarea
          name="description"
          maxLength={2000}
          rows={2}
          defaultValue={values.description}
          className="py-2"
        />
      </label>
      <Button type="submit" disabled={pending} className="min-h-11 w-fit">
        {values.templateId ? "Salvar template" : "Criar template"}
      </Button>
    </form>
  );
}

export function DeleteProductionTemplateButton({
  templateId,
}: {
  templateId: string;
}) {
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
        Excluir template
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Excluir este template?"
        description="As produções já criadas com ele não mudam."
        confirmLabel="Excluir"
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
