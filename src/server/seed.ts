import { createRecommendedChecklist } from "./checklist.ts";
import { prismaChecklistRepository } from "./checklist-prisma.ts";
import { prisma } from "./db.ts";
import { createWorkspace } from "./workspace.ts";
import { prismaWorkspaceRepository } from "./workspace-prisma.ts";

// Workspace e pessoas de demonstração (spec §59). Só para desenvolvimento:
// os e-mails são fictícios e o login continua sendo Google (AUTH).
// Rodar de novo não duplica nada.
export async function seedDemoWorkspace(
  options: { slug?: string; emailDomain?: string } = {},
) {
  const slug = options.slug ?? "acme-software";
  const domain = options.emailDomain ?? "acme.test";
  const people = [
    { key: "supervisor", name: "Supervisor", role: "OWNER" as const },
    { key: "dev1", name: "Dev 1", role: "MEMBER" as const },
    { key: "dev2", name: "Dev 2", role: "MEMBER" as const },
    { key: "dev3", name: "Dev 3", role: "MEMBER" as const },
  ];

  const users = [];
  for (const person of people) {
    users.push(
      await prisma.user.upsert({
        where: { email: `${person.key}@${domain}` },
        update: {},
        create: { email: `${person.key}@${domain}`, name: person.name },
      }),
    );
  }
  const supervisor = users[0];

  let workspace = await prisma.workspace.findUnique({ where: { slug } });
  if (!workspace) {
    workspace = (
      await createWorkspace(
        supervisor.id,
        { name: "Acme Software", slug, timezone: "America/Sao_Paulo" },
        prismaWorkspaceRepository,
      )
    ).workspace;
  }
  const workspaceId = workspace.id;

  for (const [index, person] of people.entries()) {
    await prisma.workspaceMember.upsert({
      where: {
        workspaceId_userId: { workspaceId, userId: users[index].id },
      },
      update: {},
      create: { workspaceId, userId: users[index].id, role: person.role },
    });
  }

  await createRecommendedChecklist(
    supervisor.id,
    workspaceId,
    prismaWorkspaceRepository,
    prismaChecklistRepository,
  );

  return { workspaceId, userIds: users.map((user) => user.id) };
}

const demoSlug = "dashboard-de-pedidos";

const demoScenes = [
  {
    title: "Gancho",
    type: "HOOK",
    dialogue: "Você ainda liga para saber onde está o pedido?",
  },
  {
    title: "Problema",
    type: "TALKING_HEAD",
    dialogue: "Planilha, telefone e retrabalho.",
  },
  {
    title: "Demonstração",
    type: "SCREEN_CAPTURE",
    dialogue: "Esse recurso permite acompanhar todos os pedidos em tempo real.",
  },
  {
    title: "Benefício",
    type: "TALKING_HEAD",
    dialogue: "Menos ligação, mais venda.",
  },
  { title: "Chamada", type: "CTA", dialogue: "Ative hoje no seu painel." },
] as const;

// Produção demo (spec §60) para testar a experiência de ponta a ponta.
// Identificada pelo slug no workspace: se já existe, nada é recriado.
export async function seedDemoProject(workspaceId: string, userIds: string[]) {
  const [supervisor, dev1, dev2] = userIds;
  const existing = await prisma.videoProject.findFirst({
    where: { workspaceId, slug: demoSlug },
    select: { id: true },
  });
  if (existing) return existing.id;

  return prisma.$transaction(async (tx) => {
    const project = await tx.videoProject.create({
      data: {
        workspaceId,
        createdById: supervisor,
        ownerId: supervisor,
        slug: demoSlug,
        title: "Conheça nosso novo Dashboard de Pedidos",
        objective: "Mostrar o acompanhamento de pedidos em tempo real.",
        audience: "Clientes que operam vendas online",
        product: "Dashboard de Pedidos",
        format: "FEATURE",
        status: "REVIEW",
        estimatedDurationSeconds: 60,
        lastEditVersionNumber: 1,
        members: {
          create: [
            { userId: dev1, role: "PRESENTER" },
            { userId: dev2, role: "EDITOR" },
          ],
        },
        checklistItems: {
          create: [
            { order: 1, text: "Baterias carregadas" },
            { order: 2, text: "Microfone de lapela testado" },
            { order: 3, text: "Dashboard com dados de demonstração" },
          ],
        },
      },
    });

    const scenes = [];
    for (const [index, scene] of demoScenes.entries()) {
      scenes.push(
        await tx.scene.create({
          data: {
            videoProjectId: project.id,
            order: index + 1,
            title: scene.title,
            type: scene.type,
            dialogue: scene.dialogue,
            speakerId: scene.type === "SCREEN_CAPTURE" ? null : dev1,
            status: index < 2 ? "RECORDED" : "PLANNED",
            continuityNotes:
              scene.type === "SCREEN_CAPTURE"
                ? "Deixar 2 segundos após a fala."
                : null,
          },
        }),
      );
    }
    // Duas câmeras nas falas; captura de tela na demonstração.
    for (const scene of scenes) {
      if (scene.type === "SCREEN_CAPTURE") {
        await tx.shot.create({
          data: {
            sceneId: scene.id,
            order: 1,
            shotType: "SCREEN_CAPTURE",
            name: "Captura",
            description: "Dashboard > Pedidos",
          },
        });
        continue;
      }
      await tx.shot.createMany({
        data: [
          {
            sceneId: scene.id,
            order: 1,
            cameraLabel: "Câmera A",
            framing: "Plano médio",
          },
          {
            sceneId: scene.id,
            order: 2,
            cameraLabel: "Câmera B",
            framing: "Close lateral",
          },
        ],
      });
    }
    const hookShot = await tx.shot.findFirstOrThrow({
      where: { sceneId: scenes[0].id, order: 1 },
    });
    await tx.take.createMany({
      data: [
        {
          shotId: hookShot.id,
          number: 1,
          status: "RETAKE",
          recordedById: dev2,
        },
        {
          shotId: hookShot.id,
          number: 2,
          status: "OK",
          favorite: true,
          recordedById: dev2,
        },
        { shotId: hookShot.id, number: 3, status: "OK", recordedById: dev2 },
      ],
    });

    await tx.shoot.create({
      data: {
        videoProjectId: project.id,
        title: "Estúdio",
        scheduledAt: new Date("2026-10-06T12:00:00.000Z"),
        location: "Sala 2",
      },
    });

    const version = await tx.editVersion.create({
      data: {
        videoProjectId: project.id,
        versionNumber: 1,
        title: "Primeiro corte",
        previewUrl: "https://example.com/preview/v1",
        createdById: dev2,
      },
    });
    await tx.reviewComment.createMany({
      data: [
        {
          editVersionId: version.id,
          authorId: supervisor,
          timestampSeconds: 18,
          text: "Cortar essa pausa.",
        },
        {
          editVersionId: version.id,
          authorId: supervisor,
          timestampSeconds: 32,
          text: "Usar câmera B.",
        },
        {
          editVersionId: version.id,
          authorId: dev1,
          timestampSeconds: 64,
          text: "Aumentar legenda.",
        },
      ],
    });
    await tx.publication.create({
      data: { videoProjectId: project.id, platform: "INSTAGRAM_REELS" },
    });
    return project.id;
  });
}
