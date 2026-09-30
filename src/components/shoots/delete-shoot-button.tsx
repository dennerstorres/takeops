"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { Button } from "@/components/ui/button";
import { deleteShootAction } from "@/server/shoot-actions";

export function DeleteShootButton({
  projectId,
  shootId,
}: {
  projectId: string;
  shootId: string;
}) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const formId = `excluir-gravacao-${shootId}`;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="min-h-11"
        onClick={() => setOpen(true)}
      >
        {t("common.delete")}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={t("record.deleteTitle")}
        description={t("common.removedKept")}
        confirmLabel={t("common.delete")}
        destructive
        onConfirm={() => {
          const form = document.getElementById(
            formId,
          ) as HTMLFormElement | null;
          form?.requestSubmit();
        }}
      />
      <form id={formId} action={deleteShootAction}>
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="shootId" value={shootId} />
      </form>
    </>
  );
}
