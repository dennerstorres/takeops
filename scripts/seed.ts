import { prisma } from "../src/server/db.ts";
import {
  seedDemoProject,
  seedDemoWorkspace,
  seedExampleProjects,
} from "../src/server/seed.ts";

// npm run db:seed — cria ou completa o workspace, a produção demo e as de exemplo.
try {
  const result = await seedDemoWorkspace();
  await seedDemoProject(result.workspaceId, result.userIds);
  await seedExampleProjects(result.workspaceId, result.userIds);
  console.log(
    `Workspace demo pronto (${result.workspaceId}), ${result.userIds.length} pessoas.`,
  );
} finally {
  await prisma.$disconnect();
}
