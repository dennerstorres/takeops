import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";
import {
  createChecklistTemplate,
  deleteChecklistTemplate,
  updateChecklistItem,
} from "./checklist.ts";
import { ForbiddenError, NotFoundError, ValidationError } from "./errors.ts";
import { createProject } from "./project.ts";
import { createShoot } from "./shoot.ts";
import {
  instantiateShootChecklist,
  listShootChecklist,
  setShootChecklistItem,
  type ShootChecklistDeps,
} from "./shoot-checklist.ts";
import { createWorkspace } from "./workspace.ts";

import { PROJECT_CHECKLIST_SOURCE } from "./shoot-checklist-repository.ts";

const databaseReady = (process.env.DATABASE_URL ?? "").startsWith("postgres");

describe(
  "checklist da gravação no banco",
  { skip: databaseReady ? false : "sem Postgres" },
  () => {
    it("copia o modelo e não muda quando o modelo muda", async () => {
      const { prisma } = await import("./db.ts");
      const { prismaIdeaRepository } = await import("./idea-prisma.ts");
      const { prismaProjectRepository } = await import("./project-prisma.ts");
      const { prismaShootRepository } = await import("./shoot-prisma.ts");
      const { prismaChecklistRepository: templates } =
        await import("./checklist-prisma.ts");
      const { prismaShootChecklistRepository } =
        await import("./shoot-checklist-prisma.ts");
      const { prismaWorkspaceRepository: ws } =
        await import("./workspace-prisma.ts");
      const deps: ShootChecklistDeps = {
        workspaces: ws,
        projects: prismaProjectRepository,
        shoots: prismaShootRepository,
        shootChecklist: prismaShootChecklistRepository,
      };
      const suffix = randomUUID();
      const owner = await prisma.user.create({
        data: { email: `sc-${suffix}@example.com`, name: "Dono" },
      });
      const member = await prisma.user.create({
        data: { email: `sc-membro-${suffix}@example.com`, name: "Membro" },
      });
      const viewer = await prisma.user.create({
        data: { email: `sc-leitor-${suffix}@example.com`, name: "Leitor" },
      });
      const outsider = await prisma.user.create({
        data: { email: `sc-fora-${suffix}@example.com`, name: "Fora" },
      });
      let workspaceId = "";
      let foreignId = "";

      try {
        workspaceId = (
          await createWorkspace(
            owner.id,
            { name: `SC ${suffix}`, slug: `sc-${suffix}` },
            ws,
          )
        ).workspace.id;
        foreignId = (
          await createWorkspace(
            outsider.id,
            { name: `Outro SC ${suffix}`, slug: `outro-sc-${suffix}` },
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
        const shoot = await createShoot(
          owner.id,
          workspaceId,
          project.id,
          { scheduledAt: "2026-10-06T12:00:00Z" },
          deps,
        );
        const template = await createChecklistTemplate(
          owner.id,
          workspaceId,
          { name: "Preparação" },
          ws,
          templates,
          ["Limpar lentes", "Testar microfone"],
        );
        const foreignTemplate = await createChecklistTemplate(
          outsider.id,
          foreignId,
          { name: "Alheio" },
          ws,
          templates,
          ["Segredo"],
        );

        const copied = await instantiateShootChecklist(
          member.id,
          workspaceId,
          project.id,
          shoot.id,
          { templateId: template.id },
          deps,
        );
        assert.deepEqual(
          copied.map((item) => [item.order, item.text, item.completed]),
          [
            [1, "Limpar lentes", false],
            [2, "Testar microfone", false],
          ],
        );

        // Mudar e apagar o modelo depois não mexe no que foi copiado.
        await updateChecklistItem(
          owner.id,
          workspaceId,
          template.id,
          template.items[0].id,
          { text: "Trocar lente" },
          ws,
          templates,
        );
        await deleteChecklistTemplate(
          owner.id,
          workspaceId,
          template.id,
          ws,
          templates,
        );
        const kept = await listShootChecklist(
          viewer.id,
          workspaceId,
          project.id,
          shoot.id,
          deps,
        );
        assert.deepEqual(
          kept.map((item) => item.text),
          ["Limpar lentes", "Testar microfone"],
        );

        const now = new Date("2026-10-06T12:30:00.000Z");
        const done = await setShootChecklistItem(
          member.id,
          workspaceId,
          project.id,
          shoot.id,
          kept[0].id,
          { completed: "on", completedById: outsider.id },
          deps,
          now,
        );
        assert.equal(done.completed, true);
        assert.equal(done.completedById, member.id);
        assert.equal(done.completedByName, "Membro");
        assert.equal(done.completedAt?.toISOString(), now.toISOString());
        const undone = await setShootChecklistItem(
          member.id,
          workspaceId,
          project.id,
          shoot.id,
          kept[0].id,
          {},
          deps,
        );
        assert.equal(undone.completed, false);
        assert.equal(undone.completedById, null);
        assert.equal(undone.completedAt, null);

        await assert.rejects(
          instantiateShootChecklist(
            owner.id,
            workspaceId,
            project.id,
            shoot.id,
            { templateId: foreignTemplate.id },
            deps,
          ),
          ValidationError,
        );
        await assert.rejects(
          setShootChecklistItem(
            viewer.id,
            workspaceId,
            project.id,
            shoot.id,
            kept[0].id,
            { completed: "on" },
            deps,
          ),
          ForbiddenError,
        );
        await assert.rejects(
          listShootChecklist(
            outsider.id,
            workspaceId,
            project.id,
            shoot.id,
            deps,
          ),
          ForbiddenError,
        );
        const other = await createShoot(
          owner.id,
          workspaceId,
          project.id,
          { scheduledAt: "2026-10-07T12:00:00Z" },
          deps,
        );
        await assert.rejects(
          setShootChecklistItem(
            owner.id,
            workspaceId,
            project.id,
            other.id,
            kept[0].id,
            { completed: "on" },
            deps,
          ),
          NotFoundError,
        );

        // Checklist da produção (copiado do template) também serve de origem.
        await assert.rejects(
          instantiateShootChecklist(
            owner.id,
            workspaceId,
            project.id,
            other.id,
            { templateId: PROJECT_CHECKLIST_SOURCE },
            deps,
          ),
          ValidationError,
        );
        await prisma.projectChecklistItem.createMany({
          data: [
            { videoProjectId: project.id, order: 1, text: "Luz ligada" },
            { videoProjectId: project.id, order: 2, text: "Cenário limpo" },
          ],
        });
        const fromProject = await instantiateShootChecklist(
          member.id,
          workspaceId,
          project.id,
          other.id,
          { templateId: PROJECT_CHECKLIST_SOURCE },
          deps,
        );
        assert.deepEqual(
          fromProject.map((item) => item.text),
          ["Luz ligada", "Cenário limpo"],
        );
      } finally {
        if (workspaceId) {
          await prisma.workspace.deleteMany({ where: { id: workspaceId } });
        }
        if (foreignId) {
          await prisma.workspace.deleteMany({ where: { id: foreignId } });
        }
        await prisma.user.deleteMany({
          where: {
            id: { in: [owner.id, member.id, viewer.id, outsider.id] },
          },
        });
      }
    });
  },
);
