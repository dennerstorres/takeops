export type ContinuityNoteRecord = {
  id: string;
  videoProjectId: string;
  category: string | null;
  title: string;
  description: string;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ContinuityNoteWrite = Pick<
  ContinuityNoteRecord,
  "category" | "title" | "description"
>;

// Toda leitura e escrita passa pela produção visível no workspace aberto.
export type ContinuityRepository = {
  list(workspaceId: string, projectId: string): Promise<ContinuityNoteRecord[]>;
  find(
    workspaceId: string,
    projectId: string,
    noteId: string,
  ): Promise<ContinuityNoteRecord | null>;
  create(
    workspaceId: string,
    projectId: string,
    input: ContinuityNoteWrite & { createdById: string },
  ): Promise<ContinuityNoteRecord | null>;
  update(
    workspaceId: string,
    projectId: string,
    noteId: string,
    input: ContinuityNoteWrite,
  ): Promise<ContinuityNoteRecord | null>;
  remove(
    workspaceId: string,
    projectId: string,
    noteId: string,
  ): Promise<boolean>;
};
