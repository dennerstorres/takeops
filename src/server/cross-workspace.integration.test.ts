import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";
import {
  approveVersion,
  listApprovals,
  requestApproval,
  type ApprovalDeps,
} from "./approval.ts";
import { createEditVersion, getEditVersion } from "./edit-version.ts";
import { ForbiddenError, NotFoundError } from "./errors.ts";
import {
  createProject,
  deleteProject,
  getProject,
  updateProject,
} from "./project.ts";
import {
  createPublication,
  deletePublication,
  getPublication,
  updatePublication,
} from "./publication.ts";
import { createScene, deleteScene, getScene, updateScene } from "./scene.ts";
import { createShoot, deleteShoot, getShoot, updateShoot } from "./shoot.ts";
import { createShot, deleteShot, getShot, updateShot } from "./shot.ts";
import { getTake, registerTake, updateTake } from "./take.ts";
import { changeMemberRole } from "./team.ts";
import { createWorkspace } from "./workspace.ts";

const databaseReady = (process.env.DATABASE_URL ?? "").startsWith("postgres");

// Dono do workspace A tenta ler, alterar e excluir o que é do workspace B,
// usando o próprio workspace (IDOR) e o workspace alheio (sem membership).
async function setup() {
  const { prisma } = await import("./db.ts");
  const { prismaApprovalRepository } = await import("./approval-prisma.ts");
  const { prismaEditVersionRepository } =
    await import("./edit-version-prisma.ts");
  const { prismaIdeaRepository } = await import("./idea-prisma.ts");
  const { prismaParticipantRepository } =
    await import("./participant-prisma.ts");
  const { prismaProjectRepository } = await import("./project-prisma.ts");
  const { prismaPublicationRepository } =
    await import("./publication-prisma.ts");
  const { prismaSceneRepository } = await import("./scene-prisma.ts");
  const { prismaShootRepository } = await import("./shoot-prisma.ts");
  const { prismaShotRepository } = await import("./shot-prisma.ts");
  const { prismaTakeRepository } = await import("./take-prisma.ts");
  const { prismaWorkspaceRepository } = await import("./workspace-prisma.ts");
  const deps = {
    workspaces: prismaWorkspaceRepository,
    projects: prismaProjectRepository,
    ideas: prismaIdeaRepository,
    scenes: prismaSceneRepository,
    shots: prismaShotRepository,
    takes: prismaTakeRepository,
    shoots: prismaShootRepository,
    versions: prismaEditVersionRepository,
    approvals: prismaApprovalRepository,
    participants: prismaParticipantRepository,
    publications: prismaPublicationRepository,
  };
  const approvalDeps: ApprovalDeps = deps;

  const suffix = randomUUID();
  const [attacker, victim, victimMember] = await Promise.all(
    ["a", "b", "b-membro"].map((name) =>
      prisma.user.create({
        data: { email: `cross-${name}-${suffix}@example.com`, name },
      }),
    ),
  );
  const home = await createWorkspace(
    attacker.id,
    { name: `Cross A ${suffix}`, slug: `cross-a-${suffix}` },
    prismaWorkspaceRepository,
  );
  const foreign = await createWorkspace(
    victim.id,
    { name: `Cross B ${suffix}`, slug: `cross-b-${suffix}` },
    prismaWorkspaceRepository,
  );
  const homeId = home.workspace.id;
  const foreignId = foreign.workspace.id;
  await prisma.workspaceMember.create({
    data: { workspaceId: foreignId, userId: victimMember.id, role: "MEMBER" },
  });

  const project = await createProject(
    victim.id,
    foreignId,
    { title: `Alheia ${suffix}`, format: "DEMO" },
    prismaWorkspaceRepository,
    prismaIdeaRepository,
    prismaProjectRepository,
  );
  const scene = await createScene(
    victim.id,
    foreignId,
    project.id,
    { title: "Abertura", type: "HOOK" },
    prismaWorkspaceRepository,
    prismaProjectRepository,
    prismaSceneRepository,
  );
  const shot = await createShot(
    victim.id,
    foreignId,
    project.id,
    scene.id,
    { name: "Plano A" },
    deps,
  );
  const target = { projectId: project.id, sceneId: scene.id, shotId: shot.id };
  const take = await registerTake(victim.id, foreignId, target, {}, deps);
  const shoot = await createShoot(
    victim.id,
    foreignId,
    project.id,
    { title: "Externa", scheduledAt: "2026-10-07T09:00:00-03:00" },
    deps,
  );
  const version = await createEditVersion(
    victim.id,
    foreignId,
    project.id,
    { previewUrl: "https://vimeo.com/x" },
    deps,
  );
  const approval = await requestApproval(
    victim.id,
    foreignId,
    project.id,
    version.id,
    approvalDeps,
  );
  const publication = await createPublication(
    victim.id,
    foreignId,
    project.id,
    { platform: "TIKTOK" },
    deps,
  );

  return {
    prisma,
    deps,
    approvalDeps,
    attacker,
    victim,
    victimMember,
    homeId,
    foreignId,
    project,
    scene,
    shot,
    target,
    take,
    shoot,
    version,
    approval,
    publication,
    async cleanup() {
      await prisma.workspace.deleteMany({
        where: { id: { in: [homeId, foreignId] } },
      });
      await prisma.user.deleteMany({
        where: { id: { in: [attacker.id, victim.id, victimMember.id] } },
      });
    },
  };
}

