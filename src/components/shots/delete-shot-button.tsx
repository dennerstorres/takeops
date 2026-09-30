"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { Button } from "@/components/ui/button";
import { deleteShotAction } from "@/server/shot-actions";

export function DeleteShotButton({
  projectId,
  sceneId,
  shotId,
}: {
  projectId: string;
  sceneId: string;
  shotId: string;
}) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const formId = `excluir-shot-${shotId}`;

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
        title={t("shots.deleteTitle")}
        description={t("common.removedKeptHe")}
        confirmLabel={t("common.delete")}
        destructive
        onConfirm={() => {
          const form = document.getElementById(
            formId,
          ) as HTMLFormElement | null;
          form?.requestSubmit();
        }}
      />
      <form id={formId} action={deleteShotAction}>
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="sceneId" value={sceneId} />
        <input type="hidden" name="shotId" value={shotId} />
      </form>
    </>
  );
}
