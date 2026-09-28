import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";
import {
  addChecklistItem,
  createChecklistTemplate,
  createRecommendedChecklist,
  deleteChecklistTemplate,
  getChecklistTemplate,
  listChecklistTemplates,
  removeChecklistItem,
  reorderChecklistItems,
  updateChecklistItem,
  updateChecklistTemplate,
} from "./checklist.ts";
import { recommendedShootChecklist } from "./checklist-defaults.ts";
import { ForbiddenError, NotFoundError, ValidationError } from "./errors.ts";
import { createWorkspace } from "./workspace.ts";

const databaseReady = (process.env.DATABASE_URL ?? "").startsWith("postgres");

describe(
  "template de checklist no banco",
  { skip: databaseReady ? false : "sem Postgres" },
  () => {
    it("mantém itens em ordem e fica no workspace", async () => {
      const { prisma } = await import("./db.ts");
      const { prismaChecklistRepository: repo } =
        await import("./checklist-prisma.ts");
      const { prismaWorkspaceRepository: ws } =
        await import("./workspace-prisma.ts");
      const suffix = randomUUID();
      const owner = await prisma.user.create({
        data: { email: `check-${suffix}@example.com`, name: "Dono" },
      });
      const member = await prisma.user.create({
        data: { email: `check-membro-${suffix}@example.com`, name: "Membro" },
      });
      const outsider = await prisma.user.create({
        data: { email: `check-fora-${suffix}@example.com`, name: "Fora" },
      });
      let workspaceId = "";
      let foreignId = "";

      try {
        workspaceId = (
          await createWorkspace(
            owner.id,
            { name: `Check ${suffix}`, slug: `check-${suffix}` },
            ws,
          )
        ).workspace.id;
        foreignId = (
          await createWorkspace(
            outsider.id,
            { name: `Outro check ${suffix}`, slug: `outro-check-${suffix}` },
            ws,
          )
        ).workspace.id;
        await prisma.workspaceMember.create({
          data: { workspaceId, userId: member.id, role: "MEMBER" },
        });

        const template = await createChecklistTemplate(
          owner.id,
          workspaceId,
          { name: " Preparação ", type: "SHOOT", workspaceId: foreignId },
          ws,
          repo,
          ["Limpar lentes", "Testar microfone"],
        );
        assert.equal(template.name, "Preparação");
        assert.equal(template.workspaceId, workspaceId);
        assert.deepEqual(
          template.items.map((item) => [item.order, item.text]),
          [
            [1, "Limpar lentes"],
            [2, "Testar microfone"],
          ],
        );

        const added = await addChecklistItem(
          owner.id,
          workspaceId,
          template.id,
          { text: "Conferir foco" },
          ws,
          repo,
        );
        const [lens, mic, focus] = added.items;
        assert.equal(focus.order, 3);

        const edited = await updateChecklistItem(
          owner.id,
          workspaceId,
          template.id,
          mic.id,
          { text: "Testar microfone e fone" },
          ws,
          repo,
        );
        assert.equal(edited.items[1].text, "Testar microfone e fone");

        const reordered = await reorderChecklistItems(
          owner.id,
          workspaceId,
          template.id,
          { itemIds: [focus.id, lens.id, mic.id] },
          ws,
          repo,
        );
        assert.deepEqual(
          reordered.items.map((item) => [item.id, item.order]),
          [
            [focus.id, 1],
            [lens.id, 2],
            [mic.id, 3],
          ],
        );
        await assert.rejects(
          reorderChecklistItems(
            owner.id,
            workspaceId,
            template.id,
            { itemIds: [focus.id, lens.id] },
            ws,
            repo,
          ),
          ValidationError,
        );

        const removed = await removeChecklistItem(
          owner.id,
          workspaceId,
          template.id,
          lens.id,
          ws,
          repo,
        );
        assert.deepEqual(
          removed.items.map((item) => [item.id, item.order]),
          [
            [focus.id, 1],
            [mic.id, 2],
          ],
        );

        const renamed = await updateChecklistTemplate(
          owner.id,
          workspaceId,
          template.id,
          { name: "Antes de gravar", type: "SHOOT" },
          ws,
          repo,
        );
        assert.equal(renamed.name, "Antes de gravar");

        // Membro vê, mas não mexe.
        const seen = await getChecklistTemplate(
          member.id,
          workspaceId,
          template.id,
          ws,
          repo,
        );
        assert.equal(seen.items.length, 2);
        await assert.rejects(
          addChecklistItem(
            member.id,
            workspaceId,
            template.id,
            { text: "x" },
            ws,
            repo,
          ),
          ForbiddenError,
        );
        await assert.rejects(
          createChecklistTemplate(
            member.id,
            workspaceId,
            { name: "Meu" },
            ws,
            repo,
          ),
          ForbiddenError,
        );

        // Outro workspace não acha nem pelo id.
        await assert.rejects(
          getChecklistTemplate(outsider.id, foreignId, template.id, ws, repo),
          NotFoundError,
        );
        await assert.rejects(
          removeChecklistItem(
            outsider.id,
            foreignId,
            template.id,
            mic.id,
            ws,
            repo,
          ),
          NotFoundError,
        );
        await assert.rejects(
          deleteChecklistTemplate(
            outsider.id,
            foreignId,
            template.id,
            ws,
            repo,
          ),
          NotFoundError,
        );
        assert.deepEqual(
          await listChecklistTemplates(outsider.id, foreignId, ws, repo),
          [],
        );

        await assert.rejects(
          createChecklistTemplate(
            owner.id,
            workspaceId,
            { name: "Vazio", type: "DRONE" },
            ws,
            repo,
          ),
          ValidationError,
        );

        await deleteChecklistTemplate(
          owner.id,
          workspaceId,
          template.id,
          ws,
          repo,
        );
        assert.deepEqual(
          await listChecklistTemplates(owner.id, workspaceId, ws, repo),
          [],
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

    it("cria o checklist recomendado uma vez só", async () => {
      const { prisma } = await import("./db.ts");
      const { prismaChecklistRepository: repo } =
        await import("./checklist-prisma.ts");
      const { prismaWorkspaceRepository: ws } =
        await import("./workspace-prisma.ts");
      const suffix = randomUUID();
      const owner = await prisma.user.create({
        data: { email: `padrao-${suffix}@example.com`, name: "Dono" },
      });
      const member = await prisma.user.create({
        data: { email: `padrao-membro-${suffix}@example.com`, name: "M" },
      });
      let workspaceId = "";
      try {
        workspaceId = (
          await createWorkspace(
            owner.id,
            { name: `Padrão ${suffix}`, slug: `padrao-${suffix}` },
            ws,
          )
        ).workspace.id;
        await prisma.workspaceMember.create({
          data: { workspaceId, userId: member.id, role: "MEMBER" },
        });

        const first = await createRecommendedChecklist(
          owner.id,
          workspaceId,
          ws,
          repo,
        );
        assert.equal(first.name, "Checklist de gravação");
        assert.equal(first.type, "SHOOT");
        assert.deepEqual(
          first.items.map((item) => item.text),
          recommendedShootChecklist.items,
        );
        assert.equal(first.items.at(-1)?.order, 22);

        const again = await createRecommendedChecklist(
          owner.id,
          workspaceId,
          ws,
          repo,
        );
        assert.equal(again.id, first.id);
        assert.equal(
          (await listChecklistTemplates(owner.id, workspaceId, ws, repo))
            .length,
          1,
        );
        await assert.rejects(
          createRecommendedChecklist(member.id, workspaceId, ws, repo),
          ForbiddenError,
        );
      } finally {
        if (workspaceId) {
          await prisma.workspace.deleteMany({ where: { id: workspaceId } });
        }
        await prisma.user.deleteMany({
          where: { id: { in: [owner.id, member.id] } },
        });
      }
    });
  },
);