const denied = (error: unknown) =>
  error instanceof NotFoundError || error instanceof ForbiddenError;

describe(
  "isolamento entre workspaces no banco",
  { skip: databaseReady ? false : "sem Postgres" },
  () => {
    it("dono de A não lê, altera nem exclui nada de B", async () => {
      const ctx = await setup();
      try {
        const { deps, attacker, project, scene, shot, target } = ctx;
        const a = attacker.id;
        const w = deps.workspaces;
        const p = deps.projects;
        const s = deps.scenes;

        for (const ws of [ctx.homeId, ctx.foreignId]) {
          const attempts: Array<[string, () => Promise<unknown>]> = [
            ["ler produção", () => getProject(a, ws, project.id, w, p)],
            [
              "alterar produção",
              () =>
                updateProject(
                  a,
                  ws,
                  project.id,
                  { title: "Invadida", format: "DEMO" },
                  w,
                  deps.ideas,
                  p,
                ),
            ],
            ["excluir produção", () => deleteProject(a, ws, project.id, w, p)],
            ["ler cena", () => getScene(a, ws, project.id, scene.id, w, p, s)],
            [
              "alterar cena",
              () =>
                updateScene(
                  a,
                  ws,
                  project.id,
                  scene.id,
                  { title: "Invadida", type: "HOOK" },
                  w,
                  p,
                  s,
                ),
            ],
            [
              "excluir cena",
              () => deleteScene(a, ws, project.id, scene.id, w, p, s),
            ],
            [
              "ler shot",
              () => getShot(a, ws, project.id, scene.id, shot.id, deps),
            ],
            [
              "alterar shot",
              () =>
                updateShot(
                  a,
                  ws,
                  project.id,
                  scene.id,
                  shot.id,
                  { name: "Invadido" },
                  deps,
                ),
            ],
            [
              "excluir shot",
              () => deleteShot(a, ws, project.id, scene.id, shot.id, deps),
            ],
            ["ler take", () => getTake(a, ws, target, ctx.take.id, deps)],
            [
              "alterar take",
              () =>
                updateTake(a, ws, target, ctx.take.id, { notes: "x" }, deps),
            ],
            ["novo take", () => registerTake(a, ws, target, {}, deps)],
            [
              "ler gravação",
              () => getShoot(a, ws, project.id, ctx.shoot.id, deps),
            ],
            [
              "alterar gravação",
              () =>
                updateShoot(
                  a,
                  ws,
                  project.id,
                  ctx.shoot.id,
                  {
                    title: "Invadida",
                    scheduledAt: "2026-10-07T09:00:00-03:00",
                  },
                  deps,
                ),
            ],
            [
              "excluir gravação",
              () => deleteShoot(a, ws, project.id, ctx.shoot.id, deps),
            ],
            [
              "ler versão",
              () => getEditVersion(a, ws, project.id, ctx.version.id, deps),
            ],
            [
              "listar aprovações",
              () => listApprovals(a, ws, project.id, ctx.approvalDeps),
            ],
            [
              "aprovar",
              () =>
                approveVersion(
                  a,
                  ws,
                  project.id,
                  ctx.approval.id,
                  {},
                  ctx.approvalDeps,
                ),
            ],
            [
              "ler publicação",
              () => getPublication(a, ws, project.id, ctx.publication.id, deps),
            ],
            [
              "alterar publicação",
              () =>
                updatePublication(
                  a,
                  ws,
                  project.id,
                  ctx.publication.id,
                  { platform: "YOUTUBE" },
                  deps,
                ),
            ],
            [
              "excluir publicação",
              () =>
                deletePublication(a, ws, project.id, ctx.publication.id, deps),
            ],
            [
              "mudar papel de membro",
              () =>
                changeMemberRole(
                  a,
                  ws,
                  { userId: ctx.victimMember.id, role: "VIEWER" },
                  w,
                ),
            ],
          ];
          for (const [label, attempt] of attempts) {
            await assert.rejects(attempt, denied, `${label} (${ws})`);
          }
        }

        const v = ctx.victim.id;
        const f = ctx.foreignId;
        const kept = await getProject(v, f, project.id, w, p);
        assert.equal(kept.title, project.title);
        const keptScene = await getScene(v, f, project.id, scene.id, w, p, s);
        assert.equal(keptScene.title, "Abertura");
        const keptShot = await getShot(
          v,
          f,
          project.id,
          scene.id,
          shot.id,
          deps,
        );
        assert.equal(keptShot.name, "Plano A");
        const takes = await ctx.prisma.take.count({
          where: { shotId: shot.id },
        });
        assert.equal(takes, 1);
        await getShoot(v, f, project.id, ctx.shoot.id, deps);
        const keptPublication = await getPublication(
          v,
          f,
          project.id,
          ctx.publication.id,
          deps,
        );
        assert.equal(keptPublication.platform, "TIKTOK");
        const approvals = await listApprovals(
          v,
          f,
          project.id,
          ctx.approvalDeps,
        );
        assert.equal(approvals[0]?.status, "PENDING");
        const member = await ctx.prisma.workspaceMember.findFirst({
          where: { workspaceId: f, userId: ctx.victimMember.id },
        });
        assert.equal(member?.role, "MEMBER");
      } finally {
        await ctx.cleanup();
      }
    });
  },
);
