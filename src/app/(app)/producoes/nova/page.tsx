import { redirect } from "next/navigation";
import { ProjectForm } from "@/components/projects/project-form";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { listIdeas } from "@/server/idea";
import { prismaIdeaRepository } from "@/server/idea-prisma";
import { listTeam } from "@/server/team";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

export default async function NewProductionPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const access = await openWorkspace(session.user.id);
  if (access.kind === "setup") redirect("/comecar");
  if (access.workspace.membership.role === "VIEWER") redirect("/producoes");

  const workspaceId = access.workspace.workspace.id;
  const [people, ideas] = await Promise.all([
    listTeam(session.user.id, workspaceId, prismaWorkspaceRepository),
    listIdeas(
      session.user.id,
      workspaceId,
      prismaWorkspaceRepository,
      prismaIdeaRepository,
    ),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-medium tracking-tight">Nova produção</h1>
        <p className="text-sm text-muted-foreground">
          Ela começa na etapa Ideia. A etapa muda no quadro.
        </p>
      </header>
      <ProjectForm
        canEdit
        people={people.map((person) => ({
          id: person.userId,
          label: person.name ?? person.email ?? "Sem nome",
        }))}
        ideas={ideas.map((idea) => ({ id: idea.id, label: idea.title }))}
        values={{
          title: "",
          slug: "",
          description: "",
          objective: "",
          audience: "",
          product: "",
          format: "TUTORIAL",
          aspectRatio: "NINE_SIXTEEN",
          estimatedDurationSeconds: "",
          priority: "NORMAL",
          thumbnailUrl: "",
          ownerId: "",
          plannedShootDate: "",
          plannedPublishDate: "",
          sourceIdeaId: "",
        }}
      />
    </div>
  );
}
