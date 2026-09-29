import { createRecommendedChecklist } from "./checklist.ts";
import { prismaChecklistRepository } from "./checklist-prisma.ts";
import { prisma } from "./db.ts";
import { createWorkspace } from "./workspace.ts";
import { prismaWorkspaceRepository } from "./workspace-prisma.ts";

// Workspace e pessoas de demonstração (spec §59). Só para desenvolvimento:
// os e-mails são fictícios e o login continua sendo Google (AUTH).
// Rodar de novo não duplica nada.
export async function seedDemoWorkspace(
  options: { slug?: string; emailDomain?: string } = {},
) {
  const slug = options.slug ?? "acme-software";
  const domain = options.emailDomain ?? "acme.test";
  const people = [
    { key: "supervisor", name: "Supervisor", role: "OWNER" as const },
    { key: "dev1", name: "Dev 1", role: "MEMBER" as const },
    { key: "dev2", name: "Dev 2", role: "MEMBER" as const },
    { key: "dev3", name: "Dev 3", role: "MEMBER" as const },
  ];

  const users = [];
  for (const person of people) {
    users.push(
      await prisma.user.upsert({
        where: { email: `${person.key}@${domain}` },
        update: {},
        create: { email: `${person.key}@${domain}`, name: person.name },
      }),
    );
  }
  const supervisor = users[0];

  let workspace = await prisma.workspace.findUnique({ where: { slug } });
  if (!workspace) {
    workspace = (
      await createWorkspace(
        supervisor.id,
        { name: "Acme Software", slug, timezone: "America/Sao_Paulo" },
        prismaWorkspaceRepository,
      )
    ).workspace;
  }
  const workspaceId = workspace.id;

  for (const [index, person] of people.entries()) {
    await prisma.workspaceMember.upsert({
      where: {
        workspaceId_userId: { workspaceId, userId: users[index].id },
      },
      update: {},
      create: { workspaceId, userId: users[index].id, role: person.role },
    });
  }

  await createRecommendedChecklist(
    supervisor.id,
    workspaceId,
    prismaWorkspaceRepository,
    prismaChecklistRepository,
  );

  return { workspaceId, userIds: users.map((user) => user.id) };
}
