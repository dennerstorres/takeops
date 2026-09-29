import type { ActivityAction } from "./activity-labels.ts";

// Só valores simples: metadata é para montar a frase, não para guardar objeto.
export type ActivityMetadata = Record<string, string | number | boolean | null>;

export type ActivityRecord = {
  id: string;
  workspaceId: string;
  videoProjectId: string | null;
  userId: string | null;
  action: ActivityAction;
  entityType: string | null;
  entityId: string | null;
  metadata: ActivityMetadata | null;
  createdAt: Date;
};

export type ActivityWrite = Omit<ActivityRecord, "id" | "createdAt">;

export type ActivityRepository = {
  record(input: ActivityWrite): Promise<void>;
  // Mais nova primeiro; só a produção visível no workspace aberto.
  listForProject(
    workspaceId: string,
    projectId: string,
    limit: number,
  ): Promise<ActivityRecord[]>;
};
