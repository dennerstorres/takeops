import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";
import { ForbiddenError, ValidationError } from "./errors.ts";
import {
  addParticipant,
  listParticipants,
  removeParticipant,
} from "./participant.ts";
import { createProject } from "./project.ts";
import { createWorkspace } from "./workspace.ts";

const databaseReady = (process.env.DATABASE_URL ?? "").startsWith("postgres");

describe(
  "participante no banco",
  { skip: databaseReady ? false : "sem Postgres" },
  () => {
    it("guarda duas funções e não aceita gente de outro workspace", async () => {
      const { prisma } = await import("./db.ts");
      const { prismaParticipantRepository } =
        await import("./participant-prisma.ts");
      const { prismaIdeaRepository } = await import("./idea-prisma.ts");
      const { prismaProjectRepository } = await import("./project-prisma.ts");
      const { prismaWorkspaceRepository } =
        await import("./workspace-prisma.ts");
      const suffix = randomUUID();
      const owner = await prisma.user.create({
        data: { email: `part-${suffix}@example.com`, name: "Dono" },
      });
      const member = await prisma.user.create({
        data: { email: `part-membro-${suffix}@example.com`, name: "Membro" },
      });
      const outsider = await prisma.user.create({
        data: { email: `part-fora-${suffix}@example.com`, name: "Fora" },
      });
      let workspaceId = "";
      let foreignId = "";

      try {
        const workspace = await createWorkspace(
          owner.id,
          { name: `Part ${suffix}`, slug: `part-${suffix}` },
          prismaWorkspaceRepository,
        );
        const foreign = await createWorkspace(
          outsider.id,
          { name: `Fora ${suffix}`, slug: `part-fora-${suffix}` },
          prismaWorkspaceRepository,
        );
        workspaceId = workspace.workspace.id;
        foreignId = foreign.workspace.id;
        await prisma.workspaceMember.create({
          data: { workspaceId, userId: member.id, role: "MEMBER" },
        });
        const project = await createProject(
          owner.id,
          workspaceId,
          { title: `Peça ${suffix}`, format: "DEMO" },
          prismaWorkspaceRepository,
          prismaIdeaRepository,
          prismaProjectRepository,
        );

        await addParticipant(
          owner.id,
          workspaceId,
          project.id,
          { userId: member.id, role: "CAMERA" },
          prismaWorkspaceRepository,
          prismaProjectRepository,
          prismaParticipantRepository,
        );
        await addParticipant(
          member.id,
          workspaceId,
          project.id,
          { userId: member.id, role: "EDITOR" },
          prismaWorkspaceRepository,
          prismaProjectRepository,
          prismaParticipantRepository,
        );
        await assert.rejects(
          () =>
            addParticipant(
              owner.id,
              workspaceId,
              project.id,
              { userId: outsider.id, role: "PRODUCER" },
              prismaWorkspaceRepository,
              prismaProjectRepository,
              prismaParticipantRepository,
            ),
          (error: unknown) =>
            error instanceof ValidationError &&
            error.fields.userId !== undefined,
        );
        await assert.rejects(
          () =>
            addParticipant(
              outsider.id,
              workspaceId,
              project.id,
              { userId: member.id, role: "REVIEWER" },
              prismaWorkspaceRepository,
              prismaProjectRepository,
              prismaParticipantRepository,
            ),
          (error: unknown) => error instanceof ForbiddenError,
        );

        const listed = await listParticipants(
          member.id,
          workspaceId,
          project.id,
          prismaWorkspaceRepository,
          prismaProjectRepository,
          prismaParticipantRepository,
        );
        assert.deepEqual(
          listed.map((row) => row.role),
          ["CAMERA", "EDITOR"],
        );

        await removeParticipant(
          owner.id,
          workspaceId,
          project.id,
          { userId: member.id, role: "CAMERA" },
          prismaWorkspaceRepository,
          prismaProjectRepository,
          prismaParticipantRepository,
        );
        const after = await listParticipants(
          owner.id,
          workspaceId,
          project.id,
          prismaWorkspaceRepository,
          prismaProjectRepository,
          prismaParticipantRepository,
        );
        assert.deepEqual(
          after.map((row) => row.role),
          ["EDITOR"],
        );
      } finally {
        if (workspaceId) {
          await prisma.workspace.deleteMany({ where: { id: workspaceId } });
        }
        if (foreignId) {
          await prisma.workspace.deleteMany({ where: { id: foreignId } });
        }
        await prisma.user.deleteMany({
          where: { id: { in: [owner.id, member.id, outsider.id] } },
        });
      }
    });
  },
);
