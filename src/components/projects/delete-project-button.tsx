"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { Button } from "@/components/ui/button";
import { deleteProjectAction } from "@/server/project-actions";

export function DeleteProjectButton({ projectId }: { projectId: string }) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);

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
        title={t("projects.deleteTitle")}
        description={t("common.removedKept")}
        confirmLabel={t("common.delete")}
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
