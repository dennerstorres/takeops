import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";
import { ForbiddenError, NotFoundError, ValidationError } from "./errors.ts";
import { createProject } from "./project.ts";
import {
  createPublication,
  deletePublication,
  getPublication,
  listPublications,
  updatePublication,
  type PublicationDeps,
} from "./publication.ts";
import { createWorkspace } from "./workspace.ts";

const databaseReady = (process.env.DATABASE_URL ?? "").startsWith("postgres");

async function setup() {
  const { prisma } = await import("./db.ts");
  const { prismaIdeaRepository } = await import("./idea-prisma.ts");
  const { prismaProjectRepository } = await import("./project-prisma.ts");
  const { prismaPublicationRepository } =
    await import("./publication-prisma.ts");
  const { prismaWorkspaceRepository } = await import("./workspace-prisma.ts");
  const deps: PublicationDeps = {
    workspaces: prismaWorkspaceRepository,
    projects: prismaProjectRepository,
    publications: prismaPublicationRepository,
  };
  const suffix = randomUUID();
  const [owner, member, viewer, outsider] = await Promise.all(
    ["dono", "membro", "leitor", "fora"].map((name) =>
      prisma.user.create({
        data: { email: `pub-${name}-${suffix}@example.com`, name },
      }),
    ),
  );
  const workspace = await createWorkspace(
    owner.id,
    { name: `Publicação ${suffix}`, slug: `publicacao-${suffix}` },
    prismaWorkspaceRepository,
  );
  const foreign = await createWorkspace(
    outsider.id,
    { name: `Outra publicação ${suffix}`, slug: `outra-pub-${suffix}` },
    prismaWorkspaceRepository,
  );
  const workspaceId = workspace.workspace.id;
  const foreignId = foreign.workspace.id;
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
    prismaWorkspaceRepository,
    prismaIdeaRepository,
    prismaProjectRepository,
  );
  const sibling = await createProject(
    owner.id,
    workspaceId,
    { title: `Irmã ${suffix}`, format: "DEMO" },
    prismaWorkspaceRepository,
    prismaIdeaRepository,
    prismaProjectRepository,
  );
  const other = await createProject(
    outsider.id,
    foreignId,
    { title: `Alheia ${suffix}`, format: "DEMO" },
    prismaWorkspaceRepository,
    prismaIdeaRepository,
    prismaProjectRepository,
  );
  return {
    prisma,
    deps,
    workspaceId,
    foreignId,
    project,
    sibling,
    other,
    owner,
    member,
    viewer,
    outsider,
    async cleanup() {
      await prisma.workspace.deleteMany({
        where: { id: { in: [workspaceId, foreignId] } },
      });
      await prisma.user.deleteMany({
        where: {
          id: { in: [owner, member, viewer, outsider].map((user) => user.id) },
        },
      });
    },
  };
}

describe(
  "publicação no banco",
  { skip: databaseReady ? false : "sem Postgres" },
  () => {
    it("lê os destinos da produção do workspace", async () => {
      const ctx = await setup();
      try {
        const { prisma, deps, workspaceId, project } = ctx;
        const reels = await prisma.publication.create({
          data: { videoProjectId: project.id, platform: "INSTAGRAM_REELS" },
        });
        const foreign = await prisma.publication.create({
          data: { videoProjectId: ctx.other.id, platform: "TIKTOK" },
        });
        assert.equal(reels.status, "PENDING");

        const listed = await listPublications(
          ctx.viewer.id,
          workspaceId,
          project.id,
          deps,
        );
        assert.deepEqual(
          listed.map((row) => row.id),
          [reels.id],
        );
        assert.equal(
          (
            await getPublication(
              ctx.viewer.id,
              workspaceId,
              project.id,
              reels.id,
              deps,
            )
          ).platform,
          "INSTAGRAM_REELS",
        );
        await assert.rejects(
          getPublication(
            ctx.owner.id,
            workspaceId,
            ctx.sibling.id,
            reels.id,
            deps,
          ),
          NotFoundError,
        );
        await assert.rejects(
          getPublication(
            ctx.owner.id,
            workspaceId,
            project.id,
            foreign.id,
            deps,
          ),
          NotFoundError,
        );
        await assert.rejects(
          listPublications(ctx.outsider.id, workspaceId, project.id, deps),
          ForbiddenError,
        );
      } finally {
        await ctx.cleanup();
      }
    });

    it("cria, edita e remove destinos; leitor só vê", async () => {
      const ctx = await setup();
      try {
        const { deps, workspaceId, project } = ctx;
        const tiktok = await createPublication(
          ctx.member.id,
          workspaceId,
          project.id,
          {
            platform: "TIKTOK",
            caption: " Novo recurso ",
            notes: "",
            status: "PUBLISHED",
            url: "https://tiktok.com/x",
          },
          deps,
        );
        assert.equal(tiktok.status, "PENDING");
        assert.equal(tiktok.url, null);
        assert.equal(tiktok.caption, "Novo recurso");
        assert.equal(tiktok.notes, null);

        const edited = await updatePublication(
          ctx.member.id,
          workspaceId,
          project.id,
          tiktok.id,
          { platform: "YOUTUBE_SHORTS", caption: "", notes: "sem música" },
          deps,
        );
        assert.equal(edited.platform, "YOUTUBE_SHORTS");
        assert.equal(edited.caption, null);
        assert.equal(edited.notes, "sem música");
        assert.equal(edited.status, "PENDING");

        await assert.rejects(
          createPublication(
            ctx.owner.id,
            workspaceId,
            project.id,
            { platform: "ORKUT" },
            deps,
          ),
          ValidationError,
        );
        await assert.rejects(
          createPublication(
            ctx.viewer.id,
            workspaceId,
            project.id,
            { platform: "TIKTOK" },
            deps,
          ),
          ForbiddenError,
        );
        await assert.rejects(
          updatePublication(
            ctx.owner.id,
            workspaceId,
            ctx.sibling.id,
            tiktok.id,
            { platform: "TIKTOK" },
            deps,
          ),
          NotFoundError,
        );
        await assert.rejects(
          deletePublication(
            ctx.viewer.id,
            workspaceId,
            project.id,
            tiktok.id,
            deps,
          ),
          ForbiddenError,
        );
        await assert.rejects(
          createPublication(
            ctx.owner.id,
            workspaceId,
            ctx.other.id,
            { platform: "TIKTOK" },
            deps,
          ),
          NotFoundError,
        );

        await deletePublication(
          ctx.member.id,
          workspaceId,
          project.id,
          tiktok.id,
          deps,
        );
        assert.deepEqual(
          await listPublications(ctx.owner.id, workspaceId, project.id, deps),
          [],
        );
      } finally {
        await ctx.cleanup();
      }
    });
  },
);
