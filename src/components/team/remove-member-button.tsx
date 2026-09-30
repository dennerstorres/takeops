"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { Button } from "@/components/ui/button";
import { removeTeamMember } from "@/server/team-actions";

export function RemoveMemberButton({
  userId,
  name,
}: {
  userId: string;
  name: string;
}) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const formId = `remover-membro-${userId}`;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="min-h-11"
        onClick={() => setOpen(true)}
      >
        {t("team.remove")}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={t("team.removeTitle", { name })}
        description={t("team.removeDescription")}
        confirmLabel={t("team.remove")}
        destructive
        onConfirm={() => {
          const form = document.getElementById(
            formId,
          ) as HTMLFormElement | null;
          form?.requestSubmit();
        }}
      />
      <form id={formId} action={removeTeamMember}>
        <input type="hidden" name="userId" value={userId} />
      </form>
    </>
  );
}
