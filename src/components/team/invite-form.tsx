"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  createTeamInvite,
  type CreateInviteState,
} from "@/server/invite-actions";
import type { WorkspaceRole } from "@/server/workspace-repository";
import { Input, Select } from "@/components/ui/input";

const initialState: CreateInviteState | null = null;

export function InviteForm({ roles }: { roles: WorkspaceRole[] }) {
  const t = useTranslations();
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
          {t("team.email")}
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
          {t("team.role")}
        </label>
        <Select
          id="invite-role"
          name="role"
          defaultValue="MEMBER"
          disabled={pending}
        >
          {roles.map((role) => (
            <option key={role} value={role}>
              {t(`team.roles.${role}`)}
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
        {pending ? t("team.creating") : t("team.createLink")}
      </Button>
      {link ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm">{t("team.copyLink")}</p>
          <Input
            readOnly
            suppressHydrationWarning
            value={link ?? ""}
            aria-label={t("team.linkLabel")}
            onFocus={(event) => event.currentTarget.select()}
          />
        </div>
      ) : null}
    </form>
  );
}
