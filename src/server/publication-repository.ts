import type { VideoProjectStatus } from "./project-labels.ts";
import type { Platform, PublicationStatus } from "./publication-labels.ts";

export type PublicationRecord = {
  id: string;
  videoProjectId: string;
  platform: Platform;
  status: PublicationStatus;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  url: string | null;
  caption: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicationWrite = Partial<
  Omit<PublicationRecord, "id" | "videoProjectId" | "createdAt" | "updatedAt">
>;

// Toda leitura e escrita passa pela produção visível no workspace aberto.
export type PublicationRepository = {
  list(workspaceId: string, projectId: string): Promise<PublicationRecord[]>;
  find(
    workspaceId: string,
    projectId: string,
    publicationId: string,
  ): Promise<PublicationRecord | null>;
  create(
    workspaceId: string,
    projectId: string,
    input: PublicationWrite & { platform: Platform },
  ): Promise<PublicationRecord | null>;
  update(
    workspaceId: string,
    projectId: string,
    publicationId: string,
    input: PublicationWrite,
  ): Promise<PublicationRecord | null>;
  // Registra o resultado e, se publicado, move a produção para PUBLISHED na
  // mesma transação (ADR-044). `moved` diz de qual etapa saiu, se saiu.
  recordOutcome(
    workspaceId: string,
    projectId: string,
    publicationId: string,
    input: PublicationWrite,
  ): Promise<{
    publication: PublicationRecord;
    moved: { from: VideoProjectStatus } | null;
  } | null>;
  remove(
    workspaceId: string,
    projectId: string,
    publicationId: string,
  ): Promise<boolean>;
};
