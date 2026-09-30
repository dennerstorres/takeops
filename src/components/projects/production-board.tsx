"use client";

import Link from "next/link";
import { useActionState, useRef } from "react";
import {
  moveProjectStatusAction,
  type ProjectFormState,
} from "@/server/project-actions";
import { Input, Select } from "@/components/ui/input";

type BoardCard = {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  people: string[];
  shootDate: string | null;
  priority: string;
  alerts: string[];
};

type BoardColumn = {
  status: string;
  title: string;
  cards: BoardCard[];
};

export function ProductionBoard({
  columns,
  canEdit,
  canApprove,
}: {
  columns: BoardColumn[];
  canEdit: boolean;
  canApprove: boolean;
}) {
  const [state, action, pending] = useActionState(
    moveProjectStatusAction,
    null as ProjectFormState,
  );
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

  function dropOn(status: string, event: React.DragEvent<HTMLElement>) {
    if (!canEdit || pending) return;
    event.preventDefault();
    move(event.dataTransfer.getData("text/plain"), status);
  }

  return (
    <div className="flex flex-col gap-3">
      {state?.message ? (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      ) : null}
      <form ref={formRef} action={action} className="hidden">
        <Input ref={projectIdRef} name="projectId" defaultValue="" />
        <Input ref={statusRef} name="status" defaultValue="" />
      </form>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {columns.map((column) => (
          <section
            key={column.status}
            aria-label={column.title}
            className="flex w-64 shrink-0 flex-col gap-2"
            onDragOver={(event) => {
              if (!canEdit) return;
              event.preventDefault();
            }}
            onDrop={(event) => dropOn(column.status, event)}
          >
            <h2 className="text-sm font-medium">
              {column.title}
              <span className="ml-2 text-muted-foreground">
                {column.cards.length}
              </span>
            </h2>
            <ul className="flex min-h-11 flex-col gap-2">
              {column.cards.map((card) => (
                <li key={card.id}>
                  <Link
                    href={`/producoes/${card.id}`}
                    draggable={canEdit}
                    onDragStart={(event) => {
                      event.dataTransfer.setData("text/plain", card.id);
                      event.dataTransfer.effectAllowed = "move";
                    }}
                    className="flex min-h-11 flex-col gap-2 rounded-xl border p-3 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                  >
                    {card.thumbnailUrl ? (
                      // URL externa da produção; o app não define remotePatterns.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={card.thumbnailUrl}
                        alt=""
                        className="h-24 w-full rounded-lg object-cover"
                      />
                    ) : null}
                    <span className="truncate text-sm font-medium">
                      {card.title}
                    </span>
                    {card.people.length > 0 ? (
                      <span className="truncate text-sm text-muted-foreground">
                        {card.people.join(", ")}
                      </span>
                    ) : null}
                    <span className="text-sm text-muted-foreground">
                      {card.priority}
                      {card.shootDate ? ` · ${card.shootDate}` : ""}
                    </span>
                    {card.alerts.length > 0 ? (
                      <ul>
                        {card.alerts.map((alert) => (
                          <li key={alert} className="text-sm text-destructive">
                            {alert}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </Link>
                  {canEdit ? (
                    // Arrastar não funciona por teclado nem no toque.
                    <Select
                      aria-label={`Mover ${card.title} para`}
                      value={column.status}
                      disabled={pending}
                      onChange={(event) => move(card.id, event.target.value)}
                      className="mt-1"
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
                    </Select>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
