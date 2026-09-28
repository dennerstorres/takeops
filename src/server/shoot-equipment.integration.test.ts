import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";
import { ForbiddenError, NotFoundError, ValidationError } from "./errors.ts";
import { createEquipment, updateEquipment } from "./equipment.ts";
import { createProject } from "./project.ts";
import { createShoot } from "./shoot.ts";
import {
  addShootEquipment,
  listShootEquipment,
  removeShootEquipment,
  updateShootEquipment,
  type ShootEquipmentDeps,
} from "./shoot-equipment.ts";
import { createWorkspace } from "./workspace.ts";

const databaseReady = (process.env.DATABASE_URL ?? "").startsWith("postgres");

describe(
  "equipamento da gravação no banco",
  { skip: databaseReady ? false : "sem Postgres" },
  () => {
    it("liga o catálogo do workspace à gravação e confere", async () => {
      const { prisma } = await import("./db.ts");
      const { prismaIdeaRepository } = await import("./idea-prisma.ts");
      const { prismaProjectRepository } = await import("./project-prisma.ts");
      const { prismaShootRepository } = await import("./shoot-prisma.ts");
      const { prismaEquipmentRepository } =
        await import("./equipment-prisma.ts");
      const { prismaShootEquipmentRepository } =
        await import("./shoot-equipment-prisma.ts");
      const { prismaWorkspaceRepository } =
        await import("./workspace-prisma.ts");
      const deps: ShootEquipmentDeps = {
        workspaces: prismaWorkspaceRepository,
        projects: prismaProjectRepository,
        shoots: prismaShootRepository,
        shootEquipment: prismaShootEquipmentRepository,
      };
      const suffix = randomUUID();
      const author = await prisma.user.create({
        data: { email: `kit-${suffix}@example.com`, name: "Autor" },
      });
      const viewer = await prisma.user.create({
        data: { email: `kit-leitor-${suffix}@example.com`, name: "Leitor" },
      });
      const outsider = await prisma.user.create({
        data: { email: `kit-fora-${suffix}@example.com`, name: "Fora" },
      });
      let workspaceId = "";
      let foreignId = "";

      try {
        const workspace = await createWorkspace(
          author.id,
          { name: `Kit ${suffix}`, slug: `kit-${suffix}` },
          prismaWorkspaceRepository,
        );
        const foreign = await createWorkspace(
          outsider.id,
          { name: `Outro kit ${suffix}`, slug: `outro-kit-${suffix}` },
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
        const shoot = await createShoot(
          author.id,
          workspaceId,
          project.id,
          { scheduledAt: "2026-10-06T12:00:00Z" },
          deps,
        );
        const other = await createShoot(
          author.id,
          workspaceId,
          project.id,
          { scheduledAt: "2026-10-07T12:00:00Z" },
          deps,
        );
        const newItem = (
          userId: string,
          wsId: string,
          name: string,
          category: string,
        ) =>
          createEquipment(
            userId,
            wsId,
            { name, category },
            prismaWorkspaceRepository,
            prismaEquipmentRepository,
          );
        const camera = await newItem(
          author.id,
          workspaceId,
          "Câmera",
          "CAMERA",
        );
        const mic = await newItem(author.id, workspaceId, "Mic", "MICROPHONE");
        const old = await newItem(author.id, workspaceId, "Velha", "CAMERA");
        await updateEquipment(
          author.id,
          workspaceId,
          old.id,
          { name: "Velha", category: "CAMERA" },
          prismaWorkspaceRepository,
          prismaEquipmentRepository,
        );
        const foreignItem = await newItem(
          outsider.id,
          foreignId,
          "Luz",
          "LIGHTING",
        );

        const row = await addShootEquipment(
          author.id,
          workspaceId,
          project.id,
          shoot.id,
          {
            equipmentItemId: camera.id,
            required: "on",
            notes: "Bateria extra",
          },
          deps,
        );
        await addShootEquipment(
          author.id,
          workspaceId,
          project.id,
          shoot.id,
          { equipmentItemId: mic.id },
          deps,
        );
        assert.equal(row.required, true);
        assert.equal(row.checked, false);
        assert.equal(row.item.name, "Câmera");

        for (const equipmentItemId of [camera.id, old.id, foreignItem.id]) {
          await assert.rejects(
            addShootEquipment(
              author.id,
              workspaceId,
              project.id,
              shoot.id,
              { equipmentItemId },
              deps,
            ),
            ValidationError,
          );
        }

        const checked = await updateShootEquipment(
          author.id,
          workspaceId,
          project.id,
          shoot.id,
          row.id,
          { required: "on", checked: "on" },
          deps,
        );
        assert.equal(checked.checked, true);
        assert.equal(checked.notes, null);
        // A linha não é alcançada por outra gravação.
        await assert.rejects(
          updateShootEquipment(
            author.id,
            workspaceId,
            project.id,
            other.id,
            row.id,
            { checked: "on" },
            deps,
          ),
          NotFoundError,
        );
        await assert.rejects(
          updateShootEquipment(
            viewer.id,
            workspaceId,
            project.id,
            shoot.id,
            row.id,
            { checked: "on" },
            deps,
          ),
          ForbiddenError,
        );

        const listed = await listShootEquipment(
          viewer.id,
          workspaceId,
          project.id,
          shoot.id,
          deps,
        );
        assert.equal(listed.length, 2);
        assert.deepEqual(
          await listShootEquipment(
            author.id,
            workspaceId,
            project.id,
            other.id,
            deps,
          ),
          [],
        );
        await assert.rejects(
          listShootEquipment(
            outsider.id,
            workspaceId,
            project.id,
            shoot.id,
            deps,
          ),
          ForbiddenError,
        );

        await removeShootEquipment(
          author.id,
          workspaceId,
          project.id,
          shoot.id,
          row.id,
          deps,
        );
        const after = await listShootEquipment(
          author.id,
          workspaceId,
          project.id,
          shoot.id,
          deps,
        );
        assert.deepEqual(
          after.map((item) => item.item.name),
          ["Mic"],
        );
        // Tirar da gravação não apaga o item do catálogo.
        assert.ok(
          await prisma.equipmentItem.findUnique({ where: { id: camera.id } }),
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
