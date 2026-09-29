import type { AssetType } from "./asset-labels.ts";

export type AssetRecord = {
  id: string;
  videoProjectId: string;
  type: AssetType;
  title: string;
  url: string;
  description: string | null;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AssetWrite = Pick<
  AssetRecord,
  "type" | "title" | "url" | "description"
>;

// Toda leitura e escrita passa pela produção visível no workspace aberto.
export type AssetRepository = {
  list(workspaceId: string, projectId: string): Promise<AssetRecord[]>;
  create(
    workspaceId: string,
    projectId: string,
    input: AssetWrite & { createdById: string },
  ): Promise<AssetRecord | null>;
  update(
    workspaceId: string,
    projectId: string,
    assetId: string,
    input: AssetWrite,
  ): Promise<AssetRecord | null>;
  remove(
    workspaceId: string,
    projectId: string,
    assetId: string,
  ): Promise<boolean>;
};
