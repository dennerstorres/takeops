import { useTranslations } from "next-intl";
import { AddShootEquipmentForm } from "@/components/shoots/add-shoot-equipment-form";
import {
  removeShootEquipmentAction,
  toggleShootEquipmentAction,
} from "@/server/shoot-actions";
import { equipmentCategoryLabel } from "@/server/equipment-labels";
import type { ShootEquipmentRecord } from "@/server/shoot-equipment-repository";

const buttonClass =
  "inline-flex min-h-11 items-center rounded-lg border px-3 text-sm";

export function ShootEquipment({
  projectId,
  shootId,
  rows,
  catalog,
  canEdit,
}: {
  projectId: string;
  shootId: string;
  rows: ShootEquipmentRecord[];
  catalog: { id: string; label: string }[];
  canEdit: boolean;
}) {
  const t = useTranslations();
  const used = new Set(rows.map((row) => row.equipmentItemId));
  const options = catalog.filter((item) => !used.has(item.id));
  const checked = rows.filter((row) => row.checked).length;

  return (
    <section className="space-y-2">
      <h3 className="text-sm font-medium">
        Equipamentos
        {rows.length > 0 ? (
          <span className="font-normal text-muted-foreground">
            {" "}
            · {checked} de {rows.length} conferidos
          </span>
        ) : null}
      </h3>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum equipamento.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-2"
            >
              <p className="min-w-0 text-sm">
                <span className={row.checked ? "line-through" : undefined}>
                  {row.item.name}
                </span>
                <span className="text-muted-foreground">
                  {" "}
                  · {equipmentCategoryLabel(t, row.item.category)}
                  {row.required ? "" : " · opcional"}
                  {row.notes ? ` · ${row.notes}` : ""}
                </span>
              </p>
              {canEdit ? (
                <div className="flex gap-2">
                  <form action={toggleShootEquipmentAction}>
                    <input type="hidden" name="projectId" value={projectId} />
                    <input type="hidden" name="shootId" value={shootId} />
                    <input type="hidden" name="rowId" value={row.id} />
                    {row.required ? (
                      <input type="hidden" name="required" value="on" />
                    ) : null}
                    {row.checked ? null : (
                      <input type="hidden" name="checked" value="on" />
                    )}
                    <input type="hidden" name="notes" value={row.notes ?? ""} />
                    <button
                      type="submit"
                      aria-pressed={row.checked}
                      className={buttonClass}
                    >
                      {row.checked ? "Desmarcar" : "Conferir"}
                    </button>
                  </form>
                  <form action={removeShootEquipmentAction}>
                    <input type="hidden" name="projectId" value={projectId} />
                    <input type="hidden" name="shootId" value={shootId} />
                    <input type="hidden" name="rowId" value={row.id} />
                    <button type="submit" className={buttonClass}>
                      Tirar
                    </button>
                  </form>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">
                  {row.checked ? "Conferido" : "A conferir"}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      {canEdit && options.length > 0 ? (
        <AddShootEquipmentForm
          projectId={projectId}
          shootId={shootId}
          options={options}
        />
      ) : null}
    </section>
  );
}
