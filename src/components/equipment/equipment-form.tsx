"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  createEquipmentAction,
  updateEquipmentAction,
  type EquipmentFormState,
} from "@/server/equipment-actions";
import {
  equipmentCategories,
  equipmentCategoryLabel,
  type EquipmentCategory,
} from "@/server/equipment-labels";

const fieldClass =
  "h-11 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export type EquipmentFormValues = {
  itemId?: string;
  name: string;
  category: EquipmentCategory;
  notes: string;
  active: boolean;
};

export function EquipmentForm({ values }: { values: EquipmentFormValues }) {
  const editing = Boolean(values.itemId);
  const [state, action, pending] = useActionState(
    editing ? updateEquipmentAction : createEquipmentAction,
    null as EquipmentFormState,
  );

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      {values.itemId ? (
        <input type="hidden" name="itemId" value={values.itemId} />
      ) : null}
      {state?.message ? (
        <p role="alert" className="text-sm text-destructive sm:col-span-2">
          {state.fields
            ? (Object.values(state.fields)[0] ?? state.message)
            : state.message}
        </p>
      ) : null}
      <label className="flex flex-col gap-1 text-sm">
        Nome
        <input
          name="name"
          required
          maxLength={120}
          defaultValue={values.name}
          className={fieldClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Categoria
        <select
          name="category"
          defaultValue={values.category}
          className={fieldClass}
        >
          {equipmentCategories.map((category) => (
            <option key={category} value={category}>
              {equipmentCategoryLabel(category)}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        Notas
        <input
          name="notes"
          maxLength={1000}
          defaultValue={values.notes}
          className={fieldClass}
        />
      </label>
      {editing ? (
        <label className="flex min-h-11 items-center gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            name="active"
            defaultChecked={values.active}
            className="size-5"
          />
          Disponível para novas gravações
        </label>
      ) : null}
      <Button type="submit" disabled={pending} className="min-h-11 w-fit">
        {editing ? "Salvar equipamento" : "Adicionar equipamento"}
      </Button>
    </form>
  );
}
