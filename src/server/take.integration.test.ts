import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";
import { ForbiddenError, NotFoundError, ValidationError } from "./errors.ts";
import { createProject } from "./project.ts";
import { createScene } from "./scene.ts";
import { createShot } from "./shot.ts";
import {
  getTake,
  listTakes,
  registerTake,
  setFavoriteTake,
  updateTake,
  type TakeDeps,
} from "./take.ts";
import { createWorkspace } from "./workspace.ts";

const databaseReady = (process.env.DATABASE_URL ?? "").startsWith("postgres");

// Monta dois workspaces, uma produção com duas cenas e um shot em cada.
async function setup() {
  const { prisma } = await import("./db.ts");
  const { prismaIdeaRepository } = await import("./idea-prisma.ts");
  const { prismaProjectRepository } = await import("./project-prisma.ts");
  const { prismaSceneRepository } = await import("./scene-prisma.ts");
  const { prismaShotRepository } = await import("./shot-prisma.ts");
  const { prismaTakeRepository } = await import("./take-prisma.ts");
  const { prismaWorkspaceRepository: ws } =
    await import("./workspace-prisma.ts");
  const deps: TakeDeps = {
    workspaces: ws,
    projects: prismaProjectRepository,
    scenes: prismaSceneRepository,
    shots: prismaShotRepository,
    takes: prismaTakeRepository,
  };
  const suffix = randomUUID();
  const users = await Promise.all(
    ["dono", "membro", "leitor", "fora"].map((name) =>
      prisma.user.create({
        data: { email: `take-${name}-${suffix}@example.com`, name },
      }),
    ),
  );
  const [owner, member, viewer, outsider] = users;
  const workspaceId = (
    await createWorkspace(
      owner.id,
      { name: `Take ${suffix}`, slug: `take-${suffix}` },
      ws,
    )
  ).workspace.id;
  const foreignId = (
    await createWorkspace(
      outsider.id,
      { name: `Outro take ${suffix}`, slug: `outro-take-${suffix}` },
      ws,
    )
  ).workspace.id;
  await prisma.workspaceMember.createMany({
    data: [
      { workspaceId, userId: member.id, role: "MEMBER" },
      { workspaceId, userId: viewer.id, role: "VIEWER" },
    ],
  });
  const project = await createProject(
    owner.id,
    workspaceId,
    { title: `Peça ${suffix}`, format: "DEMO" },
    ws,
    prismaIdeaRepository,
    prismaProjectRepository,
  );
  const newScene = () =>
    createScene(
      owner.id,
      workspaceId,
      project.id,
      { title: "Cena", type: "OTHER" },
      ws,
      prismaProjectRepository,
      prismaSceneRepository,
    );
  const sceneA = await newScene();
  const sceneB = await newScene();
  const shotA = await createShot(
    owner.id,
    workspaceId,
    project.id,
    sceneA.id,
    {},
    deps,
  );
  const shotB = await createShot(
    owner.id,
    workspaceId,
    project.id,
    sceneB.id,
    {},
    deps,
  );
  const targetA = {
    projectId: project.id,
    sceneId: sceneA.id,
    shotId: shotA.id,
  };
  const targetB = {
    projectId: project.id,
    sceneId: sceneB.id,
    shotId: shotB.id,
  };

  async function cleanup() {
    await prisma.workspace.deleteMany({
      where: { id: { in: [workspaceId, foreignId] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: users.map((user) => user.id) } },
    });
  }

  return {
    prisma,
    deps,
    owner,
    member,
    viewer,
    outsider,
    workspaceId,
    foreignId,
    targetA,
    targetB,
    cleanup,
  };
}

