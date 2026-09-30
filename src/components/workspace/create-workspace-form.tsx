"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { LogoutButton } from "@/components/shell/logout-button";
import { Button } from "@/components/ui/button";
import { surfaceClass } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  createFirstWorkspace,
  type CreateWorkspaceState,
} from "@/server/workspace-actions";

const initialState: CreateWorkspaceState = null;

export function CreateWorkspaceForm({ email }: { email: string | null }) {
  const t = useTranslations();
  const [state, action, pending] = useActionState(
    createFirstWorkspace,
    initialState,
  );

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-8">
      <section className={cn(surfaceClass, "flex flex-col gap-6 p-6")}>
        <div className="space-y-1">
          <h1 className="text-2xl font-medium tracking-tight">
            {t("workspace.create")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("workspace.description")}
          </p>
          {email ? (
            <p className="text-sm text-muted-foreground">{email}</p>
          ) : null}
        </div>
        <form action={action} className="flex flex-col gap-4">
          <Field
            id="workspace-name"
            label={t("workspace.name")}
            error={state?.fields?.name ?? state?.fields?.slug}
            errorId="workspace-name-error"
          >
            <Input
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
            />
          </Field>
          {state && !state.fields ? (
            <p className="text-sm text-destructive" role="alert">
              {state.message}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? t("workspace.saving") : t("workspace.create")}
          </Button>
        </form>
        <LogoutButton className="w-full justify-center" />
      </section>
    </main>
  );
}
