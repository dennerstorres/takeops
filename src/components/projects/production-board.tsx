"use client";

import { AlertTriangle, ArrowRightLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useRef, useState } from "react";
import {
  moveProjectStatusAction,
  type ProjectFormState,
} from "@/server/project-actions";
import { Input } from "@/components/ui/input";
import { Strip, StripBoard, StripGroup } from "@/components/ui/strip";
import { stripPhase, type StripTip } from "@/components/ui/strip-phase";
import { cn } from "@/lib/utils";

type BoardCard = {
  id: string;
  title: string;
  people: string[];
  shootDate: string | null;
  priority: string;
  alerts: string[];
  tip: StripTip;
  checklist: { done: number; total: number } | null;
};

type BoardColumn = {
  status: string;
  title: string;
  cards: BoardCard[];
};

// Quadro de tiras (ADR-045): uma tira por produção, agrupada por etapa.
// Mudar de etapa: arrastar a tira até outra divisória ou usar o seletor
// da própria tira, que serve para teclado e toque.
export function ProductionBoard({
  columns,
  canEdit,
  canApprove,
  hideEmpty,
}: {
  columns: BoardColumn[];
  canEdit: boolean;
  canApprove: boolean;
  hideEmpty: boolean;
}) {
  const t = useTranslations();
  const [state, action, pending] = useActionState(
    moveProjectStatusAction,
    null as ProjectFormState,
  );
  const [over, setOver] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const projectIdRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLInputElement>(null);

  function move(projectId: string, status: string) {
    if (!canEdit || pending) return;
    if (status === "APPROVED" && !canApprove) return;
    if (!projectId || !projectIdRef.current || !statusRef.current) return;
    projectIdRef.current.value = projectId;
    statusRef.current.value = status;
    formRef.current?.requestSubmit();
  }

  const visible = hideEmpty
    ? columns.filter((column) => column.cards.length > 0)
    : columns;

  return (
    <div className="flex flex-col gap-2">
      {state?.message ? (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      ) : null}
      <form ref={formRef} action={action} className="hidden">
        <Input ref={projectIdRef} name="projectId" defaultValue="" />
        <Input ref={statusRef} name="status" defaultValue="" />
      </form>
      <StripBoard
        label={t("projects.title")}
        columns={{
          number: t("projects.priority"),
          title: t("common.title"),
          owner: t("projects.board.people"),
          date: t("projects.board.shoot"),
          meta: t("projects.board.checklist"),
          action: canEdit ? t("projects.board.stage") : undefined,
        }}
        className={cn(pending && "opacity-70")}
      >
        {visible.map((column) => (
          <StripGroup
            key={column.status}
            label={column.title}
            count={column.cards.length}
            className={cn(
              "rounded-[2px]",
              over === column.status &&
                "outline-2 outline-offset-1 outline-ring",
            )}
            onDragOver={(event) => {
              if (!canEdit) return;
              event.preventDefault();
              setOver(column.status);
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node))
                setOver(null);
            }}
            onDrop={(event) => {
              if (!canEdit) return;
              event.preventDefault();
              setOver(null);
              move(event.dataTransfer.getData("text/plain"), column.status);
            }}
          >
            {column.cards.map((card) => (
              <Strip
                key={card.id}
                phase={stripPhase(column.status)}
                stageLabel={column.title}
                number={card.priority}
                title={card.title}
                flag={
                  card.alerts.length > 0
                    ? card.alerts.map((alert) => (
                        <span
                          key={alert}
                          title={alert}
                          className="flex min-w-0 items-center gap-1 font-condensed text-xs font-medium"
                        >
                          <AlertTriangle
                            className="size-3 shrink-0"
                            aria-hidden="true"
                          />
                          <span className="truncate">{alert}</span>
                        </span>
                      ))
                    : null
                }
                owner={
                  <span title={card.people.join(", ")}>
                    {card.people.join(", ")}
                  </span>
                }
                date={card.shootDate}
                meta={
                  card.checklist
                    ? `${card.checklist.done}/${card.checklist.total}`
                    : null
                }
                tip={card.tip}
                href={`/producoes/${card.id}`}
                linkProps={{
                  draggable: canEdit,
                  onDragStart: (event) => {
                    event.dataTransfer.setData("text/plain", card.id);
                    event.dataTransfer.effectAllowed = "move";
                  },
                  onDragEnd: () => setOver(null),
                }}
                action={
                  canEdit ? (
                    <span className="relative block">
                      <select
                        aria-label={t("projects.moveCard", {
                          title: card.title,
                        })}
                        value={column.status}
                        disabled={pending}
                        onChange={(event) => move(card.id, event.target.value)}
                        className="h-11 w-11 appearance-none text-transparent sm:h-6 sm:w-full sm:max-w-32 sm:appearance-auto sm:border-transparent sm:text-strip-ink sm:group-hover:border-strip-ink/25 sm:hover:border-strip-ink/40 sm:focus-visible:border-strip-ink/40 rounded-[2px] border border-strip-ink/25 bg-transparent px-1 font-condensed text-xs focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50 [&>option]:bg-popover [&>option]:text-popover-foreground"
                      >
                        {columns.map((option) => (
                          <option
                            key={option.status}
                            value={option.status}
                            disabled={
                              option.status === "APPROVED" &&
                              !canApprove &&
                              column.status !== "APPROVED"
                            }
                          >
                            {option.title}
                          </option>
                        ))}
                      </select>
                      {/* No celular o seletor vira ícone para não roubar o título. */}
                      <ArrowRightLeft
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 m-auto size-4 sm:hidden"
                      />
                    </span>
                  ) : null
                }
              />
            ))}
          </StripGroup>
        ))}
      </StripBoard>
    </div>
  );
}
