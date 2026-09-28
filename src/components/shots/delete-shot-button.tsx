"use client";

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
        Excluir
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Excluir este shot?"
        description="Ele sai da lista. O registro permanece guardado."
        confirmLabel="Excluir"
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
