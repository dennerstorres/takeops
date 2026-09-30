"use client";

import { useTranslations } from "next-intl";
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
  const t = useTranslations();
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
        {t("common.delete")}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={t("publication.deleteTitle")}
        description={t("publication.deleteDescription")}
        confirmLabel={t("common.delete")}
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
