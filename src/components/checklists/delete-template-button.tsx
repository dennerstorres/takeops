"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { Button } from "@/components/ui/button";
import { deleteChecklistTemplateAction } from "@/server/checklist-actions";

export function DeleteTemplateButton({ templateId }: { templateId: string }) {
  const [open, setOpen] = useState(false);
  const formId = `excluir-checklist-${templateId}`;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="min-h-11"
        onClick={() => setOpen(true)}
      >
        Excluir checklist
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Excluir este checklist?"
        description="Gravações que já usaram este modelo mantêm a cópia delas."
        confirmLabel="Excluir"
        destructive
        onConfirm={() => {
          const form = document.getElementById(
            formId,
          ) as HTMLFormElement | null;
          form?.requestSubmit();
        }}
      />
      <form id={formId} action={deleteChecklistTemplateAction}>
        <input type="hidden" name="templateId" value={templateId} />
      </form>
    </>
  );
}
