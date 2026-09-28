"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { Button } from "@/components/ui/button";
import { deleteIdeaAction } from "@/server/idea-actions";

export function DeleteIdeaButton({ ideaId }: { ideaId: string }) {
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
        title="Excluir esta ideia?"
        description="Ela sai da lista. O registro permanece guardado."
        confirmLabel="Excluir"
        destructive
        onConfirm={() => {
          const form = document.getElementById(
            "excluir-ideia",
          ) as HTMLFormElement | null;
          form?.requestSubmit();
        }}
      />
      <form id="excluir-ideia" action={deleteIdeaAction}>
        <input type="hidden" name="ideaId" value={ideaId} />
      </form>
    </>
  );
}
