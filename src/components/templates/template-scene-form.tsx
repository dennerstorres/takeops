"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  addTemplateSceneAction,
  type ProductionTemplateFormState,
} from "@/server/production-template-actions";
import { sceneTypeLabel, sceneTypes } from "@/server/scene-labels";
import { Input, Select } from "@/components/ui/input";

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
          <Input name="title" required maxLength={120} placeholder="Hook" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Tipo
          <Select name="type" defaultValue="OTHER">
            {sceneTypes.map((type) => (
              <option key={type} value={type}>
                {sceneTypeLabel(t, type)}
              </option>
            ))}
          </Select>
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        Orientação (opcional)
        <Input name="description" maxLength={2000} />
      </label>
      <Button type="submit" disabled={pending} className="min-h-11 w-fit">
        Adicionar cena
      </Button>
    </form>
  );
}
