import { getTranslations } from "next-intl/server";
import {
  favoriteTakeAction,
  registerTakeAction,
  updateTakeAction,
} from "@/server/take-actions";
import type { TakeRecord, TakeStatus } from "@/server/take-repository";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";

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
export async function TakeList({
  projectId,
  sceneId,
  shotId,
  takes,
  requiredTakes,
  canEdit,
  returnTo,
  record = false,
}: {
  projectId: string;
  sceneId: string;
  shotId: string;
  takes: TakeRecord[];
  requiredTakes: number;
  canEdit: boolean;
  returnTo: string;
  // No set o registro é a ação frequente: botões largos, OK em destaque.
  record?: boolean;
}) {
  const t = await getTranslations();
  const statusLabel: Record<TakeStatus, string> = {
    OK: t("takes.statusOk"),
    RETAKE: t("takes.statusRetake"),
    DISCARDED: t("takes.statusDiscarded"),
  };
  const ok = takes.filter((take) => take.status === "OK").length;
  const ids = { projectId, sceneId, shotId, returnTo };

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        {t("takes.summary", {
          count: takes.length,
          ok,
          required: requiredTakes,
        })}
      </p>
      {takes.length > 0 ? (
        <ol className="flex flex-col gap-1">
          {takes.map((take) => (
            <li
              key={take.id}
              className="flex flex-wrap items-center justify-between gap-2 text-sm"
            >
              <span>
                <span className="font-medium">
                  {t("takes.number", { number: take.number })}
                </span>
                {" · "}
                <StatusBadge status={take.status}>
                  {statusLabel[take.status]}
                </StatusBadge>
                {take.favorite ? t("takes.favoriteMark") : ""}
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
                      <Button
                        type="submit"
                        variant="outline"
                        aria-pressed={take.favorite}
                      >
                        {take.favorite
                          ? t("takes.unfavorite")
                          : t("takes.favorite")}
                      </Button>
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
                      <Button type="submit" variant="outline">
                        {t("takes.discard")}
                      </Button>
                    </form>
                  ) : null}
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      ) : null}
      {canEdit ? (
        <form
          action={registerTakeAction}
          className={record ? "flex flex-col gap-2" : "flex flex-wrap gap-2"}
        >
          <Hidden {...ids} />
          <label className="w-full space-y-1 text-sm">
            <span className="text-muted-foreground">{t("takes.nextNote")}</span>
            <Input name="notes" maxLength={1000} />
          </label>
          <Button
            type="submit"
            name="status"
            value="OK"
            variant={record ? "default" : "outline"}
            className={record ? "w-full" : undefined}
          >
            {t("takes.ok")}
          </Button>
          <Button
            type="submit"
            name="status"
            value="RETAKE"
            variant="outline"
            className={record ? "w-full" : undefined}
          >
            {t("takes.retake")}
          </Button>
        </form>
      ) : null}
    </div>
  );
}
