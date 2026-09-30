"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { Button } from "@/components/ui/button";
import { stripIconButton } from "@/components/ui/strip";
import { deleteSceneAction } from "@/server/scene-actions";

export function DeleteSceneButton({
  projectId,
  sceneId,
  compactLabel,
}: {
  projectId: string;
  sceneId: string;
  // Com rótulo, vira botão-ícone para caber na tira da cena.
  compactLabel?: string;
}) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const formId = `excluir-cena-${sceneId}`;

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
        title={t("scenes.deleteTitle")}
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
      <form id={formId} action={deleteSceneAction} className="hidden">
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="sceneId" value={sceneId} />
      </form>
    </>
  );
}
