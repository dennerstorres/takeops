"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  addTemplateSceneAction,
  type ProductionTemplateFormState,
} from "@/server/production-template-actions";
import { sceneTypeLabel, sceneTypes } from "@/server/scene-labels";

const fieldClass =
  "w-full rounded-lg border border-input bg-transparent px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function TemplateSceneForm({ templateId }: { templateId: string }) {
  const t = useTranslations();
  const [state, action, pending] = useActionState(
    addTemplateSceneAction,
    null as ProductionTemplateFormState,
  );

  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="templateId" value={templateId} />
      {state?.message ? (
        <p role="alert" className="text-sm text-destructive">
          {state.fields
            ? (Object.values(state.fields)[0] ?? state.message)
            : state.message}
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
        <label className="flex flex-col gap-1 text-sm">
          Título da cena
          <input
            name="title"
            required
            maxLength={120}
            placeholder="Hook"
            className={`${fieldClass} h-11`}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Tipo
          <select
            name="type"
            defaultValue="OTHER"
            className={`${fieldClass} h-11`}
          >
            {sceneTypes.map((type) => (
              <option key={type} value={type}>
                {sceneTypeLabel(t, type)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        Orientação (opcional)
        <input
          name="description"
          maxLength={2000}
          className={`${fieldClass} h-11`}
        />
      </label>
      <Button type="submit" disabled={pending} className="min-h-11 w-fit">
        Adicionar cena
      </Button>
    </form>
  );
}