describe(
  "take no banco",
  { skip: databaseReady ? false : "sem Postgres" },
  () => {
    it("lista os takes do shot pelo workspace", async () => {
      const ctx = await setup();
      try {
        const { prisma, deps, targetA, targetB, workspaceId } = ctx;
        await prisma.take.createMany({
          data: [
            { shotId: targetA.shotId, number: 2, status: "OK" },
            { shotId: targetA.shotId, number: 1, status: "RETAKE" },
            { shotId: targetB.shotId, number: 1, status: "OK" },
          ],
        });
        const listed = await listTakes(
          ctx.viewer.id,
          workspaceId,
          targetA,
          deps,
        );
        assert.deepEqual(
          listed.map((take) => [take.number, take.status]),
          [
            [1, "RETAKE"],
            [2, "OK"],
          ],
        );
        const read = await getTake(
          ctx.viewer.id,
          workspaceId,
          targetA,
          listed[0].id,
          deps,
        );
        assert.equal(read.id, listed[0].id);

        // Take de outro shot não abre pelo alvo errado.
        await assert.rejects(
          getTake(ctx.owner.id, workspaceId, targetB, listed[0].id, deps),
          NotFoundError,
        );
        await assert.rejects(
          listTakes(ctx.outsider.id, workspaceId, targetA, deps),
          ForbiddenError,
        );
        await assert.rejects(
          listTakes(ctx.outsider.id, ctx.foreignId, targetA, deps),
          NotFoundError,
        );
      } finally {
        await ctx.cleanup();
      }
      it("numera por shot no servidor, mesmo em registros simultâneos", async () => {
        const ctx = await setup();
        try {
          const { deps, targetA, targetB, workspaceId } = ctx;
          const now = new Date("2026-10-06T14:00:00.000Z");
          const first = await registerTake(
            ctx.member.id,
            workspaceId,
            targetA,
            {
              status: "RETAKE",
              notes: " Tremeu ",
              number: 9,
              recordedById: ctx.owner.id,
              favorite: true,
            },
            deps,
            now,
          );
          assert.equal(first.number, 1);
          assert.equal(first.status, "RETAKE");
          assert.equal(first.notes, "Tremeu");
          assert.equal(first.favorite, false);
          assert.equal(first.recordedById, ctx.member.id);
          assert.equal(first.recordedAt.toISOString(), now.toISOString());

          const together = await Promise.all(
            [0, 1, 2].map(() =>
              registerTake(ctx.owner.id, workspaceId, targetA, {}, deps),
            ),
          );
          assert.deepEqual(
            together.map((take) => take.number).sort(),
            [2, 3, 4],
          );
          assert.ok(together.every((take) => take.status === "OK"));
          const other = await registerTake(
            ctx.owner.id,
            workspaceId,
            targetB,
            {},
            deps,
          );
          assert.equal(other.number, 1);

          const edited = await updateTake(
            ctx.member.id,
            workspaceId,
            targetA,
            first.id,
            { status: "DISCARDED", notes: "Foco", number: 7 },
            deps,
          );
          assert.equal(edited.status, "DISCARDED");
          assert.equal(edited.number, 1);

          await assert.rejects(
            registerTake(
              ctx.owner.id,
              workspaceId,
              targetA,
              { status: "BOM" },
              deps,
            ),
            ValidationError,
          );
          await assert.rejects(
            registerTake(ctx.viewer.id, workspaceId, targetA, {}, deps),
            ForbiddenError,
          );
          await assert.rejects(
            updateTake(ctx.owner.id, workspaceId, targetB, first.id, {}, deps),
            NotFoundError,
          );
        } finally {
          await ctx.cleanup();
        }
      });
      it("marca um preferido por shot, só entre os OK", async () => {
        const ctx = await setup();
        try {
          const { deps, targetA, targetB, workspaceId } = ctx;
          const register = (status: string) =>
            registerTake(ctx.member.id, workspaceId, targetA, { status }, deps);
          const one = await register("OK");
          const two = await register("OK");
          const retake = await register("RETAKE");

          let rows = await setFavoriteTake(
            ctx.member.id,
            workspaceId,
            targetA,
            one.id,
            deps,
          );
          assert.deepEqual(
            rows.filter((take) => take.favorite).map((take) => take.id),
            [one.id],
          );
          rows = await setFavoriteTake(
            ctx.member.id,
            workspaceId,
            targetA,
            two.id,
            deps,
          );
          assert.deepEqual(
            rows.filter((take) => take.favorite).map((take) => take.id),
            [two.id],
          );
          // Mais de um OK convive; o preferido é um só.
          assert.equal(rows.filter((take) => take.status === "OK").length, 2);

          await assert.rejects(
            setFavoriteTake(
              ctx.member.id,
              workspaceId,
              targetA,
              retake.id,
              deps,
            ),
            ValidationError,
          );
          await assert.rejects(
            setFavoriteTake(ctx.viewer.id, workspaceId, targetA, one.id, deps),
            ForbiddenError,
          );
          await assert.rejects(
            setFavoriteTake(ctx.owner.id, workspaceId, targetB, one.id, deps),
            NotFoundError,
          );

          // Descartar o preferido tira a marca.
          const dropped = await updateTake(
            ctx.member.id,
            workspaceId,
            targetA,
            two.id,
            { status: "DISCARDED" },
            deps,
          );
          assert.equal(dropped.favorite, false);

          rows = await setFavoriteTake(
            ctx.member.id,
            workspaceId,
            targetA,
            null,
            deps,
          );
          assert.equal(rows.filter((take) => take.favorite).length, 0);
        } finally {
          await ctx.cleanup();
        }
      });
    });
  },
);
