import type { ShootStatus } from "./shoot-labels.ts";

export type ShootRecord = {
  id: string;
  videoProjectId: string;
  title: string | null;
  scheduledAt: Date;
  endAt: Date | null;
  location: string | null;
  status: ShootStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ShootWrite = Omit<
  ShootRecord,
  "id" | "videoProjectId" | "createdAt" | "updatedAt"
>;

export type ShootRepository = {
  list(workspaceId: string, projectId: string): Promise<ShootRecord[]>;
  find(
    workspaceId: string,
    projectId: string,
    shootId: string,
  ): Promise<ShootRecord | null>;
  create(
    workspaceId: string,
    projectId: string,
    input: ShootWrite,
  ): Promise<ShootRecord | null>;
};
