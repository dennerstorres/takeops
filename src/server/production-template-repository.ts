import type { SceneType } from "./scene-labels.ts";

export type ProductionTemplateRecord = {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  checklistTemplateId: string | null;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ProductionTemplateWrite = Pick<
  ProductionTemplateRecord,
  "name" | "description"
>;

export type TemplateSceneRecord = {
  id: string;
  templateId: string;
  order: number;
  title: string;
  type: SceneType;
  description: string | null;
};

export type TemplateSceneWrite = Pick<
  TemplateSceneRecord,
  "title" | "type" | "description"
>;

// Todo acesso filtra pelo workspace aberto. As operações de cena devolvem a
// lista inteira, já renumerada, ou null quando o template não é visível.
export type ProductionTemplateRepository = {
  list(workspaceId: string): Promise<ProductionTemplateRecord[]>;
  find(
    workspaceId: string,
    templateId: string,
  ): Promise<ProductionTemplateRecord | null>;
  create(
    workspaceId: string,
    input: ProductionTemplateWrite & { createdById: string },
  ): Promise<ProductionTemplateRecord>;
  update(
    workspaceId: string,
    templateId: string,
    input: ProductionTemplateWrite,
  ): Promise<ProductionTemplateRecord | null>;
  remove(workspaceId: string, templateId: string): Promise<boolean>;
  listScenes(
    workspaceId: string,
    templateId: string,
  ): Promise<TemplateSceneRecord[] | null>;
  addScene(
    workspaceId: string,
    templateId: string,
    input: TemplateSceneWrite,
  ): Promise<TemplateSceneRecord[] | null>;
  removeScene(
    workspaceId: string,
    templateId: string,
    sceneId: string,
  ): Promise<TemplateSceneRecord[] | null>;
  // Copia cenas e itens do checklist para a produção numa transação,
  // depois das cenas e itens que ela já tiver. null quando template ou
  // produção não são visíveis no workspace.
  applyToProject(
    workspaceId: string,
    templateId: string,
    projectId: string,
  ): Promise<{ scenes: number; checklistItems: number } | null>;
  projectChecklist(
    workspaceId: string,
    projectId: string,
  ): Promise<{ id: string; order: number; text: string }[]>;
  // "invalid" quando o checklist não é do mesmo workspace.
  setChecklist(
    workspaceId: string,
    templateId: string,
    checklistTemplateId: string | null,
  ): Promise<ProductionTemplateRecord | "invalid" | null>;
  moveScene(
    workspaceId: string,
    templateId: string,
    sceneId: string,
    direction: "up" | "down",
  ): Promise<TemplateSceneRecord[] | null>;
};
