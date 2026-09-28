"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { Button } from "@/components/ui/button";
import { deleteSceneAction } from "@/server/scene-actions";

export function DeleteSceneButton({
  projectId,
  sceneId,
}: {
  projectId: string;
  sceneId: string;
}) {
  const [open, setOpen] = useState(false);
  const formId = `excluir-cena-${sceneId}`;

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
        title="Excluir esta cena?"
        description="Ela sai da lista. O registro permanece guardado."
        confirmLabel="Excluir"
        destructive
        onConfirm={() => {
          const form = document.getElementById(formId) as HTMLFormElement | null;
          form?.requestSubmit();
        }}
      />
      <form id={formId} action={deleteSceneAction}>
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="sceneId" value={sceneId} />
      </form>
    </>
  );
}
