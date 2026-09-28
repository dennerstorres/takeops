import type { EquipmentCategory } from "./equipment-labels.ts";

export type ShootEquipmentRecord = {
  id: string;
  shootId: string;
  equipmentItemId: string;
  required: boolean;
  checked: boolean;
  notes: string | null;
  item: { name: string; category: EquipmentCategory; active: boolean };
};

// Toda consulta chega à linha pela gravação visível da produção do workspace.
export type ShootEquipmentScope = {
  workspaceId: string;
  projectId: string;
  shootId: string;
};

export type ShootEquipmentRepository = {
  list(scope: ShootEquipmentScope): Promise<ShootEquipmentRecord[]>;
  add(
    scope: ShootEquipmentScope,
    input: { equipmentItemId: string; required: boolean; notes: string | null },
  ): Promise<ShootEquipmentRecord | "duplicate" | null>;
  update(
    scope: ShootEquipmentScope,
    rowId: string,
    input: { required: boolean; checked: boolean; notes: string | null },
  ): Promise<ShootEquipmentRecord | null>;
  remove(scope: ShootEquipmentScope, rowId: string): Promise<boolean>;
};
