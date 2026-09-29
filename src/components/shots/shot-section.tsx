import { useTranslations } from "next-intl";
import { DeleteShotButton } from "@/components/shots/delete-shot-button";
import { ShotForm } from "@/components/shots/shot-form";
import { TakeList } from "@/components/takes/take-list";
import { moveShotAction } from "@/server/shot-actions";
import {
  shotDisplayName,
  shotStatusLabel,
  shotSummary,
} from "@/server/shot-labels";
import type { ShotRecord } from "@/server/shot-repository";
import type { TakeRecord } from "@/server/take-repository";

const buttonClass =
  "inline-flex min-h-11 items-center rounded-lg border px-3 text-sm disabled:opacity-40";

export function ShotSection({
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
  const t = useTranslations();
  return (
    <section id="shots" className="space-y-3">
      <h2 className="text-base font-medium">Shots</h2>
      {shots.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum shot nesta cena.</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {shots.map((shot, index) => (
            <li key={shot.id} className="rounded-xl border p-3">
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-medium">
                  {shotDisplayName(t, shot.name, index)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {shotSummary(t, shot)} · {shotStatusLabel(t, shot.status)}
                </p>
                {shot.description ? (
                  <p className="text-sm whitespace-pre-wrap">
                    {shot.description}
                  </p>
                ) : null}
              </div>
              <div className="mt-3 border-t pt-3">
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
                <div className="mt-3 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <form action={moveShotAction} className="flex gap-2">
                      <input type="hidden" name="projectId" value={projectId} />
                      <input type="hidden" name="sceneId" value={sceneId} />
                      <input type="hidden" name="shotId" value={shot.id} />
                      <button
                        type="submit"
                        name="direction"
                        value="up"
                        disabled={index === 0}
                        className={buttonClass}
                      >
                        Subir
                      </button>
                      <button
                        type="submit"
                        name="direction"
                        value="down"
                        disabled={index === shots.length - 1}
                        className={buttonClass}
                      >
                        Descer
                      </button>
                    </form>
                    <DeleteShotButton
                      projectId={projectId}
                      sceneId={sceneId}
                      shotId={shot.id}
                    />
                  </div>
                  <details>
                    <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm">
                      Editar shot
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
        <details className="rounded-xl border p-3">
          <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-medium">
            Novo shot
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
