import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";
import {
  createContinuityNote,
  deleteContinuityNote,
  groupContinuityNotes,
  listContinuityNotes,
  updateContinuityNote,
  type ContinuityDeps,
} from "./continuity.ts";
import { ForbiddenError, NotFoundError, ValidationError } from "./errors.ts";
import { createProject } from "./project.ts";
import { createWorkspace } from "./workspace.ts";

const databaseReady = (process.env.DATABASE_URL ?? "").startsWith("postgres");

describe("agrupamento da continuidade", () => {
  it("ordena as categorias e deixa sem categoria por último", () => {
    const groups = groupContinuityNotes([
      { id: "1", category: null },
      { id: "2", category: "Pessoas" },
      { id: "3", category: "Câmera" },
      { id: "4", category: "Pessoas" },
    ]);

    assert.deepEqual(
      groups.map((group) => group.category),
      ["Câmera", "Pessoas", null],
    );
    assert.deepEqual(
      groups[1].items.map((item) => item.id),
      ["2", "4"],
    );
  });
});

describe(
  "continuidade no banco",
  { skip: databaseReady ? false : "sem Postgres" },
  () => {
    it("guarda notas na produção do workspace e barra quem não pode", async () => {
      const { prisma } = await import("./db.ts");
      const { prismaContinuityRepository } =
        await import("./continuity-prisma.ts");
      const { prismaIdeaRepository } = await import("./idea-prisma.ts");
      const { prismaProjectRepository } = await import("./project-prisma.ts");
      const { prismaWorkspaceRepository } =
        await import("./workspace-prisma.ts");
      const deps: ContinuityDeps = {
        workspaces: prismaWorkspaceRepository,
        projects: prismaProjectRepository,
        continuity: prismaContinuityRepository,
      };
      const suffix = randomUUID();
      const author = await prisma.user.create({
        data: { email: `cont-${suffix}@example.com`, name: "Autor" },
      });
      const member = await prisma.user.create({
        data: { email: `cont-membro-${suffix}@example.com`, name: "Membro" },
      });
      const viewer = await prisma.user.create({
        data: { email: `cont-leitor-${suffix}@example.com`, name: "Leitor" },
      });
      const outsider = await prisma.user.create({
        data: { email: `cont-fora-${suffix}@example.com`, name: "Fora" },
      });
      let workspaceId = "";
      let foreignId = "";

      try {
        const workspace = await createWorkspace(
          author.id,
          { name: `Continuidade ${suffix}`, slug: `cont-${suffix}` },
          prismaWorkspaceRepository,
        );
        const foreign = await createWorkspace(
          outsider.id,
          { name: `Outra cont ${suffix}`, slug: `outra-cont-${suffix}` },
          prismaWorkspaceRepository,
        );
        workspaceId = workspace.workspace.id;
        foreignId = foreign.workspace.id;
        await prisma.workspaceMember.createMany({
          data: [
            { workspaceId, userId: member.id, role: "MEMBER" },
            { workspaceId, userId: viewer.id, role: "VIEWER" },
          ],
        });
        const project = await createProject(
          author.id,
          workspaceId,
          { title: `Peça ${suffix}`, format: "DEMO" },
          prismaWorkspaceRepository,
          prismaIdeaRepository,
          prismaProjectRepository,
        );
        const sibling = await createProject(
          author.id,
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

        const joao = await createContinuityNote(
          member.id,
          workspaceId,
          project.id,
          {
            category: "Pessoas",
            title: "João",
            description: "camiseta preta\ncadeira esquerda",
          },
          deps,
        );
        assert.equal(joao.createdById, member.id);
        const mesa = await createContinuityNote(
          author.id,
          workspaceId,
          project.id,
          { category: "  ", title: "Mesa", description: "notebook aberto" },
          deps,
        );
        assert.equal(mesa.category, null);
        const foreignNote = await createContinuityNote(
          outsider.id,
          foreignId,
          other.id,
          { title: "Alheia", description: "não aparece" },
          deps,
        );

        const listed = await listContinuityNotes(
          viewer.id,
          workspaceId,
          project.id,
          deps,
        );
        assert.deepEqual(
          listed.map((note) => note.id).sort(),
          [joao.id, mesa.id].sort(),
        );

        const edited = await updateContinuityNote(
          member.id,
          workspaceId,
          project.id,
          joao.id,
          { category: "Pessoas", title: "João", description: "camisa azul" },
          deps,
        );
        assert.equal(edited.description, "camisa azul");
        assert.equal(edited.createdById, member.id);

        await assert.rejects(
          createContinuityNote(
            author.id,
            workspaceId,
            project.id,
            { title: "Sem descrição", description: " " },
            deps,
          ),
          ValidationError,
        );
        await assert.rejects(
          createContinuityNote(
            viewer.id,
            workspaceId,
            project.id,
            { title: "Não", description: "não" },
            deps,
          ),
          ForbiddenError,
        );
        await assert.rejects(
          deleteContinuityNote(
            viewer.id,
            workspaceId,
            project.id,
            joao.id,
            deps,
          ),
          ForbiddenError,
        );
        // Nota de outra produção ou de outro workspace não é alcançada.
        await assert.rejects(
          updateContinuityNote(
            author.id,
            workspaceId,
            sibling.id,
            joao.id,
            { title: "Troca", description: "troca" },
            deps,
          ),
          NotFoundError,
        );
        await assert.rejects(
          deleteContinuityNote(
            author.id,
            workspaceId,
            project.id,
            foreignNote.id,
            deps,
          ),
          NotFoundError,
        );
        await assert.rejects(
          listContinuityNotes(outsider.id, workspaceId, project.id, deps),
          ForbiddenError,
        );

        await deleteContinuityNote(
          author.id,
          workspaceId,
          project.id,
          mesa.id,
          deps,
        );
        const afterDelete = await listContinuityNotes(
          author.id,
          workspaceId,
          project.id,
          deps,
        );
        assert.deepEqual(
          afterDelete.map((note) => note.id),
          [joao.id],
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
            id: { in: [author.id, member.id, viewer.id, outsider.id] },
          },
        });
      }
    });
  },
);
