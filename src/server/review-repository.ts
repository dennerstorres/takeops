export type ReviewCommentRecord = {
  id: string;
  editVersionId: string;
  authorId: string | null;
  timestampSeconds: number | null;
  text: string;
  resolved: boolean;
  resolvedById: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

// O comentário só é alcançado pela versão visível, na produção do
// workspace aberto.
export type ReviewScope = {
  workspaceId: string;
  projectId: string;
  versionId: string;
};

export type ReviewRepository = {
  list(scope: ReviewScope): Promise<ReviewCommentRecord[]>;
  create(
    scope: ReviewScope,
    input: { authorId: string; timestampSeconds: number | null; text: string },
  ): Promise<ReviewCommentRecord | null>;
};
