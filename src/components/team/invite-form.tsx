"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  createTeamInvite,
  type CreateInviteState,
} from "@/server/invite-actions";
import { roleLabel } from "@/server/team";
import type { WorkspaceRole } from "@/server/workspace-repository";
import { Input, Select } from "@/components/ui/input";

const initialState: CreateInviteState | null = null;

export function InviteForm({ roles }: { roles: WorkspaceRole[] }) {
  const [state, action, pending] = useActionState(
    createTeamInvite,
    initialState,
  );
  const link = state?.token
    ? `${typeof window === "undefined" ? "" : window.location.origin}/convite/${state.token}`
    : null;

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="invite-email" className="text-sm font-medium">
          E-mail
        </label>
        <Input
          id="invite-email"
          name="email"
          type="email"
          required
          maxLength={200}
          autoComplete="off"
          disabled={pending}
          aria-invalid={state?.fields?.email ? true : undefined}
        />
        {state?.fields?.email ? (
          <p className="text-sm text-destructive">{state.fields.email}</p>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="invite-role" className="text-sm font-medium">
          Papel
        </label>
        <Select
          id="invite-role"
          name="role"
          defaultValue="MEMBER"
          disabled={pending}
        >
          {roles.map((role) => (
            <option key={role} value={role}>
              {roleLabel(role)}
            </option>
          ))}
        </Select>
        {state?.fields?.role ? (
          <p className="text-sm text-destructive">{state.fields.role}</p>
        ) : null}
      </div>
      {state && !state.fields && !state.token ? (
        <p className="text-sm text-destructive" role="alert">
          {state.message}
        </p>
      ) : null}
      <Button
        type="submit"
        className="min-h-11 w-full sm:w-auto"
        disabled={pending}
      >
        {pending ? "Criando…" : "Criar link"}
      </Button>
      {link ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm">
            Copie o link agora. Ele não fica salvo para mostrar de novo.
          </p>
          <Input
            readOnly
            suppressHydrationWarning
            value={link ?? ""}
            aria-label="Link do convite"

            onFocus={(event) => event.currentTarget.select()}
          />
        </div>
      ) : null}
    </form>
  );
}
