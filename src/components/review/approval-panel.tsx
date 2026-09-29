"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  decideApprovalAction,
  requestApprovalAction,
  type ApprovalFormState,
} from "@/server/approval-actions";

const fieldClass =
  "w-full rounded-lg border border-input bg-transparent px-3 py-2 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

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

export function DecideApprovalForm({
  projectId,
  versionId,
  approvalId,
}: {
  projectId: string;
  versionId: string;
  approvalId: string;
}) {
  const [state, action, pending] = useActionState(
    decideApprovalAction,
    null as ApprovalFormState,
  );

  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="versionId" value={versionId} />
      <input type="hidden" name="approvalId" value={approvalId} />
      {state?.message ? (
        <p role="alert" className="text-sm text-destructive">
          {state.fields
            ? (Object.values(state.fields)[0] ?? state.message)
            : state.message}
        </p>
      ) : null}
      <label className="flex flex-col gap-1 text-sm">
        Notas (obrigatórias para pedir alterações)
        <textarea
          name="notes"
          maxLength={4000}
          rows={3}
          className={fieldClass}
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          name="decision"
          value="approve"
          disabled={pending}
          className="min-h-11"
        >
          Aprovar versão
        </Button>
        <Button
          type="submit"
          name="decision"
          value="changes"
          variant="outline"
          disabled={pending}
          className="min-h-11"
        >
          Solicitar alterações
        </Button>
      </div>
    </form>
  );
}
