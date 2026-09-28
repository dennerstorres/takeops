import {
  favoriteTakeAction,
  registerTakeAction,
  updateTakeAction,
} from "@/server/take-actions";
import type { TakeRecord, TakeStatus } from "@/server/take-repository";

const buttonClass =
  "inline-flex min-h-11 items-center rounded-lg border px-3 text-sm";

export const takeStatusLabel: Record<TakeStatus, string> = {
  OK: "OK",
  RETAKE: "Refazer",
  DISCARDED: "Descartado",
};

function Hidden({
  projectId,
  sceneId,
  shotId,
  returnTo,
}: {
  projectId: string;
  sceneId: string;
  shotId: string;
  returnTo: string;
}) {
  return (
    <>
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="sceneId" value={sceneId} />
      <input type="hidden" name="shotId" value={shotId} />
      <input type="hidden" name="returnTo" value={returnTo} />
    </>
  );
}

// Registro rápido: um toque grava o próximo take com o status escolhido.
export function TakeList({
  projectId,
  sceneId,
  shotId,
  takes,
  requiredTakes,
  canEdit,
  returnTo,
}: {
  projectId: string;
  sceneId: string;
  shotId: string;
  takes: TakeRecord[];
  requiredTakes: number;
  canEdit: boolean;
  returnTo: string;
}) {
  const ok = takes.filter((take) => take.status === "OK").length;
  const ids = { projectId, sceneId, shotId, returnTo };

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Takes: {takes.length} · {ok} OK de {requiredTakes} pedidos
      </p>
      {takes.length > 0 ? (
        <ol className="flex flex-col gap-1">
          {takes.map((take) => (
            <li
              key={take.id}
              className="flex flex-wrap items-center justify-between gap-2 text-sm"
            >
              <span>
                <span className="font-medium">Take {take.number}</span>
                {" · "}
                {takeStatusLabel[take.status]}
                {take.favorite ? " · ★ Preferido" : ""}
                {take.notes ? (
                  <span className="text-muted-foreground"> · {take.notes}</span>
                ) : null}
              </span>
              {canEdit ? (
                <div className="flex flex-wrap gap-2">
                  {take.status === "OK" ? (
                    <form action={favoriteTakeAction}>
                      <Hidden {...ids} />
                      {take.favorite ? null : (
                        <input type="hidden" name="takeId" value={take.id} />
                      )}
                      <button
                        type="submit"
                        aria-pressed={take.favorite}
                        className={buttonClass}
                      >
                        {take.favorite ? "Tirar preferido" : "Preferido"}
                      </button>
                    </form>
                  ) : null}
                  {take.status !== "DISCARDED" ? (
                    <form action={updateTakeAction}>
                      <Hidden {...ids} />
                      <input type="hidden" name="takeId" value={take.id} />
                      <input
                        type="hidden"
                        name="notes"
                        value={take.notes ?? ""}
                      />
                      <input type="hidden" name="status" value="DISCARDED" />
                      <button type="submit" className={buttonClass}>
                        Descartar
                      </button>
                    </form>
                  ) : null}
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      ) : null}
      {canEdit ? (
        <form action={registerTakeAction} className="flex flex-wrap gap-2">
          <Hidden {...ids} />
          <button
            type="submit"
            name="status"
            value="OK"
            className={buttonClass}
          >
            Take OK
          </button>
          <button
            type="submit"
            name="status"
            value="RETAKE"
            className={buttonClass}
          >
            Take para refazer
          </button>
        </form>
      ) : null}
    </div>
  );
}
