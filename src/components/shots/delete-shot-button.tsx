"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { Button } from "@/components/ui/button";
import { stripIconButton } from "@/components/ui/strip";
import { deleteShotAction } from "@/server/shot-actions";

export function DeleteShotButton({
  projectId,
  sceneId,
  shotId,
  compactLabel,
}: {
  projectId: string;
  sceneId: string;
  shotId: string;
  // Com rótulo, vira botão-ícone para caber na cabeça do plano.
  compactLabel?: string;
}) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const formId = `excluir-shot-${shotId}`;

  return (
    <>
      {compactLabel ? (
        <button
          type="button"
          aria-label={compactLabel}
          title={t("common.delete")}
          className={stripIconButton}
          onClick={() => setOpen(true)}
        >
          <Trash2 aria-hidden="true" />
        </button>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          onClick={() => setOpen(true)}
        >
          {t("common.delete")}
        </Button>
      )}
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
      <form id={formId} action={deleteShotAction} className="hidden">
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="sceneId" value={sceneId} />
        <input type="hidden" name="shotId" value={shotId} />
      </form>
    </>
  );
}
