"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { Button } from "@/components/ui/button";
import { deleteAssetAction } from "@/server/asset-actions";

export function DeleteAssetButton({
  projectId,
  assetId,
}: {
  projectId: string;
  assetId: string;
}) {
  const [open, setOpen] = useState(false);
  const formId = `excluir-asset-${assetId}`;

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
        title="Excluir este link?"
        description="O link sai da produção. O arquivo continua onde está."
        confirmLabel="Excluir"
        destructive
        onConfirm={() => {
          const form = document.getElementById(
            formId,
          ) as HTMLFormElement | null;
          form?.requestSubmit();
        }}
      />
      <form id={formId} action={deleteAssetAction}>
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="assetId" value={assetId} />
      </form>
    </>
  );
}
