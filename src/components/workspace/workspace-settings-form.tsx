"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import {
  saveWorkspaceSettings,
  type WorkspaceSettingsState,
} from "@/server/workspace-actions";

export function WorkspaceSettingsForm({
  values,
  timezones,
}: {
  values: { name: string; timezone: string; logoUrl: string };
  timezones: string[];
}) {
  const t = useTranslations();
  const [state, action, pending] = useActionState(
    saveWorkspaceSettings,
    null as WorkspaceSettingsState,
  );
  const error = state && !state.saved ? state : null;
  const field = (name: string) => error?.fields?.[name];

  return (
    <form action={action} className="grid gap-3">
      {error && !error.fields ? (
        <p role="alert" className="text-sm text-destructive">
          {error.message}
        </p>
      ) : null}
      <label className="flex flex-col gap-1 text-sm">
        {t("settings.name")}
        <Input
          name="name"
          required
          maxLength={80}
          defaultValue={values.name}
          aria-invalid={field("name") ? true : undefined}
        />
        {field("name") ? (
          <span className="text-destructive">{field("name")}</span>
        ) : null}
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {t("settings.timezone")}
        <Select
          name="timezone"
          defaultValue={values.timezone}
          aria-invalid={field("timezone") ? true : undefined}
        >
          {timezones.map((zone) => (
            <option key={zone} value={zone}>
              {zone}
            </option>
          ))}
        </Select>
        <span className="text-muted-foreground">
          {t("settings.timezoneHelp")}
        </span>
        {field("timezone") ? (
          <span className="text-destructive">{field("timezone")}</span>
        ) : null}
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {t("settings.logoUrl")}
        <Input
          name="logoUrl"
          type="url"
          maxLength={500}
          placeholder="https://"
          defaultValue={values.logoUrl}
          aria-invalid={field("logoUrl") ? true : undefined}
        />
        {field("logoUrl") ? (
          <span className="text-destructive">{field("logoUrl")}</span>
        ) : null}
      </label>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending} className="min-h-11 w-fit">
          {t("settings.save")}
        </Button>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {pending ? t("common.saving") : state?.saved ? t("common.saved") : ""}
        </p>
      </div>
    </form>
  );
}
