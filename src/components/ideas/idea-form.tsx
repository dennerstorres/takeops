"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  createIdeaAction,
  updateIdeaAction,
  type IdeaFormState,
} from "@/server/idea-actions";
import { formatLabel, ideaFormats } from "@/server/idea-labels";

const initialState: IdeaFormState = null;

const fieldClass =
  "w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50";

export type IdeaFormValues = {
  id?: string;
  title: string;
  description: string;
  format: string;
  objective: string;
  product: string;
  audience: string;
  referenceUrl: string;
  notes: string;
};

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

export function IdeaForm({
  values,
  canEdit,
}: {
  values: IdeaFormValues;
  canEdit: boolean;
}) {
  const t = useTranslations();
  const action = values.id ? updateIdeaAction : createIdeaAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const disabled = pending || !canEdit;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {values.id ? (
        <input type="hidden" name="ideaId" value={values.id} />
      ) : null}
      <Field id="idea-title" label="Título" error={state?.fields?.title}>
        <input
          id="idea-title"
          name="title"
          required
          maxLength={120}
          defaultValue={values.title}
          disabled={disabled}
          aria-invalid={state?.fields?.title ? true : undefined}
          className={`${fieldClass} h-11`}
        />
      </Field>
      <Field
        id="idea-description"
        label="Descrição"
        error={state?.fields?.description}
      >
        <textarea
          id="idea-description"
          name="description"
          rows={4}
          maxLength={4000}
          defaultValue={values.description}
          disabled={disabled}
          className={`${fieldClass} min-h-24 py-2`}
        />
      </Field>
      <Field id="idea-format" label="Formato" error={state?.fields?.format}>
        <select
          id="idea-format"
          name="format"
          defaultValue={values.format}
          disabled={disabled}
          className={`${fieldClass} h-11`}
        >
          <option value="">Sem formato</option>
          {ideaFormats.map((format) => (
            <option key={format} value={format}>
              {formatLabel(t, format)}
            </option>
          ))}
        </select>
      </Field>
      <Field
        id="idea-objective"
        label="Objetivo"
        error={state?.fields?.objective}
      >
        <input
          id="idea-objective"
          name="objective"
          maxLength={200}
          defaultValue={values.objective}
          disabled={disabled}
          className={`${fieldClass} h-11`}
        />
      </Field>
      <Field id="idea-product" label="Produto" error={state?.fields?.product}>
        <input
          id="idea-product"
          name="product"
          maxLength={200}
          defaultValue={values.product}
          disabled={disabled}
          className={`${fieldClass} h-11`}
        />
      </Field>
      <Field id="idea-audience" label="Público" error={state?.fields?.audience}>
        <input
          id="idea-audience"
          name="audience"
          maxLength={200}
          defaultValue={values.audience}
          disabled={disabled}
          className={`${fieldClass} h-11`}
        />
      </Field>
      <Field
        id="idea-reference"
        label="Referência"
        error={state?.fields?.referenceUrl}
      >
        <input
          id="idea-reference"
          name="referenceUrl"
          type="url"
          maxLength={500}
          defaultValue={values.referenceUrl}
          disabled={disabled}
          className={`${fieldClass} h-11`}
        />
      </Field>
      <Field id="idea-notes" label="Notas" error={state?.fields?.notes}>
        <textarea
          id="idea-notes"
          name="notes"
          rows={3}
          maxLength={4000}
          defaultValue={values.notes}
          disabled={disabled}
          className={`${fieldClass} min-h-20 py-2`}
        />
      </Field>
      {state && !state.fields ? (
        <p
          className={
            state.message === "Ideia salva."
              ? "text-sm text-muted-foreground"
              : "text-sm text-destructive"
          }
          role="status"
        >
          {state.message}
        </p>
      ) : null}
      {canEdit ? (
        <Button
          type="submit"
          className="min-h-11 w-full sm:w-auto"
          disabled={pending}
        >
          {pending ? "Salvando…" : values.id ? "Salvar" : "Criar ideia"}
        </Button>
      ) : null}
    </form>
  );
}
