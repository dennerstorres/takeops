import { ArrowDown, ArrowUp } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { DeleteShotButton } from "@/components/shots/delete-shot-button";
import { ShotForm } from "@/components/shots/shot-form";
import { TakeList } from "@/components/takes/take-list";
import { surfaceClass } from "@/components/ui/card";
import {
  stripIconButton,
  stripPhaseClass,
  stripTipClass,
} from "@/components/ui/strip";
import { scenePhase, sceneTip } from "@/components/ui/strip-phase";
import { cn } from "@/lib/utils";
import { moveShotAction } from "@/server/shot-actions";
import {
  shotDisplayName,
  shotStatusLabel,
  shotSummary,
} from "@/server/shot-labels";
import type { ShotRecord } from "@/server/shot-repository";
import type { TakeRecord } from "@/server/take-repository";

export async function ShotSection({
  projectId,
  sceneId,
  shots,
  takes,
  canEdit,
}: {
  projectId: string;
  sceneId: string;
  shots: ShotRecord[];
  takes: Map<string, TakeRecord[]>;
  canEdit: boolean;
}) {
  const t = await getTranslations();
  return (
    <section id="shots" className="space-y-3">
      <h2 className="font-condensed text-sm font-semibold tracking-wider uppercase">
        {t("shots.title")}
      </h2>
      {shots.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("shots.empty")}</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {shots.map((shot, index) => (
            <li
              key={shot.id}
              className="overflow-hidden rounded-md border bg-card"
            >
              {/* Cabeça do plano como tira: cor e ponta pelo status. */}
              <div
                className={cn(
                  "flex min-h-11 items-center gap-2 border-b border-strip-ink/10 pl-2 text-strip-ink sm:min-h-strip",
                  stripPhaseClass[scenePhase(shot.status)],
                )}
              >
                <span className="shrink-0 font-condensed text-sm font-semibold tracking-wide uppercase">
                  {shotDisplayName(t, shot.name, index)}
                </span>
                <span className="min-w-0 flex-1 truncate font-condensed text-xs text-strip-ink-muted">
                  {shotSummary(t, shot)}
                </span>
                <span className="shrink-0 font-condensed text-xs font-semibold tracking-wide uppercase">
                  {shotStatusLabel(t, shot.status)}
                </span>
                {canEdit ? (
                  <span className="flex shrink-0">
                    <form action={moveShotAction} className="contents">
                      <input type="hidden" name="projectId" value={projectId} />
                      <input type="hidden" name="sceneId" value={sceneId} />
                      <input type="hidden" name="shotId" value={shot.id} />
                      <button
                        type="submit"
                        name="direction"
                        value="up"
                        disabled={index === 0}
                        aria-label={t("scenes.board.moveUp", {
                          title: shotDisplayName(t, shot.name, index),
                        })}
                        title={t("common.moveUp")}
                        className={stripIconButton}
                      >
                        <ArrowUp aria-hidden="true" />
                      </button>
                      <button
                        type="submit"
                        name="direction"
                        value="down"
                        disabled={index === shots.length - 1}
                        aria-label={t("scenes.board.moveDown", {
                          title: shotDisplayName(t, shot.name, index),
                        })}
                        title={t("common.moveDown")}
                        className={stripIconButton}
                      >
                        <ArrowDown aria-hidden="true" />
                      </button>
                    </form>
                    <DeleteShotButton
                      projectId={projectId}
                      sceneId={sceneId}
                      shotId={shot.id}
                      compactLabel={t("scenes.board.delete", {
                        title: shotDisplayName(t, shot.name, index),
                      })}
                    />
                  </span>
                ) : null}
                <span
                  className={cn(
                    "mr-1.5 h-4 w-2 shrink-0",
                    stripTipClass[sceneTip(shot.status)],
                  )}
                >
                  <span className="sr-only">
                    {t(`strip.tip.${sceneTip(shot.status)}`)}
                  </span>
                </span>
              </div>
              {shot.description ? (
                <p className="px-3 pt-3 text-sm whitespace-pre-wrap">
                  {shot.description}
                </p>
              ) : null}
              <div className="px-3 py-3">
                <TakeList
                  projectId={projectId}
                  sceneId={sceneId}
                  shotId={shot.id}
                  takes={takes.get(shot.id) ?? []}
                  requiredTakes={shot.requiredTakes}
                  canEdit={canEdit}
                  returnTo={`/producoes/${projectId}/cenas/${sceneId}#shots`}
                />
              </div>
              {canEdit ? (
                <div className="border-t px-3 py-1">
                  <details>
                    <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm">
                      {t("shots.edit")}
                    </summary>
                    <div className="pt-3">
                      <ShotForm
                        values={{
                          projectId,
                          sceneId,
                          shotId: shot.id,
                          name: shot.name ?? "",
                          cameraLabel: shot.cameraLabel ?? "",
                          shotType: shot.shotType,
                          framing: shot.framing ?? "",
                          angle: shot.angle ?? "",
                          subject: shot.subject ?? "",
                          movement: shot.movement ?? "",
                          description: shot.description ?? "",
                          requiredTakes: String(shot.requiredTakes),
                          notes: shot.notes ?? "",
                          status: shot.status,
                        }}
                      />
                    </div>
                  </details>
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      )}
      {canEdit ? (
        <details className={cn(surfaceClass, "p-3")}>
          <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-medium">
            {t("shots.new")}
          </summary>
          <div className="pt-3">
            <ShotForm
              values={{
                projectId,
                sceneId,
                name: "",
                cameraLabel: "",
                shotType: "CAMERA",
                framing: "",
                angle: "",
                subject: "",
                movement: "",
                description: "",
                requiredTakes: "1",
                notes: "",
                status: "PLANNED",
              }}
            />
          </div>
        </details>
      ) : null}
    </section>
  );
}
