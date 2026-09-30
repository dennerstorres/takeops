import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";
import { approveVersion, requestApproval, requestChanges } from "./approval.ts";
import { createChecklistTemplate } from "./checklist.ts";
import { saveEditingInfo } from "./editing.ts";
import { createEditVersion } from "./edit-version.ts";
import { createIdea } from "./idea.ts";
import {
  createPublication,
  recordPublicationOutcome,
  schedulePublication,
} from "./publication.ts";
import {
  changeVideoProjectStatus,
  convertIdeaToProject,
  getProject,
} from "./project.ts";
import { createReviewComment } from "./review.ts";
import { createScene } from "./scene.ts";
import { saveScript } from "./script.ts";
import { createShoot } from "./shoot.ts";
import {
  instantiateShootChecklist,
  setShootChecklistItem,
} from "./shoot-checklist.ts";
import { createShot } from "./shot.ts";
import { registerTake, setFavoriteTake } from "./take.ts";

const databaseReady = (process.env.DATABASE_URL ?? "").startsWith("postgres");

// MVP-001: o fluxo principal (TESTING.md §2) de ponta a ponta pelos serviços,
// no banco real, como a UI chama. Não passa pelo navegador nem pelo login.
describe(
  "fluxo completo do MVP",
  { skip: databaseReady ? false : "sem Postgres" },
  () => {
    it("ideia → produção → gravação → edição → aprovação → publicação", async () => {
      const { prisma } = await import("./db.ts");
      const repos = {
        workspaces: (await import("./workspace-prisma.ts"))
          .prismaWorkspaceRepository,
        projects: (await import("./project-prisma.ts")).prismaProjectRepository,
        ideas: (await import("./idea-prisma.ts")).prismaIdeaRepository,
        scripts: (await import("./script-prisma.ts")).prismaScriptRepository,
        scenes: (await import("./scene-prisma.ts")).prismaSceneRepository,
        shots: (await import("./shot-prisma.ts")).prismaShotRepository,
        shoots: (await import("./shoot-prisma.ts")).prismaShootRepository,
        checklists: (await import("./checklist-prisma.ts"))
          .prismaChecklistRepository,
        shootChecklist: (await import("./shoot-checklist-prisma.ts"))
          .prismaShootChecklistRepository,
        takes: (await import("./take-prisma.ts")).prismaTakeRepository,
        editing: (await import("./editing-prisma.ts")).prismaEditingRepository,
        versions: (await import("./edit-version-prisma.ts"))
          .prismaEditVersionRepository,
        reviews: (await import("./review-prisma.ts")).prismaReviewRepository,
        approvals: (await import("./approval-prisma.ts"))
          .prismaApprovalRepository,
        participants: (await import("./participant-prisma.ts"))
          .prismaParticipantRepository,
        publications: (await import("./publication-prisma.ts"))
          .prismaPublicationRepository,
        activities: (await import("./activity-prisma.ts"))
          .prismaActivityRepository,
        notifications: (await import("./notification-prisma.ts"))
          .prismaNotificationRepository,
      };
      const { workspaces, projects } = repos;

      const suffix = randomUUID();
      const [owner, editor] = await Promise.all(
        ["dono", "editor"].map((name) =>
          prisma.user.create({
            data: { email: `mvp-${name}-${suffix}@example.com`, name },
          }),
        ),
      );
      const workspace = await prisma.workspace.create({
        data: {
          name: "MVP",
          slug: `mvp-${suffix}`,
          members: {
            create: [
              { userId: owner.id, role: "OWNER" },
              { userId: editor.id, role: "MEMBER" },
            ],
          },
        },
      });
      const ws = workspace.id;
      const stage = (projectId: string, status: string) =>
        changeVideoProjectStatus(
          owner.id,
          ws,
          projectId,
          { status },
          workspaces,
          projects,
          repos.activities,
        );

      try {
        // Ideia → produção
        const idea = await createIdea(
          owner.id,
          ws,
          { title: "Lançamento do app", format: "DEMO" },
          workspaces,
          repos.ideas,
        );
        const project = await convertIdeaToProject(
          owner.id,
          ws,
          idea.id,
          workspaces,
          projects,
        );
        assert.equal(project.sourceIdeaId, idea.id);
        await stage(project.id, "PRE_PRODUCTION");

        // Roteiro, cena e plano
        await saveScript(
          owner.id,
          ws,
          project.id,
          { hook: "Você perde takes?", mainMessage: "Organize", cta: "Teste" },
          workspaces,
          projects,
          repos.scripts,
        );
        await stage(project.id, "SCRIPTING");
        const scene = await createScene(
          owner.id,
          ws,
          project.id,
          { title: "Abertura", type: "HOOK", dialogue: "Olá", status: "READY" },
          workspaces,
          projects,
          repos.scenes,
        );
        const shot = await createShot(
          owner.id,
          ws,
          project.id,
          scene.id,
          { name: "Plano frontal", framing: "Close", requiredTakes: 2 },
          repos,
        );
        await stage(project.id, "READY_TO_RECORD");

        // Gravação com checklist
        const shoot = await createShoot(
          owner.id,
          ws,
          project.id,
          { title: "Estúdio", scheduledAt: "2026-10-07T09:00:00-03:00" },
          repos,
        );
        const template = await createChecklistTemplate(
          owner.id,
          ws,
          { name: "Preparação" },
          workspaces,
          repos.checklists,
          ["Carregar baterias", "Testar microfone"],
        );
        const items = await instantiateShootChecklist(
          owner.id,
          ws,
          project.id,
          shoot.id,
          { templateId: template.id },
          repos,
        );
        assert.equal(items.length, 2);
        for (const item of items) {
          await setShootChecklistItem(
            owner.id,
            ws,
            project.id,
            shoot.id,
            item.id,
            { completed: "on" },
            repos,
          );
        }
        assert.equal(
          await prisma.shootChecklistItem.count({
            where: { shootId: shoot.id, completed: false },
          }),
          0,
        );

        // Modo Gravação: takes
        await stage(project.id, "RECORDING");
        const target = {
          projectId: project.id,
          sceneId: scene.id,
          shotId: shot.id,
        };
        const retake = await registerTake(
          owner.id,
          ws,
          target,
          { status: "RETAKE", notes: "Tremeu" },
          repos,
        );
        const good = await registerTake(
          owner.id,
          ws,
          target,
          { status: "OK" },
          repos,
        );
        assert.deepEqual([retake.number, good.number], [1, 2]);
        await setFavoriteTake(owner.id, ws, target, good.id, repos);

        // Edição, V1, revisão e pedido de alteração
        await stage(project.id, "EDITING");
        await saveEditingInfo(
          owner.id,
          ws,
          project.id,
          { editorId: editor.id, software: "DaVinci Resolve" },
          repos,
        );
        const v1 = await createEditVersion(
          editor.id,
          ws,
          project.id,
          { title: "Primeiro corte", previewUrl: "https://vimeo.com/1" },
          repos,
        );
        await stage(project.id, "REVIEW");
        await createReviewComment(
          owner.id,
          ws,
          { projectId: project.id, versionId: v1.id },
          { text: "Aumentar a legenda", timestamp: "00:04" },
          repos,
        );
        const firstRequest = await requestApproval(
          editor.id,
          ws,
          project.id,
          v1.id,
          repos,
        );
        await requestChanges(
          owner.id,
          ws,
          project.id,
          firstRequest.id,
          { notes: "Legenda maior" },
          repos,
        );
        assert.equal(
          (await getProject(owner.id, ws, project.id, workspaces, projects))
            .status,
          "EDITING",
        );

        // V2 aprovada
        const v2 = await createEditVersion(
          editor.id,
          ws,
          project.id,
          { title: "Corte final", previewUrl: "https://vimeo.com/2" },
          repos,
        );
        assert.equal(v2.versionNumber, 2);
        await stage(project.id, "REVIEW");
        const secondRequest = await requestApproval(
          editor.id,
          ws,
          project.id,
          v2.id,
          repos,
        );
        const approved = await approveVersion(
          owner.id,
          ws,
          project.id,
          secondRequest.id,
          { notes: "" },
          repos,
        );
        assert.equal(approved.status, "APPROVED");
        assert.equal(
          (await getProject(owner.id, ws, project.id, workspaces, projects))
            .status,
          "APPROVED",
        );

        // Publicação agendada e registrada
        const publication = await createPublication(
          owner.id,
          ws,
          project.id,
          { platform: "INSTAGRAM_REELS", caption: "Chegou" },
          repos,
        );
        await schedulePublication(
          owner.id,
          ws,
          project.id,
          publication.id,
          { scheduledAt: "2026-10-10T18:30:00-03:00" },
          repos,
        );
        await stage(project.id, "SCHEDULED");
        const published = await recordPublicationOutcome(
          owner.id,
          ws,
          project.id,
          publication.id,
          { status: "PUBLISHED", url: "https://instagram.com/reel/abc" },
          repos,
        );
        assert.equal(published.status, "PUBLISHED");
        await stage(project.id, "PUBLISHED");

        // Rastro do fluxo: atividade e avisos para quem acompanha.
        const actions = (
          await prisma.activityLog.findMany({
            where: { videoProjectId: project.id },
            select: { action: true },
          })
        ).map((row) => row.action);
        for (const action of [
          "PROJECT_STATUS_CHANGED",
          "VERSION_CREATED",
          "APPROVAL_REQUESTED",
          "CHANGES_REQUESTED",
          "VERSION_APPROVED",
          "PUBLICATION_RECORDED",
        ]) {
          assert.ok(actions.includes(action), `sem atividade ${action}`);
        }
        assert.ok(
          (await prisma.notification.count({
            where: { workspaceId: ws, userId: editor.id },
          })) > 0,
        );
      } finally {
        await prisma.workspace.delete({ where: { id: ws } });
        await prisma.user.deleteMany({
          where: { id: { in: [owner.id, editor.id] } },
        });
      }
    });
  },
);
