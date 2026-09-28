import type { IdeaFormat, IdeaStatus } from "./idea-labels.ts";

export type IdeaRecord = {
  id: string;
  workspaceId: string;
  title: string;
  description: string | null;
  format: IdeaFormat | null;
  objective: string | null;
  product: string | null;
  audience: string | null;
  referenceUrl: string | null;
  notes: string | null;
  authorId: string;
  authorName: string | null;
  status: IdeaStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type IdeaWrite = {
  title: string;
  description: string | null;
  format: IdeaFormat | null;
  objective: string | null;
  product: string | null;
  audience: string | null;
  referenceUrl: string | null;
  notes: string | null;
};

export type IdeaRepository = {
  list(workspaceId: string): Promise<IdeaRecord[]>;
  find(workspaceId: string, ideaId: string): Promise<IdeaRecord | null>;
  create(
    workspaceId: string,
    authorId: string,
    input: IdeaWrite,
  ): Promise<IdeaRecord>;
  update(
    workspaceId: string,
    ideaId: string,
    input: IdeaWrite,
  ): Promise<IdeaRecord | null>;
  softDelete(
    workspaceId: string,
    ideaId: string,
    deletedAt: Date,
  ): Promise<boolean>;
};
