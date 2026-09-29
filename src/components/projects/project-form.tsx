"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { formatLabel, ideaFormats } from "@/server/idea-labels";
import {
  createProjectAction,
  updateProjectAction,
  type ProjectFormState,
} from "@/server/project-actions";
import {
  aspectLabel,
  aspectRatios,
  priorityLabel,
  projectPriorities,
} from "@/server/project-labels";

const initialState: ProjectFormState = null;
const fieldClass =
  "w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50";

export type ProjectOption = { id: string; label: string };

export type ProjectFormValues = {
  id?: string;
  title: string;
  slug: string;
  description: string;
  objective: string;
  audience: string;
  product: string;
  format: string;
  aspectRatio: string;
  estimatedDurationSeconds: string;
  priority: string;
  thumbnailUrl: string;
  ownerId: string;
  plannedShootDate: string;
  plannedPublishDate: string;
  sourceIdeaId: string;
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

export function ProjectForm({
  values,
  canEdit,
  people,
  ideas,
  templateId,
}: {
  values: ProjectFormValues;
  canEdit: boolean;
  people: ProjectOption[];
  ideas: ProjectOption[];
  // Só na criação: a produção nasce com cópia das cenas e do checklist.
  templateId?: string;
}) {
  const action = values.id ? updateProjectAction : createProjectAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const disabled = pending || !canEdit;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {values.id ? (
        <input type="hidden" name="projectId" value={values.id} />
      ) : null}
      {!values.id && templateId ? (
        <input type="hidden" name="templateId" value={templateId} />
      ) : null}
      <Field id="project-title" label="Título" error={state?.fields?.title}>
        <input
          id="project-title"
          name="title"
          required
          maxLength={120}
          defaultValue={values.title}
          disabled={disabled}
          className={`${fieldClass} h-11`}
        />
      </Field>
      <Field id="project-format" label="Formato" error={state?.fields?.format}>
        <select
          id="project-format"
          name="format"
          defaultValue={values.format}
          disabled={disabled}
          className={`${fieldClass} h-11`}
        >
          {ideaFormats.map((format) => (
            <option key={format} value={format}>
              {formatLabel(format)}
            </option>
          ))}
        </select>
      </Field>
      <Field
        id="project-aspect"
        label="Proporção"
        error={state?.fields?.aspectRatio}
      >
        <select
          id="project-aspect"
          name="aspectRatio"
          defaultValue={values.aspectRatio}
          disabled={disabled}
          className={`${fieldClass} h-11`}
        >
          {aspectRatios.map((ratio) => (
            <option key={ratio} value={ratio}>
              {aspectLabel(ratio)}
            </option>
          ))}
        </select>
      </Field>
      <Field
        id="project-priority"
        label="Prioridade"
        error={state?.fields?.priority}
      >
        <select
          id="project-priority"
          name="priority"
          defaultValue={values.priority}
          disabled={disabled}
          className={`${fieldClass} h-11`}
        >
          {projectPriorities.map((priority) => (
            <option key={priority} value={priority}>
              {priorityLabel(priority)}
            </option>
          ))}
        </select>
      </Field>
      <Field
        id="project-slug"
        label="Identificador"
        error={state?.fields?.slug}
      >
        <input
          id="project-slug"
          name="slug"
          maxLength={60}
          defaultValue={values.slug}
          disabled={disabled}
          className={`${fieldClass} h-11`}
        />
      </Field>
      <Field
        id="project-description"
        label="Descrição"
        error={state?.fields?.description}
      >
        <textarea
          id="project-description"
          name="description"
          rows={4}
          maxLength={4000}
          defaultValue={values.description}
          disabled={disabled}
          className={`${fieldClass} min-h-24 py-2`}
        />
      </Field>
      <Field
        id="project-objective"
        label="Objetivo"
        error={state?.fields?.objective}
      >
        <input
          id="project-objective"
          name="objective"
          maxLength={200}
          defaultValue={values.objective}
          disabled={disabled}
          className={`${fieldClass} h-11`}
        />
      </Field>
      <Field
        id="project-audience"
        label="Público"
        error={state?.fields?.audience}
      >
        <input
          id="project-audience"
          name="audience"
          maxLength={200}
          defaultValue={values.audience}
          disabled={disabled}
          className={`${fieldClass} h-11`}
        />
      </Field>
      <Field
        id="project-product"
        label="Produto"
        error={state?.fields?.product}
      >
        <input
          id="project-product"
          name="product"
          maxLength={200}
          defaultValue={values.product}
          disabled={disabled}
          className={`${fieldClass} h-11`}
        />
      </Field>
      <Field
        id="project-duration"
        label="Duração em segundos"
        error={state?.fields?.estimatedDurationSeconds}
      >
        <input
          id="project-duration"
          name="estimatedDurationSeconds"
          inputMode="numeric"
          defaultValue={values.estimatedDurationSeconds}
          disabled={disabled}
          className={`${fieldClass} h-11`}
        />
      </Field>
      <Field
        id="project-thumb"
        label="Thumbnail"
        error={state?.fields?.thumbnailUrl}
      >
        <input
          id="project-thumb"
          name="thumbnailUrl"
          type="url"
          maxLength={500}
          defaultValue={values.thumbnailUrl}
          disabled={disabled}
          className={`${fieldClass} h-11`}
        />
      </Field>
      <Field
        id="project-owner"
        label="Responsável"
        error={state?.fields?.ownerId}
      >
        <select
          id="project-owner"
          name="ownerId"
          defaultValue={values.ownerId}
          disabled={disabled}
          className={`${fieldClass} h-11`}
        >
          <option value="">Sem responsável</option>
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.label}
            </option>
          ))}
        </select>
      </Field>
      <Field
        id="project-shoot"
        label="Gravação"
        error={state?.fields?.plannedShootDate}
      >
        <input
          id="project-shoot"
          name="plannedShootDate"
          type="date"
          defaultValue={values.plannedShootDate}
          disabled={disabled}
          className={`${fieldClass} h-11`}
        />
      </Field>
      <Field
        id="project-publish"
        label="Publicação"
        error={state?.fields?.plannedPublishDate}
      >
        <input
          id="project-publish"
          name="plannedPublishDate"
          type="date"
          defaultValue={values.plannedPublishDate}
          disabled={disabled}
          className={`${fieldClass} h-11`}
        />
      </Field>
      <Field
        id="project-idea"
        label="Ideia de origem"
        error={state?.fields?.sourceIdeaId}
      >
        <select
          id="project-idea"
          name="sourceIdeaId"
          defaultValue={values.sourceIdeaId}
          disabled={disabled}
          className={`${fieldClass} h-11`}
        >
          <option value="">Nenhuma</option>
          {ideas.map((idea) => (
            <option key={idea.id} value={idea.id}>
              {idea.label}
            </option>
          ))}
        </select>
      </Field>
      {state && !state.fields ? (
        <p
          className={
            state.message === "Produção salva."
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
          {pending ? "Salvando…" : values.id ? "Salvar" : "Criar produção"}
        </Button>
      ) : null}
    </form>
  );
}
