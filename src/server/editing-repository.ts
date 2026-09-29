import type { AspectRatio } from "./project-labels.ts";

export type EditingInfoRecord = {
  id: string;
  videoProjectId: string;
  editorId: string | null;
  software: string | null;
  projectFileUrl: string | null;
  notes: string | null;
  targetResolution: string | null;
  targetFps: number | null;
  aspectRatio: AspectRatio | null;
  captionsRequired: boolean;
  musicRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type EditingInfoWrite = Omit<
  EditingInfoRecord,
  "id" | "videoProjectId" | "createdAt" | "updatedAt"
>;

// Um registro por produção, alcançado pela produção visível no workspace.
export type EditingRepository = {
  find(
    workspaceId: string,
    projectId: string,
  ): Promise<EditingInfoRecord | null>;
  save(
    workspaceId: string,
    projectId: string,
    input: EditingInfoWrite,
  ): Promise<EditingInfoRecord | null>;
};
