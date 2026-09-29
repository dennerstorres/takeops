"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { Button } from "@/components/ui/button";
import { deleteContinuityAction } from "@/server/continuity-actions";

export function DeleteContinuityButton({
  projectId,
  noteId,
}: {
  projectId: string;
  noteId: string;
}) {
  const [open, setOpen] = useState(false);
  const formId = `excluir-continuidade-${noteId}`;

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
        title="Excluir esta nota?"
        description="A nota de continuidade sai da produção."
        confirmLabel="Excluir"
        destructive
        onConfirm={() => {
          const form = document.getElementById(
            formId,
          ) as HTMLFormElement | null;
          form?.requestSubmit();
        }}
      />
      <form id={formId} action={deleteContinuityAction}>
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="noteId" value={noteId} />
      </form>
    </>
  );
}
