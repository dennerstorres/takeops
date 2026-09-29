"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  requestApprovalAction,
  type ApprovalFormState,
} from "@/server/approval-actions";

export function RequestApprovalForm({
  projectId,
  versionId,
}: {
  projectId: string;
  versionId: string;
}) {
  const [state, action, pending] = useActionState(
    requestApprovalAction,
    null as ApprovalFormState,
  );

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="versionId" value={versionId} />
      {state?.message ? (
        <p role="alert" className="text-sm text-destructive">
          {state.fields
            ? (Object.values(state.fields)[0] ?? state.message)
            : state.message}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="min-h-11 w-fit">
        Pedir aprovação desta versão
      </Button>
    </form>
  );
}
