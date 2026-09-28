import type { EquipmentCategory } from "./equipment-labels.ts";

export type EquipmentRecord = {
  id: string;
  workspaceId: string;
  name: string;
  category: EquipmentCategory;
  notes: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type EquipmentWrite = Pick<
  EquipmentRecord,
  "name" | "category" | "notes" | "active"
>;

export type EquipmentRepository = {
  list(workspaceId: string): Promise<EquipmentRecord[]>;
  find(workspaceId: string, itemId: string): Promise<EquipmentRecord | null>;
  create(workspaceId: string, input: EquipmentWrite): Promise<EquipmentRecord>;
  update(
    workspaceId: string,
    itemId: string,
    input: EquipmentWrite,
  ): Promise<EquipmentRecord | null>;
};
