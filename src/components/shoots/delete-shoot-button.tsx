"use client";

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
        Excluir
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Excluir esta gravação?"
        description="Ela sai da lista. O registro permanece guardado."
        confirmLabel="Excluir"
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
