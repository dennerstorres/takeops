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

const fieldClass =
  "w-full rounded-lg border border-input bg-transparent px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

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
        Plataforma
        <select
          name="platform"
          defaultValue={values.platform}
          className={`${fieldClass} h-11`}
        >
          {platforms.map((platform) => (
            <option key={platform} value={platform}>
              {platformLabel(t, platform)}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Legenda (opcional)
        <textarea
          name="caption"
          maxLength={5000}
          rows={3}
          defaultValue={values.caption}
          className={`${fieldClass} py-2`}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Notas (opcional)
        <input
          name="notes"
          maxLength={2000}
          defaultValue={values.notes}
          className={`${fieldClass} h-11`}
        />
      </label>
      <Button type="submit" disabled={pending} className="min-h-11 w-fit">
        {values.publicationId ? "Salvar destino" : "Adicionar destino"}
      </Button>
    </form>
  );
}
