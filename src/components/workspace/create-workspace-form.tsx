"use client";

import { useActionState } from "react";
import { LogoutButton } from "@/components/shell/logout-button";
import { Button } from "@/components/ui/button";
import {
  createFirstWorkspace,
  type CreateWorkspaceState,
} from "@/server/workspace-actions";

const initialState: CreateWorkspaceState = null;

export function CreateWorkspaceForm({ email }: { email: string | null }) {
  const [state, action, pending] = useActionState(
    createFirstWorkspace,
    initialState,
  );

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-medium tracking-tight">Criar workspace</h1>
        <p className="text-sm text-muted-foreground">
          Você ainda não participa de uma equipe. Crie a sua ou aguarde um
          convite no e-mail desta conta.
        </p>
        {email ? (
          <p className="text-sm text-muted-foreground">{email}</p>
        ) : null}
      </div>
      <form action={action} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="workspace-name" className="text-sm font-medium">
            Nome
          </label>
          <input
            id="workspace-name"
            name="name"
            required
            maxLength={80}
            autoComplete="organization"
            disabled={pending}
            aria-invalid={
              state?.fields?.name || state?.fields?.slug ? true : undefined
            }
            aria-describedby={
              state?.fields?.name || state?.fields?.slug
                ? "workspace-name-error"
                : undefined
            }
            className="h-11 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
          />
          {state?.fields?.name || state?.fields?.slug ? (
            <p id="workspace-name-error" className="text-sm text-destructive">
              {state.fields.name ?? state.fields.slug}
            </p>
          ) : null}
        </div>
        {state && !state.fields ? (
          <p className="text-sm text-destructive" role="alert">
            {state.message}
          </p>
        ) : null}
        <Button type="submit" className="min-h-11 w-full" disabled={pending}>
          {pending ? "Salvando…" : "Criar workspace"}
        </Button>
      </form>
      <LogoutButton className="w-full" />
    </main>
  );
}
