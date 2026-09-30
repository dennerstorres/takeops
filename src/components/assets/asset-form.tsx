"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  createAssetAction,
  updateAssetAction,
  type AssetFormState,
} from "@/server/asset-actions";
import {
  assetTypeLabel,
  assetTypes,
  type AssetType,
} from "@/server/asset-labels";
import { Input, Select } from "@/components/ui/input";

export type AssetFormValues = {
  projectId: string;
  assetId?: string;
  type: AssetType;
  title: string;
  url: string;
  description: string;
};

export function AssetForm({ values }: { values: AssetFormValues }) {
  const t = useTranslations();
  const editing = Boolean(values.assetId);
  const [state, action, pending] = useActionState(
    editing ? updateAssetAction : createAssetAction,
    null as AssetFormState,
  );

  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="projectId" value={values.projectId} />
      {values.assetId ? (
        <input type="hidden" name="assetId" value={values.assetId} />
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
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Tipo
          <Select name="type" defaultValue={values.type}>
            {assetTypes.map((type) => (
              <option key={type} value={type}>
                {assetTypeLabel(t, type)}
              </option>
            ))}
          </Select>
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        Link
        <Input
          name="url"
          type="url"
          inputMode="url"
          required
          maxLength={2048}
          defaultValue={values.url}
          placeholder="https://drive.google.com/..."
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Descrição (opcional)
        <Input
          name="description"
          maxLength={1000}
          defaultValue={values.description}
        />
      </label>
      <Button type="submit" disabled={pending} className="min-h-11 w-fit">
        {editing ? "Salvar link" : "Adicionar link"}
      </Button>
    </form>
  );
}
