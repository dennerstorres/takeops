import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";
import { seedDemoProject, seedDemoWorkspace } from "./seed.ts";

const databaseReady = (process.env.DATABASE_URL ?? "").startsWith("postgres");

describe(
  "seed de demonstração",
  { skip: databaseReady ? false : "sem Postgres" },
  () => {
    it("cria workspace, quatro pessoas e checklist sem duplicar", async () => {
      const { prisma } = await import("./db.ts");
      const suffix = randomUUID().slice(0, 8);
      const options = {
        slug: `acme-${suffix}`,
        emailDomain: `seed-${suffix}.test`,
      };
      let workspaceId = "";
      let userIds: string[] = [];
      try {
        const first = await seedDemoWorkspace(options);
        const second = await seedDemoWorkspace(options);
        workspaceId = first.workspaceId;
        userIds = first.userIds;
        assert.equal(second.workspaceId, first.workspaceId);
        assert.deepEqual(second.userIds, first.userIds);

        const members = await prisma.workspaceMember.findMany({
          where: { workspaceId },
          include: { user: { select: { name: true } } },
        });
        assert.deepEqual(
          members.map((member) => `${member.user.name}:${member.role}`).sort(),
          ["Dev 1:MEMBER", "Dev 2:MEMBER", "Dev 3:MEMBER", "Supervisor:OWNER"],
        );
        const workspace = await prisma.workspace.findUnique({
          where: { id: workspaceId },
        });
        assert.equal(workspace?.name, "Acme Software");
        assert.equal(
          await prisma.checklistTemplate.count({ where: { workspaceId } }),
          1,
        );

        const projectId = await seedDemoProject(workspaceId, userIds);
        assert.equal(await seedDemoProject(workspaceId, userIds), projectId);
        const project = await prisma.videoProject.findUniqueOrThrow({
          where: { id: projectId },
          include: {
            scenes: { include: { shots: { include: { takes: true } } } },
            members: true,
            checklistItems: true,
            editVersions: { include: { comments: true } },
            publications: true,
          },
        });
        const shots = project.scenes.flatMap((scene) => scene.shots);
        assert.equal(project.scenes.length, 5);
        assert.ok(shots.some((shot) => shot.shotType === "SCREEN_CAPTURE"));
        assert.deepEqual(
          [
            ...new Set(shots.map((shot) => shot.cameraLabel).filter(Boolean)),
          ].sort(),
          ["Câmera A", "Câmera B"],
        );
        assert.equal(shots.flatMap((shot) => shot.takes).length, 3);
        assert.equal(project.members.length, 2);
        assert.equal(project.checklistItems.length, 3);
        assert.deepEqual(
          project.editVersions.map((version) => version.versionNumber),
          [1],
        );
        assert.equal(project.editVersions[0].comments.length, 3);
        assert.deepEqual(
          project.publications.map((row) => row.status),
          ["PENDING"],
        );
      } finally {
        if (workspaceId) {
          await prisma.workspace.deleteMany({ where: { id: workspaceId } });
        }
        await prisma.user.deleteMany({ where: { id: { in: userIds } } });
      }
    });
  },
);
