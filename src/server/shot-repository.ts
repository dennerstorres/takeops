import type { ShotStatus, ShotType } from "./shot-labels.ts";

export type ShotRecord = {
  id: string;
  sceneId: string;
  order: number;
  name: string | null;
  cameraLabel: string | null;
  shotType: ShotType;
  framing: string | null;
  angle: string | null;
  subject: string | null;
  movement: string | null;
  description: string | null;
  requiredTakes: number;
  notes: string | null;
  status: ShotStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type ShotWrite = Omit<
  ShotRecord,
  "id" | "sceneId" | "order" | "createdAt" | "updatedAt"
>;

// O shot não guarda workspaceId. Toda consulta chega a ele pela cena
// visível e pela produção do workspace aberto.
export type ShotScope = {
  workspaceId: string;
  projectId: string;
  sceneId: string;
};

export type ShotRepository = {
  list(scope: ShotScope): Promise<ShotRecord[]>;
  find(scope: ShotScope, shotId: string): Promise<ShotRecord | null>;
  create(scope: ShotScope, input: ShotWrite): Promise<ShotRecord | null>;
  update(
    scope: ShotScope,
    shotId: string,
    input: ShotWrite,
  ): Promise<ShotRecord | null>;
  softDelete(
    scope: ShotScope,
    shotId: string,
    deletedAt: Date,
  ): Promise<boolean>;
  reorder(
    scope: ShotScope,
    orderedIds: readonly string[],
  ): Promise<ShotRecord[] | null>;
};
