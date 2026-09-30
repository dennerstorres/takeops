"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  createIdeaAction,
  updateIdeaAction,
  type IdeaFormState,
} from "@/server/idea-actions";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { formatLabel, ideaFormats } from "@/server/idea-labels";

const initialState: IdeaFormState = null;

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
      <Field
        id="idea-title"
        label={t("ideas.titleField")}
        error={state?.fields?.title}
      >
        <Input
          id="idea-title"
          name="title"
          required
          maxLength={120}
          defaultValue={values.title}
          disabled={disabled}
          aria-invalid={state?.fields?.title ? true : undefined}
        />
      </Field>
      <Field
        id="idea-description"
        label={t("ideas.description")}
        error={state?.fields?.description}
      >
        <Textarea
          id="idea-description"
          name="description"
          rows={4}
          maxLength={4000}
          defaultValue={values.description}
          disabled={disabled}
          className="min-h-24 py-2"
        />
      </Field>
      <Field
        id="idea-format"
        label={t("ideas.format")}
        error={state?.fields?.format}
      >
        <Select
          id="idea-format"
          name="format"
          defaultValue={values.format}
          disabled={disabled}
        >
          <option value="">{t("ideas.noFormat")}</option>
          {ideaFormats.map((format) => (
            <option key={format} value={format}>
              {formatLabel(t, format)}
            </option>
          ))}
        </Select>
      </Field>
      <Field
        id="idea-objective"
        label={t("ideas.objective")}
        error={state?.fields?.objective}
      >
        <Input
          id="idea-objective"
          name="objective"
          maxLength={200}
          defaultValue={values.objective}
          disabled={disabled}
        />
      </Field>
      <Field
        id="idea-product"
        label={t("ideas.product")}
        error={state?.fields?.product}
      >
        <Input
          id="idea-product"
          name="product"
          maxLength={200}
          defaultValue={values.product}
          disabled={disabled}
        />
      </Field>
      <Field
        id="idea-audience"
        label={t("ideas.audience")}
        error={state?.fields?.audience}
      >
        <Input
          id="idea-audience"
          name="audience"
          maxLength={200}
          defaultValue={values.audience}
          disabled={disabled}
        />
      </Field>
      <Field
        id="idea-reference"
        label={t("ideas.reference")}
        error={state?.fields?.referenceUrl}
      >
        <Input
          id="idea-reference"
          name="referenceUrl"
          type="url"
          maxLength={500}
          defaultValue={values.referenceUrl}
          disabled={disabled}
        />
      </Field>
      <Field
        id="idea-notes"
        label={t("ideas.notes")}
        error={state?.fields?.notes}
      >
        <Textarea
          id="idea-notes"
          name="notes"
          rows={3}
          maxLength={4000}
          defaultValue={values.notes}
          disabled={disabled}
          className="min-h-20 py-2"
        />
      </Field>
      {state && !state.fields ? (
        <p
          className={
            state.message === "ideas.saved"
              ? "text-sm text-muted-foreground"
              : "text-sm text-destructive"
          }
          role="status"
        >
          {state.message === "ideas.saved" ? t("ideas.saved") : state.message}
        </p>
      ) : null}
      {canEdit ? (
        <Button
          type="submit"
          className="min-h-11 w-full sm:w-auto"
          disabled={pending}
        >
          {pending
            ? t("ideas.saving")
            : values.id
              ? t("ideas.save")
              : t("ideas.create")}
        </Button>
      ) : null}
    </form>
  );
}
