export type ProductionTemplateRecord = {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ProductionTemplateWrite = Pick<
  ProductionTemplateRecord,
  "name" | "description"
>;

// Todo acesso filtra pelo workspace aberto.
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
};
