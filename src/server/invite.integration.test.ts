import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";
import { ForbiddenError } from "./errors.ts";
import {
  acceptInviteToken,
  claimEmailInvites,
  createInvite,
  listInvites,
} from "./invite.ts";
import { listTeam } from "./team.ts";
import { createWorkspace } from "./workspace.ts";

const databaseReady = (process.env.DATABASE_URL ?? "").startsWith("postgres");

describe(
  "convite no banco",
  { skip: databaseReady ? false : "sem Postgres" },
  () => {
    it("aceita pelo e-mail da conta e não vaza para outro workspace", async () => {
      const { prisma } = await import("./db.ts");
      const { prismaInviteRepository } = await import("./invite-prisma.ts");
      const { prismaWorkspaceRepository } =
        await import("./workspace-prisma.ts");
      const suffix = randomUUID();
      const owner = await prisma.user.create({
        data: { email: `dono-${suffix}@example.com`, name: "Dono" },
      });
      const guest = await prisma.user.create({
        data: { email: `convidado-${suffix}@example.com`, name: "Convidado" },
      });
      const stranger = await prisma.user.create({
        data: { email: `outro-${suffix}@example.com`, name: "Outro" },
      });
      let workspaceId = "";
      let foreignId = "";

      try {
        const workspace = await createWorkspace(
          owner.id,
          { name: `Convite ${suffix}`, slug: `convite-${suffix}` },
          prismaWorkspaceRepository,
        );
        const foreign = await createWorkspace(
          stranger.id,
          { name: `Fora ${suffix}`, slug: `fora-${suffix}` },
          prismaWorkspaceRepository,
        );
        workspaceId = workspace.workspace.id;
        foreignId = foreign.workspace.id;

        const created = await createInvite(
          owner.id,
          workspaceId,
          { email: `Convidado-${suffix}@example.com`, role: "MEMBER" },
          prismaWorkspaceRepository,
          prismaInviteRepository,
        );

        await assert.rejects(
          () =>
            acceptInviteToken(
              stranger.id,
              created.token,
              prismaInviteRepository,
            ),
          (error: unknown) => error instanceof ForbiddenError,
        );
        await assert.rejects(
          () =>
            listInvites(
              stranger.id,
              workspaceId,
              prismaWorkspaceRepository,
              prismaInviteRepository,
            ),
          (error: unknown) => error instanceof ForbiddenError,
        );

        await acceptInviteToken(
          guest.id,
          created.token,
          prismaInviteRepository,
        );
        const team = await listTeam(
          guest.id,
          workspaceId,
          prismaWorkspaceRepository,
        );
        assert.equal(
          team.find((person) => person.userId === guest.id)?.role,
          "MEMBER",
        );
        assert.equal(
          team.some((person) => person.userId === stranger.id),
          false,
        );

        const pending = await createInvite(
          owner.id,
          workspaceId,
          { email: `fila-${suffix}@example.com`, role: "VIEWER" },
          prismaWorkspaceRepository,
          prismaInviteRepository,
        );
        const queued = await prisma.user.create({
          data: { email: `fila-${suffix}@example.com`, name: "Fila" },
        });
        const claimed = await claimEmailInvites(
          queued.id,
          prismaInviteRepository,
        );
        assert.equal(claimed[0]?.role, "VIEWER");
        assert.equal(claimed[0]?.id, pending.invite.id);
        await prisma.user.delete({ where: { id: queued.id } });
      } finally {
        if (workspaceId) {
          await prisma.workspace.deleteMany({ where: { id: workspaceId } });
        }
        if (foreignId) {
          await prisma.workspace.deleteMany({ where: { id: foreignId } });
        }
        await prisma.user.deleteMany({
          where: { id: { in: [owner.id, guest.id, stranger.id] } },
        });
      }
    });
  },
);
