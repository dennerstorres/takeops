"use client";

import { useTranslations } from "next-intl";
import { useActionState, useEffect, useRef, useState } from "react";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { Button } from "@/components/ui/button";
import { surfaceClass } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  createCharacterAction,
  deleteCharacterAction,
  updateCharacterAction,
  type CharacterFormState,
} from "@/server/character-actions";

export type CastRow = {
  id: string;
  name: string;
  actorName: string | null;
  userId: string | null;
  sceneCount: number;
};

type Person = { id: string; label: string };

export function CastSection({
  projectId,
  cast,
  people,
  canEdit,
}: {
  projectId: string;
  cast: CastRow[];
  people: Person[];
  canEdit: boolean;
}) {
  const t = useTranslations();
  const personName = (id: string | null) =>
    people.find((person) => person.id === id)?.label ?? null;

  return (
    <section className="space-y-3">
      <h2 className="font-condensed text-sm font-semibold tracking-wider uppercase">
        {t("cast.title")}
      </h2>
      {cast.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("cast.empty")}</p>
      ) : (
        <ul className="grid gap-2">
          {cast.map((row) =>
            canEdit ? (
              <CastEditRow
                key={row.id}
                projectId={projectId}
                row={row}
                people={people}
              />
            ) : (
              <li key={row.id} className={cn(surfaceClass, "p-3 text-sm")}>
                <span className="font-medium">{row.name}</span>
                {row.actorName || row.userId ? (
                  <span className="text-muted-foreground">
                    {" · "}
                    {row.actorName ?? personName(row.userId)}
                  </span>
                ) : null}
                <span className="text-muted-foreground">
                  {" · "}
                  {t("cast.scenes", { count: row.sceneCount })}
                </span>
              </li>
            ),
          )}
        </ul>
      )}
      {canEdit ? (
        <CastCreateForm projectId={projectId} people={people} />
      ) : null}
    </section>
  );
}

function CastFields({ row, people }: { row?: CastRow; people: Person[] }) {
  const t = useTranslations();
  return (
    <>
      <label className="flex flex-col gap-1 text-sm">
        {t("cast.name")}
        <Input name="name" required maxLength={80} defaultValue={row?.name} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {t("cast.actor")}
        <Input
          name="actorName"
          maxLength={80}
          defaultValue={row?.actorName ?? ""}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {t("cast.person")}
        <Select name="userId" defaultValue={row?.userId ?? ""}>
          <option value="">{t("scenes.nobody")}</option>
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.label}
            </option>
          ))}
        </Select>
      </label>
    </>
  );
}

function FormError({ state }: { state: CharacterFormState }) {
  if (!state || state.ok) return null;
  return (
    <p role="alert" className="text-sm text-destructive sm:col-span-4">
      {state.fields
        ? (Object.values(state.fields)[0] ?? state.message)
        : state.message}
    </p>
  );
}

function CastCreateForm({
  projectId,
  people,
}: {
  projectId: string;
  people: Person[];
}) {
  const t = useTranslations();
  const [state, action, pending] = useActionState(createCharacterAction, null);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={action}
      className="grid items-end gap-3 sm:grid-cols-4"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <CastFields people={people} />
      <Button type="submit" disabled={pending} className="min-h-11 w-fit">
        {t("cast.add")}
      </Button>
      <FormError state={state} />
    </form>
  );
}

function CastEditRow({
  projectId,
  row,
  people,
}: {
  projectId: string;
  row: CastRow;
  people: Person[];
}) {
  const t = useTranslations();
  const [state, action, pending] = useActionState(updateCharacterAction, null);
  const [confirming, setConfirming] = useState(false);
  const deleteFormId = `excluir-personagem-${row.id}`;

  return (
    <li className={cn(surfaceClass, "grid gap-2 p-3")}>
      <form action={action} className="grid items-end gap-3 sm:grid-cols-4">
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="characterId" value={row.id} />
        <CastFields row={row} people={people} />
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="submit"
            variant="outline"
            disabled={pending}
            className="min-h-11"
          >
            {t("common.save")}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            onClick={() => setConfirming(true)}
          >
            {t("common.delete")}
          </Button>
        </div>
        <FormError state={state} />
      </form>
      <p className="text-xs text-muted-foreground">
        {t("cast.scenes", { count: row.sceneCount })}
      </p>
      <form id={deleteFormId} action={deleteCharacterAction} hidden>
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="characterId" value={row.id} />
      </form>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t("cast.deleteTitle", { name: row.name })}
        description={t("cast.deleteDescription")}
        confirmLabel={t("common.delete")}
        destructive
        onConfirm={() => {
          const form = document.getElementById(
            deleteFormId,
          ) as HTMLFormElement | null;
          form?.requestSubmit();
        }}
      />
    </li>
  );
}
