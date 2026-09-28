import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ForbiddenError, NotFoundError, ValidationError } from "./errors.ts";
import {
  createEquipment,
  listEquipment,
  updateEquipment,
} from "./equipment.ts";
import type {
  EquipmentRecord,
  EquipmentRepository,
} from "./equipment-repository.ts";
import type {
  MembershipRecord,
  WorkspaceRepository,
  WorkspaceRole,
} from "./workspace-repository.ts";

function harness() {
  const memberships: MembershipRecord[] = [];
  const items: EquipmentRecord[] = [];
  let sequence = 0;

  const workspaces = {
    async findMembership(userId: string, workspaceId: string) {
      return (
        memberships.find(
          (item) => item.userId === userId && item.workspaceId === workspaceId,
        ) ?? null
      );
    },
  } as unknown as WorkspaceRepository;

  const equipment: EquipmentRepository = {
    async list(workspaceId) {
      return items.filter((item) => item.workspaceId === workspaceId);
    },
    async find(workspaceId, itemId) {
      return (
        items.find(
          (item) => item.id === itemId && item.workspaceId === workspaceId,
        ) ?? null
      );
    },
    async create(workspaceId, input) {
      const created: EquipmentRecord = {
        id: `item-${++sequence}`,
        workspaceId,
        createdAt: new Date(sequence),
        updatedAt: new Date(sequence),
        ...input,
      };
      items.push(created);
      return created;
    },
    async update(workspaceId, itemId, input) {
      const current = await this.find(workspaceId, itemId);
      if (!current) return null;
      Object.assign(current, input);
      return current;
    },
  };

  function join(userId: string, workspaceId: string, role: WorkspaceRole) {
    memberships.push({
      id: `${workspaceId}-${userId}`,
      workspaceId,
      userId,
      role,
      createdAt: new Date(),
    });
  }

  return { workspaces, equipment, items, join };
}

describe("equipamentos", () => {
  it("cadastra no workspace da sessão, sempre ativo", async () => {
    const { workspaces, equipment, join } = harness();
    join("owner", "ws-a", "OWNER");
    join("viewer", "ws-a", "VIEWER");
    const item = await createEquipment(
      "owner",
      "ws-a",
      {
        name: " Sony ZV-E10 ",
        category: "CAMERA",
        active: false,
        workspaceId: "ws-b",
      },
      workspaces,
      equipment,
    );
    assert.equal(item.name, "Sony ZV-E10");
    assert.equal(item.workspaceId, "ws-a");
    assert.equal(item.active, true);
    assert.equal(item.notes, null);

    const listed = await listEquipment("viewer", "ws-a", workspaces, equipment);
    assert.deepEqual(
      listed.map((row) => row.id),
      [item.id],
    );
  });

  it("edita e desativa sem apagar", async () => {
    const { workspaces, equipment, join } = harness();
    join("owner", "ws-a", "OWNER");
    const item = await createEquipment(
      "owner",
      "ws-a",
      { name: "Rode", category: "MICROPHONE" },
      workspaces,
      equipment,
    );
    const off = await updateEquipment(
      "owner",
      "ws-a",
      item.id,
      { name: "Rode Wireless GO", category: "MICROPHONE", notes: "Kit 2" },
      workspaces,
      equipment,
    );
    assert.equal(off.active, false);
    assert.equal(off.notes, "Kit 2");
    const on = await updateEquipment(
      "owner",
      "ws-a",
      item.id,
      { name: "Rode Wireless GO", category: "MICROPHONE", active: "on" },
      workspaces,
      equipment,
    );
    assert.equal(on.active, true);
  });

  it("valida categoria e nome", async () => {
    const { workspaces, equipment, join } = harness();
    join("owner", "ws-a", "OWNER");
    for (const input of [
      { name: "", category: "CAMERA" },
      { name: "Drone", category: "DRONE" },
      { name: "x".repeat(121), category: "OTHER" },
    ]) {
      await assert.rejects(
        createEquipment("owner", "ws-a", input, workspaces, equipment),
        ValidationError,
      );
    }
  });

  it("leitor não cadastra e outro workspace não alcança", async () => {
    const { workspaces, equipment, items, join } = harness();
    join("owner", "ws-a", "OWNER");
    join("viewer", "ws-a", "VIEWER");
    join("stranger", "ws-b", "OWNER");
    const input = { name: "Tripé", category: "TRIPOD" };

    await assert.rejects(
      createEquipment("viewer", "ws-a", input, workspaces, equipment),
      ForbiddenError,
    );
    await assert.rejects(
      listEquipment("stranger", "ws-a", workspaces, equipment),
      ForbiddenError,
    );
    const own = await createEquipment(
      "owner",
      "ws-a",
      input,
      workspaces,
      equipment,
    );
    await assert.rejects(
      updateEquipment("stranger", "ws-b", own.id, input, workspaces, equipment),
      NotFoundError,
    );
    await assert.rejects(
      updateEquipment("viewer", "ws-a", own.id, input, workspaces, equipment),
      ForbiddenError,
    );
    assert.equal(items.length, 1);
    assert.equal(items[0].name, "Tripé");
  });
});
