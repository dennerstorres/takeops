import type { IdeaFormat } from "./idea-labels.ts";
import type {
  AspectRatio,
  ProjectPriority,
  VideoProjectStatus,
} from "./project-labels.ts";

export type ProjectRecord = {
  id: string;
  workspaceId: string;
  title: string;
  slug: string | null;
  description: string | null;
  objective: string | null;
  audience: string | null;
  product: string | null;
  format: IdeaFormat;
  aspectRatio: AspectRatio;
  estimatedDurationSeconds: number | null;
  status: VideoProjectStatus;
  priority: ProjectPriority;
  thumbnailUrl: string | null;
  ownerId: string | null;
  plannedShootDate: Date | null;
  plannedPublishDate: Date | null;
  sourceIdeaId: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ProjectWrite = Omit<
  ProjectRecord,
  "id" | "workspaceId" | "createdById" | "createdAt" | "updatedAt"
>;

export type ProjectRepository = {
  list(workspaceId: string): Promise<ProjectRecord[]>;
  find(workspaceId: string, projectId: string): Promise<ProjectRecord | null>;
  findBySlug(workspaceId: string, slug: string): Promise<ProjectRecord | null>;
  create(
    workspaceId: string,
    createdById: string,
    input: ProjectWrite,
  ): Promise<ProjectRecord>;
  update(
    workspaceId: string,
    projectId: string,
    input: ProjectWrite,
  ): Promise<ProjectRecord | null>;
  softDelete(
    workspaceId: string,
    projectId: string,
    deletedAt: Date,
  ): Promise<boolean>;
  findBySourceIdea(
    workspaceId: string,
    ideaId: string,
  ): Promise<ProjectRecord | null>;
  convert(
    workspaceId: string,
    userId: string,
    ideaId: string,
  ): Promise<ProjectRecord>;
};
