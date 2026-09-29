import { prisma } from "../src/server/db.ts";
import { seedDemoProject, seedDemoWorkspace } from "../src/server/seed.ts";

// npm run db:seed — cria ou completa o workspace e a produção demo.
try {
  const result = await seedDemoWorkspace();
  await seedDemoProject(result.workspaceId, result.userIds);
  console.log(
    `Workspace demo pronto (${result.workspaceId}), ${result.userIds.length} pessoas.`,
  );
} finally {
  await prisma.$disconnect();
}
