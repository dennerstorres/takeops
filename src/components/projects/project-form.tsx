"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
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
import { Input, Select, Textarea } from "@/components/ui/input";

const initialState: ProjectFormState = null;

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
  const t = useTranslations();
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
        <Input
          id="project-title"
          name="title"
          required
          maxLength={120}
          defaultValue={values.title}
          disabled={disabled}
        />
      </Field>
      <Field id="project-format" label="Formato" error={state?.fields?.format}>
        <Select
          id="project-format"
          name="format"
          defaultValue={values.format}
          disabled={disabled}
        >
          {ideaFormats.map((format) => (
            <option key={format} value={format}>
              {formatLabel(t, format)}
            </option>
          ))}
        </Select>
      </Field>
      <Field
        id="project-aspect"
        label="Proporção"
        error={state?.fields?.aspectRatio}
      >
        <Select
          id="project-aspect"
          name="aspectRatio"
          defaultValue={values.aspectRatio}
          disabled={disabled}
        >
          {aspectRatios.map((ratio) => (
            <option key={ratio} value={ratio}>
              {aspectLabel(t, ratio)}
            </option>
          ))}
        </Select>
      </Field>
      <Field
        id="project-priority"
        label="Prioridade"
        error={state?.fields?.priority}
      >
        <Select
          id="project-priority"
          name="priority"
          defaultValue={values.priority}
          disabled={disabled}
        >
          {projectPriorities.map((priority) => (
            <option key={priority} value={priority}>
              {priorityLabel(t, priority)}
            </option>
          ))}
        </Select>
      </Field>
      <Field
        id="project-slug"
        label="Identificador"
        error={state?.fields?.slug}
      >
        <Input
          id="project-slug"
          name="slug"
          maxLength={60}
          defaultValue={values.slug}
          disabled={disabled}
        />
      </Field>
      <Field
        id="project-description"
        label="Descrição"
        error={state?.fields?.description}
      >
        <Textarea
          id="project-description"
          name="description"
          rows={4}
          maxLength={4000}
          defaultValue={values.description}
          disabled={disabled}
          className="min-h-24 py-2"
        />
      </Field>
      <Field
        id="project-objective"
        label="Objetivo"
        error={state?.fields?.objective}
      >
        <Input
          id="project-objective"
          name="objective"
          maxLength={200}
          defaultValue={values.objective}
          disabled={disabled}
        />
      </Field>
      <Field
        id="project-audience"
        label="Público"
        error={state?.fields?.audience}
      >
        <Input
          id="project-audience"
          name="audience"
          maxLength={200}
          defaultValue={values.audience}
          disabled={disabled}
        />
      </Field>
      <Field
        id="project-product"
        label="Produto"
        error={state?.fields?.product}
      >
        <Input
          id="project-product"
          name="product"
          maxLength={200}
          defaultValue={values.product}
          disabled={disabled}
        />
      </Field>
      <Field
        id="project-duration"
        label="Duração em segundos"
        error={state?.fields?.estimatedDurationSeconds}
      >
        <Input
          id="project-duration"
          name="estimatedDurationSeconds"
          inputMode="numeric"
          defaultValue={values.estimatedDurationSeconds}
          disabled={disabled}
        />
      </Field>
      <Field
        id="project-thumb"
        label="Thumbnail"
        error={state?.fields?.thumbnailUrl}
      >
        <Input
          id="project-thumb"
          name="thumbnailUrl"
          type="url"
          maxLength={500}
          defaultValue={values.thumbnailUrl}
          disabled={disabled}
        />
      </Field>
      <Field
        id="project-owner"
        label="Responsável"
        error={state?.fields?.ownerId}
      >
        <Select
          id="project-owner"
          name="ownerId"
          defaultValue={values.ownerId}
          disabled={disabled}
        >
          <option value="">Sem responsável</option>
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field
        id="project-shoot"
        label="Gravação"
        error={state?.fields?.plannedShootDate}
      >
        <Input
          id="project-shoot"
          name="plannedShootDate"
          type="date"
          defaultValue={values.plannedShootDate}
          disabled={disabled}
        />
      </Field>
      <Field
        id="project-publish"
        label="Publicação"
        error={state?.fields?.plannedPublishDate}
      >
        <Input
          id="project-publish"
          name="plannedPublishDate"
          type="date"
          defaultValue={values.plannedPublishDate}
          disabled={disabled}
        />
      </Field>
      <Field
        id="project-idea"
        label="Ideia de origem"
        error={state?.fields?.sourceIdeaId}
      >
        <Select
          id="project-idea"
          name="sourceIdeaId"
          defaultValue={values.sourceIdeaId}
          disabled={disabled}
        >
          <option value="">Nenhuma</option>
          {ideas.map((idea) => (
            <option key={idea.id} value={idea.id}>
              {idea.label}
            </option>
          ))}
        </Select>
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
