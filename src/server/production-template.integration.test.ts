import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";
import { ForbiddenError, NotFoundError, ValidationError } from "./errors.ts";
import {
  addTemplateScene,
  createProductionTemplate,
  createProjectFromTemplate,
  deleteProductionTemplate,
  getProductionTemplate,
  listProductionTemplates,
  listProjectChecklist,
  listTemplateScenes,
  moveTemplateScene,
  removeTemplateScene,
  setTemplateChecklist,
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

    it("aponta um checklist do workspace e aceita tirar", async () => {
      const ctx = await templateSetup();
      try {
        const { prisma, deps, workspaceId } = ctx;
        const template = await createProductionTemplate(
          ctx.owner.id,
          workspaceId,
          { name: "Demo" },
          deps,
        );
        const checklist = await prisma.checklistTemplate.create({
          data: { workspaceId, name: "Gravação padrão" },
        });
        const foreignChecklist = await prisma.checklistTemplate.create({
          data: { workspaceId: ctx.foreignId, name: "Alheio" },
        });

        const linked = await setTemplateChecklist(
          ctx.admin.id,
          workspaceId,
          template.id,
          { checklistTemplateId: checklist.id },
          deps,
        );
        assert.equal(linked.checklistTemplateId, checklist.id);
        await assert.rejects(
          setTemplateChecklist(
            ctx.owner.id,
            workspaceId,
            template.id,
            { checklistTemplateId: foreignChecklist.id },
            deps,
          ),
          ValidationError,
        );
        await assert.rejects(
          setTemplateChecklist(
            ctx.member.id,
            workspaceId,
            template.id,
            { checklistTemplateId: "" },
            deps,
          ),
          ForbiddenError,
        );

        // Excluir o checklist tira a referência sem apagar o template.
        await prisma.checklistTemplate.delete({ where: { id: checklist.id } });
        const after = await getProductionTemplate(
          ctx.owner.id,
          workspaceId,
          template.id,
          deps,
        );
        assert.equal(after.checklistTemplateId, null);

        const cleared = await setTemplateChecklist(
          ctx.owner.id,
          workspaceId,
          template.id,
          { checklistTemplateId: "" },
          deps,
        );
        assert.equal(cleared.checklistTemplateId, null);
      } finally {
        await ctx.cleanup();
      }
    });

    it("cria produção por template copiando cenas e checklist", async () => {
      const ctx = await templateSetup();
      try {
        const { prisma, deps, workspaceId } = ctx;
        const { prismaIdeaRepository } = await import("./idea-prisma.ts");
        const { prismaProjectRepository } = await import("./project-prisma.ts");
        const full = {
          ...deps,
          ideas: prismaIdeaRepository,
          projects: prismaProjectRepository,
        };
        const checklist = await prisma.checklistTemplate.create({
          data: {
            workspaceId,
            name: "Gravação",
            items: {
              create: [
                { order: 1, text: "Bateria carregada" },
                { order: 2, text: "Microfone testado" },
              ],
            },
          },
        });
        const template = await createProductionTemplate(
          ctx.owner.id,
          workspaceId,
          { name: "Demo" },
          deps,
        );
        for (const [title, type] of [
          ["Hook", "HOOK"],
          ["CTA", "CTA"],
        ]) {
          await addTemplateScene(
            ctx.owner.id,
            workspaceId,
            template.id,
            { title, type, description: "curta" },
            deps,
          );
        }
        await setTemplateChecklist(
          ctx.owner.id,
          workspaceId,
          template.id,
          { checklistTemplateId: checklist.id },
          deps,
        );

        const result = await createProjectFromTemplate(
          ctx.member.id,
          workspaceId,
          template.id,
          { title: `Por template ${ctx.suffix}`, format: "DEMO" },
          full,
        );
        assert.equal(result.scenes, 2);
        assert.equal(result.checklistItems, 2);
        const scenes = await prisma.scene.findMany({
          where: { videoProjectId: result.project.id },
          orderBy: { order: "asc" },
        });
        assert.deepEqual(
          scenes.map((scene) => [scene.order, scene.title, scene.status]),
          [
            [1, "Hook", "PLANNED"],
            [2, "CTA", "PLANNED"],
          ],
        );
        assert.deepEqual(
          (
            await listProjectChecklist(
              ctx.member.id,
              workspaceId,
              result.project.id,
              full,
            )
          ).map((item) => item.text),
          ["Bateria carregada", "Microfone testado"],
        );

        // Cópia, não referência: mudar o template e o checklist depois não
        // altera a produção.
        await prisma.checklistTemplateItem.updateMany({
          where: { checklistTemplateId: checklist.id },
          data: { text: "mudou" },
        });
        await prisma.productionTemplateScene.updateMany({
          where: { templateId: template.id },
          data: { title: "mudou" },
        });
        const again = await prisma.scene.findMany({
          where: { videoProjectId: result.project.id },
        });
        assert.ok(again.every((scene) => scene.title !== "mudou"));
        const items = await prisma.projectChecklistItem.findMany({
          where: { videoProjectId: result.project.id },
        });
        assert.ok(items.every((item) => item.text !== "mudou"));

        const foreign = await createProductionTemplate(
          ctx.outsider.id,
          ctx.foreignId,
          { name: "Alheio" },
          deps,
        );
        const before = await prisma.videoProject.count({
          where: { workspaceId },
        });
        await assert.rejects(
          createProjectFromTemplate(
            ctx.owner.id,
            workspaceId,
            foreign.id,
            { title: "Não", format: "DEMO" },
            full,
          ),
          NotFoundError,
        );
        assert.equal(
          await prisma.videoProject.count({ where: { workspaceId } }),
          before,
        );
      } finally {
        await ctx.cleanup();
      }
    });
  },
);
