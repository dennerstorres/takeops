"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  savePublicationAction,
  type PublicationFormState,
} from "@/server/publication-actions";
import {
  platformLabel,
  platforms,
  type Platform,
} from "@/server/publication-labels";
import { Input, Select, Textarea } from "@/components/ui/input";

export type PublicationFormValues = {
  projectId: string;
  publicationId?: string;
  platform: Platform;
  caption: string;
  notes: string;
};

export function PublicationForm({ values }: { values: PublicationFormValues }) {
  const t = useTranslations();
  const [state, action, pending] = useActionState(
    savePublicationAction,
    null as PublicationFormState,
  );

  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="projectId" value={values.projectId} />
      {values.publicationId ? (
        <input
          type="hidden"
          name="publicationId"
          value={values.publicationId}
        />
      ) : null}
      {state?.message ? (
        <p role="alert" className="text-sm text-destructive">
          {state.fields
            ? (Object.values(state.fields)[0] ?? state.message)
            : state.message}
        </p>
      ) : null}
      <label className="flex flex-col gap-1 text-sm">
        {t("publication.platform")}
        <Select name="platform" defaultValue={values.platform}>
          {platforms.map((platform) => (
            <option key={platform} value={platform}>
              {platformLabel(t, platform)}
            </option>
          ))}
        </Select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {t("publication.caption")}
        <Textarea
          name="caption"
          maxLength={5000}
          rows={3}
          defaultValue={values.caption}
          className="py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {t("publication.notes")}
        <Input name="notes" maxLength={2000} defaultValue={values.notes} />
      </label>
      <Button type="submit" disabled={pending} className="min-h-11 w-fit">
        {values.publicationId ? t("publication.save") : t("publication.add")}
      </Button>
    </form>
  );
}
