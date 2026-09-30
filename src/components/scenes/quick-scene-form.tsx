"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { createSceneAction, type SceneFormState } from "@/server/scene-actions";
import { sceneTypeLabel, sceneTypes } from "@/server/scene-labels";

// Nova cena como vaga no pé do quadro: só título e tipo. Fala, descrição e
// o resto se editam na própria cena depois de criada.
export function QuickSceneForm({ projectId }: { projectId: string }) {
  const t = useTranslations();
  const [state, action, pending] = useActionState(
    createSceneAction,
    null as SceneFormState,
  );

  return (
    <form
      action={action}
      aria-label={t("scenes.new")}
      className="flex flex-col gap-1 rounded-md border border-dashed border-frame-foreground/40 bg-frame/40 p-1.5"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="status" value="PLANNED" />
      <input type="hidden" name="speakerId" value="" />
      <div className="flex flex-wrap items-center gap-1.5">
        <label className="min-w-0 flex-1 basis-48">
          <span className="sr-only">{t("common.title")}</span>
          <Input
            name="title"
            required
            maxLength={200}
            placeholder={t("scenes.board.newPlaceholder")}
            className="h-11 bg-card sm:h-8"
          />
        </label>
        <label>
          <span className="sr-only">{t("common.type")}</span>
          <Select
            name="type"
            defaultValue="OTHER"
            className="h-11 bg-card sm:h-8"
          >
            {sceneTypes.map((type) => (
              <option key={type} value={type}>
                {sceneTypeLabel(t, type)}
              </option>
            ))}
          </Select>
        </label>
        <Button type="submit" disabled={pending} className="h-11 sm:h-8">
          <Plus aria-hidden="true" />
          {t("scenes.board.add")}
        </Button>
      </div>
      {state?.message ? (
        <p
          role="alert"
          className="rounded-[2px] bg-card px-2 py-1 text-sm text-destructive"
        >
          {state.fields?.title ?? state.message}
        </p>
      ) : null}
    </form>
  );
}
