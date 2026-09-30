"use client";

import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { surfaceClass } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  scriptImportAction,
  type ScriptImportState,
} from "@/server/script-import-actions";
import type { ScriptImportPreview } from "@/server/script-import";
import { formatSeconds } from "@/server/script-view";

const initial: ScriptImportState = {
  text: "",
  preview: null,
  message: null,
  fields: null,
};

export function ScriptImportForm({ projectId }: { projectId: string }) {
  const t = useTranslations();
  const [state, action, pending] = useActionState(scriptImportAction, initial);
  const [text, setText] = useState("");
  // A prévia vale para o texto que a gerou; mexeu no texto, precisa de outra.
  const [previewedText, setPreviewedText] = useState<string | null>(null);
  const preview =
    state.preview && previewedText === text ? state.preview : null;
  const error = state.fields
    ? (Object.values(state.fields)[0] ?? state.message)
    : state.message;

  return (
    <form
      action={action}
      onSubmit={() => setPreviewedText(text)}
      className="grid gap-4"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <label className="flex flex-col gap-1 text-sm">
        {t("scriptImport.file")}
        <Input
          type="file"
          accept=".md,.markdown,.txt,text/markdown,text/plain"
          onChange={async (event) => {
            const file = event.currentTarget.files?.[0];
            if (file) setText(await file.text());
          }}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {t("scriptImport.text")}
        <Textarea
          name="text"
          required
          rows={14}
          value={text}
          onChange={(event) => setText(event.currentTarget.value)}
          className="font-mono text-xs"
        />
      </label>

      {error && previewedText === text ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          name="intent"
          value="preview"
          // A confirmação de acréscimo só vale para importar.
          formNoValidate
          variant={preview ? "outline" : "default"}
          disabled={pending || !text.trim()}
          className="min-h-11 w-fit"
        >
          {t("scriptImport.preview")}
        </Button>
      </div>

      {preview ? <PreviewPanel preview={preview} pending={pending} /> : null}
    </form>
  );
}

function PreviewPanel({
  preview,
  pending,
}: {
  preview: ScriptImportPreview;
  pending: boolean;
}) {
  const t = useTranslations();
  const over =
    preview.targetSeconds && preview.totalSeconds > preview.targetSeconds
      ? preview.totalSeconds - preview.targetSeconds
      : 0;
  const blocked = preview.problems.length > 0;

  return (
    <section className="grid gap-3" aria-live="polite">
      <h2 className="font-condensed text-sm font-semibold tracking-wider uppercase">
        {t("scriptImport.summary", {
          scenes: preview.scenes.length,
          shots: preview.shotCount,
        })}
      </h2>
      <p className="text-sm text-muted-foreground">
        {t("scriptImport.total", {
          total: formatSeconds(preview.totalSeconds),
        })}
        {preview.targetSeconds
          ? t("scriptImport.target", {
              target: formatSeconds(preview.targetSeconds),
            })
          : null}
        {preview.scenesWithoutDuration > 0
          ? t("script.withoutDuration", {
              count: preview.scenesWithoutDuration,
            })
          : null}
      </p>
      {over ? (
        <p role="status" className="text-sm font-medium text-destructive">
          {t("scriptImport.overTarget", { over: formatSeconds(over) })}
        </p>
      ) : null}

      {blocked ? (
        <div className={cn(surfaceClass, "grid gap-1 p-3")}>
          <p className="text-sm font-medium text-destructive">
            {t("scriptImport.problemsTitle")}
          </p>
          <ul className="grid gap-1 text-sm">
            {preview.problems.map((problem, index) => (
              <li key={index}>
                <span className="font-medium">
                  {problem.scene === null
                    ? t("scriptImport.whereScript")
                    : problem.shot === null
                      ? t("scriptImport.whereScene", { scene: problem.scene })
                      : t("scriptImport.whereShot", {
                          scene: problem.scene,
                          shot: problem.shot,
                        })}
                  :{" "}
                </span>
                {Object.values(problem.fields).join(" ")}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {preview.warnings.length ? (
        <div className={cn(surfaceClass, "grid gap-1 p-3")}>
          <p className="text-sm font-medium">
            {t("scriptImport.warningsTitle")}
          </p>
          <ul className="grid gap-1 text-sm text-muted-foreground">
            {preview.warnings.map((warning, index) => (
              <li key={index}>
                {t("scriptImport.warning", {
                  line: warning.line,
                  field: warning.field,
                  value: warning.value,
                  kind: warning.kind,
                })}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <ol className="grid gap-2">
        {preview.scenes.map((scene, index) => (
          <li key={index} className={cn(surfaceClass, "grid gap-1 p-3")}>
            <p className="text-sm font-medium">
              {index + 1 + preview.existingScenes}. {scene.title}
            </p>
            <p className="text-xs text-muted-foreground">
              {t(`enums.sceneType.${scene.type}`)}
              {scene.estimatedDurationSeconds
                ? ` · ${formatSeconds(scene.estimatedDurationSeconds)}`
                : null}
            </p>
            {scene.shots.length ? (
              <ul className="grid gap-0.5 text-xs">
                {scene.shots.map((shot, shotIndex) => (
                  <li key={shotIndex}>
                    {index + 1 + preview.existingScenes}.{shotIndex + 1}{" "}
                    {shot.name ?? t("scriptImport.unnamedShot")} ·{" "}
                    {t(`enums.shotType.${shot.shotType}`)}
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ol>

      {preview.filledScriptFields.length ? (
        <p className="text-sm text-muted-foreground">
          {t("scriptImport.scriptFields", {
            fields: preview.filledScriptFields
              .map((field) =>
                field === "notes" ? t("common.notes") : t(`script.${field}`),
              )
              .join(", "),
          })}
        </p>
      ) : null}
      {preview.newCharacters.length ? (
        <p className="text-sm text-muted-foreground">
          {t("scriptImport.newCharacters", {
            names: preview.newCharacters.join(", "),
          })}
        </p>
      ) : null}
      {preview.sectionTitles.length ? (
        <p className="text-sm text-muted-foreground">
          {t("scriptImport.sections", {
            titles: preview.sectionTitles
              .map((title) => title || t("scriptImport.untitledSection"))
              .join(", "),
          })}
        </p>
      ) : null}

      {preview.existingScenes > 0 ? (
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            name="appendToExisting"
            required
            className="mt-1"
          />
          {t("scriptImport.confirmAppend", { count: preview.existingScenes })}
        </label>
      ) : null}

      <Button
        type="submit"
        name="intent"
        value="import"
        disabled={pending || blocked}
        className="min-h-11 w-fit"
      >
        {t("scriptImport.import", { scenes: preview.scenes.length })}
      </Button>
    </section>
  );
}
