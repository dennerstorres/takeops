export const checklistTypes = ["SHOOT", "OTHER"] as const;

export type ChecklistType = (typeof checklistTypes)[number];

export type ChecklistTemplateItemRecord = {
  id: string;
  checklistTemplateId: string;
  order: number;
  text: string;
};

export type ChecklistTemplateRecord = {
  id: string;
  workspaceId: string;
  name: string;
  type: ChecklistType;
  createdAt: Date;
  items: ChecklistTemplateItemRecord[];
};

export type ChecklistTemplateWrite = { name: string; type: ChecklistType };

export type ChecklistRepository = {
  list(workspaceId: string): Promise<ChecklistTemplateRecord[]>;
  find(
    workspaceId: string,
    templateId: string,
  ): Promise<ChecklistTemplateRecord | null>;
  create(
    workspaceId: string,
    input: ChecklistTemplateWrite,
    items: readonly string[],
  ): Promise<ChecklistTemplateRecord>;
  update(
    workspaceId: string,
    templateId: string,
    input: ChecklistTemplateWrite,
  ): Promise<ChecklistTemplateRecord | null>;
  remove(workspaceId: string, templateId: string): Promise<boolean>;
  addItem(
    workspaceId: string,
    templateId: string,
    text: string,
  ): Promise<ChecklistTemplateRecord | null>;
  updateItem(
    workspaceId: string,
    templateId: string,
    itemId: string,
    text: string,
  ): Promise<ChecklistTemplateRecord | null>;
  removeItem(
    workspaceId: string,
    templateId: string,
    itemId: string,
  ): Promise<ChecklistTemplateRecord | null>;
  reorderItems(
    workspaceId: string,
    templateId: string,
    orderedIds: readonly string[],
  ): Promise<ChecklistTemplateRecord | null>;
};
