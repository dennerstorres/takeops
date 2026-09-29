"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { Button } from "@/components/ui/button";
import { deletePublicationAction } from "@/server/publication-actions";

export function DeletePublicationButton({
  projectId,
  publicationId,
}: {
  projectId: string;
  publicationId: string;
}) {
  const [open, setOpen] = useState(false);
  const formId = `excluir-publicacao-${publicationId}`;

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
        title="Excluir este destino?"
        description="O registro sai da produção. Nada muda na plataforma."
        confirmLabel="Excluir"
        destructive
        onConfirm={() => {
          const form = document.getElementById(
            formId,
          ) as HTMLFormElement | null;
          form?.requestSubmit();
        }}
      />
      <form id={formId} action={deletePublicationAction}>
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="publicationId" value={publicationId} />
      </form>
    </>
  );
}
