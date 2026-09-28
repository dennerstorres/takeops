import type { SceneStatus, SceneType } from "./scene-labels.ts";

export type SceneRecord = {
  id: string;
  videoProjectId: string;
  order: number;
  title: string;
  description: string | null;
  type: SceneType;
  speakerId: string | null;
  dialogue: string | null;
  action: string | null;
  estimatedDurationSeconds: number | null;
  cameraInstructions: string | null;
  editingInstructions: string | null;
  continuityNotes: string | null;
  status: SceneStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type SceneWrite = Omit<
  SceneRecord,
  "id" | "videoProjectId" | "order" | "createdAt" | "updatedAt"
>;

export type SceneRepository = {
  list(workspaceId: string, projectId: string): Promise<SceneRecord[]>;
  find(
    workspaceId: string,
    projectId: string,
    sceneId: string,
  ): Promise<SceneRecord | null>;
  create(
    workspaceId: string,
    projectId: string,
    input: SceneWrite,
  ): Promise<SceneRecord | null>;
};
