"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { Button } from "@/components/ui/button";
import { deleteIdeaAction } from "@/server/idea-actions";

export function DeleteIdeaButton({ ideaId }: { ideaId: string }) {
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
        {t("ideas.delete")}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={t("ideas.deleteTitle")}
        description={t("ideas.deleteDescription")}
        confirmLabel={t("ideas.delete")}
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
