import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";
import { ForbiddenError, NotFoundError, ValidationError } from "./errors.ts";
import {
  addTemplateScene,
  createProductionTemplate,
  deleteProductionTemplate,
  getProductionTemplate,
  listProductionTemplates,
  listTemplateScenes,
  moveTemplateScene,
  removeTemplateScene,
  updateProductionTemplate,
  type ProductionTemplateDeps,
} from "./production-template.ts";
import { createWorkspace } from "./workspace.ts";

const databaseReady = (process.env.DATABASE_URL ?? "").startsWith("postgres");

async function templateSetup() {
  const { prisma } = await import("./db.ts");
  const { prismaProductionTemplateRepository } =
    await import("./production-template-prisma.ts");
  const { prismaWorkspaceRepository } = await import("./workspace-prisma.ts");
  const deps: ProductionTemplateDeps = {
    workspaces: prismaWorkspaceRepository,
    templates: prismaProductionTemplateRepository,
  };
  const suffix = randomUUID();
  const [owner, admin, member, outsider] = await Promise.all(
    ["dono", "admin", "membro", "fora"].map((name) =>
      prisma.user.create({
        data: { email: `tpl-${name}-${suffix}@example.com`, name },
      }),
    ),
  );
  const workspace = await createWorkspace(
    owner.id,
    { name: `Template ${suffix}`, slug: `template-${suffix}` },
    prismaWorkspaceRepository,
  );
  const foreign = await createWorkspace(
    outsider.id,
    { name: `Outro template ${suffix}`, slug: `outro-tpl-${suffix}` },
    prismaWorkspaceRepository,
  );
  const workspaceId = workspace.workspace.id;
  const foreignId = foreign.workspace.id;
  await prisma.workspaceMember.createMany({
    data: [
      { workspaceId, userId: admin.id, role: "ADMIN" },
      { workspaceId, userId: member.id, role: "MEMBER" },
    ],
  });
  return {
    prisma,
    deps,
    suffix,
    workspaceId,
    foreignId,
    owner,
    admin,
    member,
    outsider,
    async cleanup() {
      await prisma.workspace.deleteMany({
        where: { id: { in: [workspaceId, foreignId] } },
      });
      await prisma.user.deleteMany({
        where: {
          id: { in: [owner, admin, member, outsider].map((user) => user.id) },
        },
      });
    },
  };
}

describe(
  "template de produção no banco",
  { skip: databaseReady ? false : "sem Postgres" },
  () => {
    it("dono e admin mantêm; membro lê; outro workspace não alcança", async () => {
      const ctx = await templateSetup();
      try {
        const { deps, workspaceId } = ctx;
        const demo = await createProductionTemplate(
          ctx.admin.id,
          workspaceId,
          { name: " Demonstração de Feature ", description: "" },
          deps,
        );
        assert.equal(demo.name, "Demonstração de Feature");
        assert.equal(demo.description, null);
        assert.equal(demo.createdById, ctx.admin.id);
        const foreign = await createProductionTemplate(
          ctx.outsider.id,
          ctx.foreignId,
          { name: "Alheio" },
          deps,
        );

        assert.deepEqual(
          (await listProductionTemplates(ctx.member.id, workspaceId, deps)).map(
            (row) => row.id,
          ),
          [demo.id],
        );
        const edited = await updateProductionTemplate(
          ctx.owner.id,
          workspaceId,
          demo.id,
          { name: "Demo", description: "Hook, problema, demo, CTA" },
          deps,
        );
        assert.equal(edited.description, "Hook, problema, demo, CTA");

        await assert.rejects(
          createProductionTemplate(
            ctx.member.id,
            workspaceId,
            { name: "Não" },
            deps,
          ),
          ForbiddenError,
        );
        await assert.rejects(
          createProductionTemplate(
            ctx.owner.id,
            workspaceId,
            { name: " " },
            deps,
          ),
          ValidationError,
        );
        await assert.rejects(
          getProductionTemplate(ctx.owner.id, workspaceId, foreign.id, deps),
          NotFoundError,
        );
        await assert.rejects(
          updateProductionTemplate(
            ctx.owner.id,
            workspaceId,
            foreign.id,
            { name: "Troca" },
            deps,
          ),
          NotFoundError,
        );
        await assert.rejects(
          listProductionTemplates(ctx.outsider.id, workspaceId, deps),
          ForbiddenError,
        );

        await deleteProductionTemplate(
          ctx.owner.id,
          workspaceId,
          demo.id,
          deps,
        );
        assert.deepEqual(
          await listProductionTemplates(ctx.owner.id, workspaceId, deps),
          [],
        );
      } finally {
        await ctx.cleanup();
      }
    });

    it("guarda cenas em ordem, move e remove renumerando", async () => {
      const ctx = await templateSetup();
      try {
        const { deps, workspaceId } = ctx;
        const template = await createProductionTemplate(
          ctx.owner.id,
          workspaceId,
          { name: "Demo" },
          deps,
        );
        for (const [title, type] of [
          ["Hook", "HOOK"],
          ["Problema", "TALKING_HEAD"],
          ["Demonstração", "SCREEN_CAPTURE"],
          ["CTA", "CTA"],
        ]) {
          await addTemplateScene(
            ctx.admin.id,
            workspaceId,
            template.id,
            { title, type, description: "" },
            deps,
          );
        }
        const titles = async () =>
          (
            await listTemplateScenes(
              ctx.member.id,
              workspaceId,
              template.id,
              deps,
            )
          ).map((scene) => `${scene.order}.${scene.title}`);
        assert.deepEqual(await titles(), [
          "1.Hook",
          "2.Problema",
          "3.Demonstração",
          "4.CTA",
        ]);

        const scenes = await listTemplateScenes(
          ctx.owner.id,
          workspaceId,
          template.id,
          deps,
        );
        await moveTemplateScene(
          ctx.owner.id,
          workspaceId,
          template.id,
          scenes[3].id,
          { direction: "up" },
          deps,
        );
        await moveTemplateScene(
          ctx.owner.id,
          workspaceId,
          template.id,
          scenes[0].id,
          { direction: "up" },
          deps,
        );
        assert.deepEqual(await titles(), [
          "1.Hook",
          "2.Problema",
          "3.CTA",
          "4.Demonstração",
        ]);
        await removeTemplateScene(
          ctx.owner.id,
          workspaceId,
          template.id,
          scenes[1].id,
          deps,
        );
        assert.deepEqual(await titles(), ["1.Hook", "2.CTA", "3.Demonstração"]);

        await assert.rejects(
          addTemplateScene(
            ctx.member.id,
            workspaceId,
            template.id,
            { title: "X", type: "OTHER" },
            deps,
          ),
          ForbiddenError,
        );
        await assert.rejects(
          addTemplateScene(
            ctx.owner.id,
            workspaceId,
            template.id,
            { title: "X", type: "VLOG" },
            deps,
          ),
          ValidationError,
        );
        const foreign = await createProductionTemplate(
          ctx.outsider.id,
          ctx.foreignId,
          { name: "Alheio" },
          deps,
        );
        await assert.rejects(
          addTemplateScene(
            ctx.owner.id,
            workspaceId,
            foreign.id,
            { title: "X", type: "OTHER" },
            deps,
          ),
          NotFoundError,
        );
        await assert.rejects(
          removeTemplateScene(
            ctx.owner.id,
            workspaceId,
            template.id,
            "nao-existe",
            deps,
          ),
          NotFoundError,
        );
      } finally {
        await ctx.cleanup();
      }
    });
  },
);
