"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { Button } from "@/components/ui/button";
import { deleteChecklistTemplateAction } from "@/server/checklist-actions";

export function DeleteTemplateButton({ templateId }: { templateId: string }) {
  const t = useTranslations();
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
        {t("checklists.delete")}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={t("checklists.deleteTitle")}
        description={t("checklists.deleteDescription")}
        confirmLabel={t("checklists.deleteConfirm")}
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
