import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";
import {
  createAsset,
  deleteAsset,
  listAssets,
  updateAsset,
  type AssetDeps,
} from "./asset.ts";
import { ForbiddenError, NotFoundError, ValidationError } from "./errors.ts";
import { externalUrl } from "./external-url.ts";
import { createProject } from "./project.ts";
import { createWorkspace } from "./workspace.ts";

const databaseReady = (process.env.DATABASE_URL ?? "").startsWith("postgres");

describe("link do asset", () => {
  it("aceita http(s) de qualquer serviço", () => {
    assert.equal(
      externalUrl("https://drive.google.com/drive/folders/abc"),
      "https://drive.google.com/drive/folders/abc",
    );
    assert.equal(
      externalUrl("http://nas.local:5000/sharing/x"),
      "http://nas.local:5000/sharing/x",
    );
  });

  it("recusa outro protocolo, texto solto e credencial no link", () => {
    for (const value of [
      "javascript:alert(1)",
      "data:text/html,oi",
      "file:///C:/video.mp4",
      "ftp://servidor/arquivo",
      "drive.google.com/x",
      "https://user:senha@nas.local/x",
    ]) {
      assert.throws(() => externalUrl(value), ValidationError, value);
    }
  });
});

describe(
  "asset no banco",
  { skip: databaseReady ? false : "sem Postgres" },
  () => {
    it("guarda links na produção do workspace e barra quem não pode", async () => {
      const { prisma } = await import("./db.ts");
      const { prismaAssetRepository } = await import("./asset-prisma.ts");
      const { prismaIdeaRepository } = await import("./idea-prisma.ts");
      const { prismaProjectRepository } = await import("./project-prisma.ts");
      const { prismaWorkspaceRepository } =
        await import("./workspace-prisma.ts");
      const deps: AssetDeps = {
        workspaces: prismaWorkspaceRepository,
        projects: prismaProjectRepository,
        assets: prismaAssetRepository,
      };
      const suffix = randomUUID();
      const author = await prisma.user.create({
        data: { email: `asset-${suffix}@example.com`, name: "Autor" },
      });
      const viewer = await prisma.user.create({
        data: { email: `asset-leitor-${suffix}@example.com`, name: "Leitor" },
      });
      const outsider = await prisma.user.create({
        data: { email: `asset-fora-${suffix}@example.com`, name: "Fora" },
      });
      let workspaceId = "";
      let foreignId = "";

      try {
        const workspace = await createWorkspace(
          author.id,
          { name: `Asset ${suffix}`, slug: `asset-${suffix}` },
          prismaWorkspaceRepository,
        );
        const foreign = await createWorkspace(
          outsider.id,
          { name: `Outro asset ${suffix}`, slug: `outro-asset-${suffix}` },
          prismaWorkspaceRepository,
        );
        workspaceId = workspace.workspace.id;
        foreignId = foreign.workspace.id;
        await prisma.workspaceMember.create({
          data: { workspaceId, userId: viewer.id, role: "VIEWER" },
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

        const raw = await createAsset(
          author.id,
          workspaceId,
          project.id,
          {
            type: "RAW_FOOTAGE",
            title: "Brutos câmera A",
            url: " https://drive.google.com/drive/folders/abc ",
          },
          deps,
        );
        assert.equal(raw.url, "https://drive.google.com/drive/folders/abc");
        assert.equal(raw.createdById, author.id);
        assert.equal(raw.description, null);
        const foreignAsset = await createAsset(
          outsider.id,
          foreignId,
          other.id,
          { type: "OTHER", title: "Alheio", url: "https://example.com" },
          deps,
        );

        const listed = await listAssets(
          viewer.id,
          workspaceId,
          project.id,
          deps,
        );
        assert.deepEqual(
          listed.map((asset) => asset.id),
          [raw.id],
        );

        const edited = await updateAsset(
          author.id,
          workspaceId,
          project.id,
          raw.id,
          {
            type: "FOLDER",
            title: "Pasta de brutos",
            url: "https://www.dropbox.com/sh/x",
            description: "Dia 1",
          },
          deps,
        );
        assert.equal(edited.type, "FOLDER");
        assert.equal(edited.description, "Dia 1");

        await assert.rejects(
          createAsset(
            author.id,
            workspaceId,
            project.id,
            { type: "OTHER", title: "X", url: "javascript:alert(1)" },
            deps,
          ),
          ValidationError,
        );
        await assert.rejects(
          createAsset(
            author.id,
            workspaceId,
            project.id,
            { type: "VIDEO", title: "X", url: "https://example.com" },
            deps,
          ),
          ValidationError,
        );
        await assert.rejects(
          createAsset(
            viewer.id,
            workspaceId,
            project.id,
            { type: "OTHER", title: "X", url: "https://example.com" },
            deps,
          ),
          ForbiddenError,
        );
        await assert.rejects(
          updateAsset(
            author.id,
            workspaceId,
            sibling.id,
            raw.id,
            { type: "OTHER", title: "X", url: "https://example.com" },
            deps,
          ),
          NotFoundError,
        );
        await assert.rejects(
          deleteAsset(
            author.id,
            workspaceId,
            project.id,
            foreignAsset.id,
            deps,
          ),
          NotFoundError,
        );
        await assert.rejects(
          listAssets(outsider.id, workspaceId, project.id, deps),
          ForbiddenError,
        );

        await deleteAsset(author.id, workspaceId, project.id, raw.id, deps);
        assert.deepEqual(
          await listAssets(author.id, workspaceId, project.id, deps),
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
          where: { id: { in: [author.id, viewer.id, outsider.id] } },
        });
      }
    });
  },
);
