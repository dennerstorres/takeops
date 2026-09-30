"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  createContinuityAction,
  updateContinuityAction,
  type ContinuityFormState,
} from "@/server/continuity-actions";
import { Input, Textarea } from "@/components/ui/input";

export type ContinuityFormValues = {
  projectId: string;
  noteId?: string;
  category: string;
  title: string;
  description: string;
};

export function ContinuityForm({
  values,
  categories,
}: {
  values: ContinuityFormValues;
  categories: string[];
}) {
  const editing = Boolean(values.noteId);
  const [state, action, pending] = useActionState(
    editing ? updateContinuityAction : createContinuityAction,
    null as ContinuityFormState,
  );
  const listId = `categorias-${values.noteId ?? "nova"}`;

  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="projectId" value={values.projectId} />
      {values.noteId ? (
        <input type="hidden" name="noteId" value={values.noteId} />
      ) : null}
      {state?.message ? (
        <p role="alert" className="text-sm text-destructive">
          {state.fields
            ? (Object.values(state.fields)[0] ?? state.message)
            : state.message}
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Título
          <Input
            name="title"
            required
            maxLength={120}
            defaultValue={values.title}
            placeholder="João, Mesa, Câmera A"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Categoria (opcional)
          <Input
            name="category"
            maxLength={60}
            list={listId}
            defaultValue={values.category}
            placeholder="Pessoas, Cenário, Câmera"
          />
          <datalist id={listId}>
            {categories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        Como deve estar
        <Textarea
          name="description"
          required
          maxLength={2000}
          rows={3}
          defaultValue={values.description}
          placeholder={"camiseta preta\ncadeira esquerda"}
          className="py-2"
        />
      </label>
      <Button type="submit" disabled={pending} className="min-h-11 w-fit">
        {editing ? "Salvar nota" : "Adicionar nota"}
      </Button>
    </form>
  );
}
