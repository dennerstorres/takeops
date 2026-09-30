import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";
import {
  characterKey,
  createCharacter,
  deleteCharacter,
  listCharacters,
  listSceneCharacters,
  setSceneCharacters,
  updateCharacter,
} from "./character.ts";
import { ForbiddenError, NotFoundError, ValidationError } from "./errors.ts";
import { createProject } from "./project.ts";
import { createScene } from "./scene.ts";
import { createWorkspace } from "./workspace.ts";

const databaseReady = (process.env.DATABASE_URL ?? "").startsWith("postgres");

describe("chave do personagem", () => {
  it("ignora acento, caixa e espaço extra", () => {
    assert.equal(characterKey("  Funcionário "), characterKey("FUNCIONARIO"));
    assert.notEqual(characterKey("Ana"), characterKey("Ana Paula"));
  });
});

describe(
  "elenco no banco",
  { skip: databaseReady ? false : "sem Postgres" },
  () => {
    it("liga personagens às cenas da produção, isolado por workspace", async () => {
      const { prisma } = await import("./db.ts");
      const { prismaCharacterRepository } =
        await import("./character-prisma.ts");
      const { prismaIdeaRepository } = await import("./idea-prisma.ts");
      const { prismaProjectRepository } = await import("./project-prisma.ts");
      const { prismaSceneRepository } = await import("./scene-prisma.ts");
      const { prismaWorkspaceRepository } =
        await import("./workspace-prisma.ts");
      const deps = {
        workspaces: prismaWorkspaceRepository,
        projects: prismaProjectRepository,
        scenes: prismaSceneRepository,
        characters: prismaCharacterRepository,
      };
      const suffix = randomUUID();
      const author = await prisma.user.create({
        data: { email: `elenco-${suffix}@example.com`, name: "Autora" },
      });
      const viewer = await prisma.user.create({
        data: { email: `elenco-leitor-${suffix}@example.com`, name: "Leitor" },
      });
      const outsider = await prisma.user.create({
        data: { email: `elenco-fora-${suffix}@example.com`, name: "Fora" },
      });
      let workspaceId = "";
      let foreignId = "";

      try {
        const workspace = await createWorkspace(
          author.id,
          { name: `Elenco ${suffix}`, slug: `elenco-${suffix}` },
          prismaWorkspaceRepository,
        );
        const foreign = await createWorkspace(
          outsider.id,
          { name: `Outro ${suffix}`, slug: `elenco-outro-${suffix}` },
          prismaWorkspaceRepository,
        );
        workspaceId = workspace.workspace.id;
        foreignId = foreign.workspace.id;
        await prisma.workspaceMember.create({
          data: { workspaceId, userId: viewer.id, role: "VIEWER" },
        });
        const newProject = (userId: string, wsId: string, title: string) =>
          createProject(
            userId,
            wsId,
            { title, format: "SKETCH" },
            prismaWorkspaceRepository,
            prismaIdeaRepository,
            prismaProjectRepository,
          );
        const project = await newProject(author.id, workspaceId, `E ${suffix}`);
        const other = await newProject(outsider.id, foreignId, `O ${suffix}`);
        const scene = await createScene(
          author.id,
          workspaceId,
          project.id,
          { title: "Corredor", type: "DIALOGUE" },
          prismaWorkspaceRepository,
          prismaProjectRepository,
          prismaSceneRepository,
        );

        const marcelo = await createCharacter(
          author.id,
          workspaceId,
          project.id,
          { name: "Marcelo", actorName: "Ator 2", userId: viewer.id },
          deps,
        );
        const ana = await createCharacter(
          author.id,
          workspaceId,
          project.id,
          { name: "Ana" },
          deps,
        );
        await assert.rejects(
          () =>
            createCharacter(
              author.id,
              workspaceId,
              project.id,
              { name: "MARCELO" },
              deps,
            ),
          (error) => error instanceof ValidationError && "name" in error.fields,
        );
        await assert.rejects(
          () =>
            createCharacter(
              author.id,
              workspaceId,
              project.id,
              { name: "Intruso", userId: outsider.id },
              deps,
            ),
          (error) =>
            error instanceof ValidationError && "userId" in error.fields,
        );
        await assert.rejects(
          () =>
            createCharacter(
              viewer.id,
              workspaceId,
              project.id,
              { name: "Leitor" },
              deps,
            ),
          ForbiddenError,
        );

        await setSceneCharacters(
          author.id,
          workspaceId,
          project.id,
          scene.id,
          [marcelo.id, ana.id, marcelo.id],
          deps,
        );
        const links = await listSceneCharacters(
          viewer.id,
          workspaceId,
          project.id,
          deps,
        );
        assert.deepEqual(
          new Set(links.get(scene.id)),
          new Set([marcelo.id, ana.id]),
        );

        // Personagem de outra produção não entra na cena.
        const stranger = await createCharacter(
          outsider.id,
          foreignId,
          other.id,
          { name: "Estranho" },
          deps,
        );
        await assert.rejects(
          () =>
            setSceneCharacters(
              author.id,
              workspaceId,
              project.id,
              scene.id,
              [stranger.id],
              deps,
            ),
          ValidationError,
        );
        await assert.rejects(
          () =>
            updateCharacter(
              outsider.id,
              foreignId,
              project.id,
              marcelo.id,
              { name: "Roubado" },
              deps,
            ),
          NotFoundError,
        );

        await updateCharacter(
          author.id,
          workspaceId,
          project.id,
          ana.id,
          { name: "Ana Paula", actorName: "" },
          deps,
        );
        await deleteCharacter(
          author.id,
          workspaceId,
          project.id,
          marcelo.id,
          deps,
        );
        const cast = await listCharacters(
          viewer.id,
          workspaceId,
          project.id,
          deps,
        );
        assert.deepEqual(
          cast.map((row) => [row.name, row.actorName]),
          [["Ana Paula", null]],
        );
        const after = await listSceneCharacters(
          author.id,
          workspaceId,
          project.id,
          deps,
        );
        assert.deepEqual(after.get(scene.id), [ana.id]);
      } finally {
        if (workspaceId) {
          await prisma.workspace.deleteMany({ where: { id: workspaceId } });
        }
        if (foreignId) {
          await prisma.workspace.deleteMany({ where: { id: foreignId } });
        }
        await prisma.user.deleteMany({
          where: { id: { in: [author.id, viewer.id, outsider.id] } },
        });
      }
    });
  },
);
