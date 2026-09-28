"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { Button } from "@/components/ui/button";
import { deleteProjectAction } from "@/server/project-actions";

export function DeleteProjectButton({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);

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
        title="Excluir esta produção?"
        description="Ela sai da lista. O registro permanece guardado."
        confirmLabel="Excluir"
        destructive
        onConfirm={() => {
          const form = document.getElementById(
            "excluir-producao",
          ) as HTMLFormElement | null;
          form?.requestSubmit();
        }}
      />
      <form id="excluir-producao" action={deleteProjectAction}>
        <input type="hidden" name="projectId" value={projectId} />
      </form>
    </>
  );
}
