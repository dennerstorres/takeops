export type EditVersionRecord = {
  id: string;
  videoProjectId: string;
  versionNumber: number;
  title: string | null;
  previewUrl: string | null;
  fileUrl: string | null;
  notes: string | null;
  createdById: string | null;
  createdAt: Date;
};

export type EditVersionWrite = Pick<
  EditVersionRecord,
  "title" | "previewUrl" | "fileUrl" | "notes"
>;

// A versão é alcançada pela produção visível no workspace aberto. O número
// é do repositório: o cliente nunca escolhe.
export type EditVersionRepository = {
  list(workspaceId: string, projectId: string): Promise<EditVersionRecord[]>;
  find(
    workspaceId: string,
    projectId: string,
    versionId: string,
  ): Promise<EditVersionRecord | null>;
  create(
    workspaceId: string,
    projectId: string,
    input: EditVersionWrite & { createdById: string },
  ): Promise<EditVersionRecord | null>;
};
