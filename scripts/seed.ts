import { prisma } from "../src/server/db.ts";
import { seedDemoWorkspace } from "../src/server/seed.ts";

// npm run db:seed — cria ou completa o workspace de demonstração.
try {
  const result = await seedDemoWorkspace();
  console.log(
    `Workspace demo pronto (${result.workspaceId}), ${result.userIds.length} pessoas.`,
  );
} finally {
  await prisma.$disconnect();
}
