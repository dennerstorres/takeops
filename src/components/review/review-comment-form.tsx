"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  createReviewCommentAction,
  type ReviewCommentFormState,
} from "@/server/review-actions";
import { Input, Textarea } from "@/components/ui/input";

export function ReviewCommentForm({
  projectId,
  versionId,
}: {
  projectId: string;
  versionId: string;
}) {
  const t = useTranslations();
  const [state, action, pending] = useActionState(
    createReviewCommentAction,
    null as ReviewCommentFormState,
  );

  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="versionId" value={versionId} />
      {state?.message ? (
        <p role="alert" className="text-sm text-destructive">
          {state.fields
            ? (Object.values(state.fields)[0] ?? state.message)
            : state.message}
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
        <label className="flex flex-col gap-1 text-sm">
          {t("review.time")}
          <Input
            name="timestamp"
            inputMode="numeric"
            maxLength={10}
            placeholder="00:18"
            aria-describedby="tempo-ajuda"
          />
          <span id="tempo-ajuda" className="text-xs text-muted-foreground">
            {t("review.timeHelp")}
          </span>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t("review.comment")}
          <Textarea
            name="text"
            required
            maxLength={2000}
            rows={2}
            placeholder={t("review.commentPlaceholder")}
            className="py-2"
          />
        </label>
      </div>
      <Button type="submit" disabled={pending} className="min-h-11 w-fit">
        {t("review.post")}
      </Button>
    </form>
  );
}
