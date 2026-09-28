import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";
import { ForbiddenError, NotFoundError } from "./errors.ts";
import {
  createEquipment,
  listEquipment,
  updateEquipment,
} from "./equipment.ts";
import { createWorkspace } from "./workspace.ts";

const databaseReady = (process.env.DATABASE_URL ?? "").startsWith("postgres");

describe(
  "equipamento no banco",
  { skip: databaseReady ? false : "sem Postgres" },
  () => {
    it("guarda o catálogo por workspace e desativa sem apagar", async () => {
      const { prisma } = await import("./db.ts");
      const { prismaEquipmentRepository } =
        await import("./equipment-prisma.ts");
      const { prismaWorkspaceRepository } =
        await import("./workspace-prisma.ts");
      const suffix = randomUUID();
      const author = await prisma.user.create({
        data: { email: `equip-${suffix}@example.com`, name: "Autor" },
      });
      const viewer = await prisma.user.create({
        data: { email: `equip-leitor-${suffix}@example.com`, name: "Leitor" },
      });
      const outsider = await prisma.user.create({
        data: { email: `equip-fora-${suffix}@example.com`, name: "Fora" },
      });
      let workspaceId = "";
      let foreignId = "";

      try {
        const workspace = await createWorkspace(
          author.id,
          { name: `Equip ${suffix}`, slug: `equip-${suffix}` },
          prismaWorkspaceRepository,
        );
        const foreign = await createWorkspace(
          outsider.id,
          { name: `Outro equip ${suffix}`, slug: `outro-equip-${suffix}` },
          prismaWorkspaceRepository,
        );
        workspaceId = workspace.workspace.id;
        foreignId = foreign.workspace.id;
        await prisma.workspaceMember.create({
          data: { workspaceId, userId: viewer.id, role: "VIEWER" },
        });

        const camera = await createEquipment(
          author.id,
          workspaceId,
          { name: "Câmera A", category: "CAMERA", active: false },
          prismaWorkspaceRepository,
          prismaEquipmentRepository,
        );
        const foreignItem = await createEquipment(
          outsider.id,
          foreignId,
          { name: "Luz", category: "LIGHTING" },
          prismaWorkspaceRepository,
          prismaEquipmentRepository,
        );
        assert.equal(camera.active, true);

        const off = await updateEquipment(
          author.id,
          workspaceId,
          camera.id,
          { name: "Câmera A", category: "CAMERA" },
          prismaWorkspaceRepository,
          prismaEquipmentRepository,
        );
        assert.equal(off.active, false);

        const listed = await listEquipment(
          viewer.id,
          workspaceId,
          prismaWorkspaceRepository,
          prismaEquipmentRepository,
        );
        assert.deepEqual(
          listed.map((item) => item.id),
          [camera.id],
        );

        await assert.rejects(
          createEquipment(
            viewer.id,
            workspaceId,
            { name: "Tripé", category: "TRIPOD" },
            prismaWorkspaceRepository,
            prismaEquipmentRepository,
          ),
          ForbiddenError,
        );
        // Item de outro workspace não muda nem pelo id.
        await assert.rejects(
          updateEquipment(
            author.id,
            workspaceId,
            foreignItem.id,
            { name: "Minha", category: "OTHER" },
            prismaWorkspaceRepository,
            prismaEquipmentRepository,
          ),
          NotFoundError,
        );
        const untouched = await prisma.equipmentItem.findUnique({
          where: { id: foreignItem.id },
        });
        assert.equal(untouched?.name, "Luz");
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
