import type { IdeaFormat } from "./idea-labels.ts";
import type { ProjectWrite } from "./project-repository.ts";

export function projectDraftFromIdea(idea: {
  id: string;
  title: string;
  description: string | null;
  format: IdeaFormat | null;
  objective: string | null;
  audience: string | null;
  product: string | null;
}): ProjectWrite {
  return {
    title: idea.title,
    slug: null,
    description: idea.description,
    objective: idea.objective,
    audience: idea.audience,
    product: idea.product,
    format: idea.format ?? "OTHER",
    aspectRatio: "NINE_SIXTEEN",
    estimatedDurationSeconds: null,
    status: "IDEA",
    priority: "NORMAL",
    thumbnailUrl: null,
    ownerId: null,
    plannedShootDate: null,
    plannedPublishDate: null,
    sourceIdeaId: idea.id,
  };
}
