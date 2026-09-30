"use client";

import { useTranslations } from "next-intl";
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
  const t = useTranslations();
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
        {t("common.delete")}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={t("assets.deleteTitle")}
        description={t("assets.deleteDescription")}
        confirmLabel={t("common.delete")}
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
