import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type {
  ActivityRepository,
  ActivityWrite,
} from "./activity-repository.ts";
import { ForbiddenError, NotFoundError, ValidationError } from "./errors.ts";
import type {
  CharacterRecord,
  CharacterRepository,
} from "./character-repository.ts";
import type { ProjectRecord, ProjectRepository } from "./project-repository.ts";
import type { SceneRecord, SceneRepository } from "./scene-repository.ts";
import {
  importScript,
  previewScriptImport,
  type ScriptImportDeps,
} from "./script-import.ts";
import type {
  ScriptImportRepository,
  ScriptImportWrite,
} from "./script-import-repository.ts";
import type { ScriptRecord, ScriptRepository } from "./script-repository.ts";
import type {
  MembershipRecord,
  WorkspaceRepository,
  WorkspaceRole,
} from "./workspace-repository.ts";

const file = [
  "# Horta",
  "**Duração:** 20",
  "**Gancho:** Tempero fresco.",
  "# Personagens",
  "Apresentadora.",
  "# Cena 1 — Vasos",
  "**Tipo:** Gancho",
  "**Personagens:** apresentadora, Jardineiro",
  "**Duração:** 15",
  "## Plano 1.1 — Mudas",
  "**Tipo:** Inserto",
  "## Plano 1.2",
  "# Cena 2 — Rega",
  "**Duração:** 10",
].join("\n");

// Fakes com só o que o serviço usa; o resto do contrato não é chamado.
function harness(options: { role?: WorkspaceRole; scenes?: number } = {}) {
  const memberships: MembershipRecord[] = [
    {
      id: "m1",
      workspaceId: "ws-a",
      userId: "u1",
      role: options.role ?? "MEMBER",
      createdAt: new Date(),
    },
  ];
  const project = {
    id: "p-a",
    workspaceId: "ws-a",
    estimatedDurationSeconds: null,
  } as ProjectRecord;
  const script: ScriptRecord = {
    id: "s1",
    videoProjectId: "p-a",
    hook: "Gancho já escrito",
    mainMessage: null,
    cta: null,
    notes: "Nota antiga",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const existing = Array.from(
    { length: options.scenes ?? 0 },
    (_, index) =>
      ({
        id: `old-${index}`,
        videoProjectId: "p-a",
        order: index + 1,
        estimatedDurationSeconds: 5,
      }) as SceneRecord,
  );
  const writes: ScriptImportWrite[] = [];
  const activities: ActivityWrite[] = [];

  const deps: ScriptImportDeps = {
    workspaces: {
      async findMembership(userId: string, workspaceId: string) {
        return (
          memberships.find(
            (m) => m.userId === userId && m.workspaceId === workspaceId,
          ) ?? null
        );
      },
    } as unknown as WorkspaceRepository,
    projects: {
      async find(workspaceId: string, projectId: string) {
        return workspaceId === project.workspaceId && projectId === project.id
          ? project
          : null;
      },
    } as unknown as ProjectRepository,
    scenes: {
      async list(workspaceId: string, projectId: string) {
        return workspaceId === "ws-a" && projectId === "p-a" ? existing : [];
      },
    } as unknown as SceneRepository,
    scripts: {
      async find() {
        return script;
      },
    } as unknown as ScriptRepository,
    imports: {
      async importScript(workspaceId, projectId, input) {
        if (workspaceId !== "ws-a" || projectId !== "p-a") return null;
        writes.push(input);
        return {
          sceneIds: input.scenes.map((_, index) => `new-${index}`),
          shots: input.scenes.reduce((sum, s) => sum + s.shots.length, 0),
        };
      },
    } satisfies ScriptImportRepository,
    characters: {
      async list() {
        return [
          { id: "c1", videoProjectId: "p-a", name: "Apresentadora" },
        ] as CharacterRecord[];
      },
    } as unknown as CharacterRepository,
    activities: {
      async record(input: ActivityWrite) {
        activities.push(input);
      },
    } as unknown as ActivityRepository,
  };
  return { deps, writes, activities, project };
}

describe("importação de roteiro", () => {
  it("mostra a prévia sem gravar nada", async () => {
    const { deps, writes, project } = harness({ scenes: 2 });
    project.estimatedDurationSeconds = 30;
    const preview = await previewScriptImport("u1", "ws-a", "p-a", file, deps);

    assert.equal(writes.length, 0);
    assert.deepEqual(
      preview.scenes.map((scene) => [scene.title, scene.shots.length]),
      [
        ["Vasos", 2],
        ["Rega", 0],
      ],
    );
    assert.equal(preview.shotCount, 2);
    assert.equal(preview.existingScenes, 2);
    // 2 cenas antigas de 5 s + 15 s + 10 s, contra a meta da produção.
    assert.equal(preview.totalSeconds, 35);
    assert.equal(preview.targetSeconds, 30);
    assert.deepEqual(preview.filledScriptFields, ["notes"]);
    assert.deepEqual(preview.sectionTitles, ["Personagens"]);
    assert.deepEqual(preview.problems, []);
    assert.deepEqual(preview.newCharacters, ["Jardineiro"]);
  });

  it("usa a duração do arquivo quando a produção não tem", async () => {
    const { deps } = harness();
    const preview = await previewScriptImport("u1", "ws-a", "p-a", file, deps);
    assert.equal(preview.targetSeconds, 20);
  });

  it("grava cenas e planos em ordem, sem apagar o roteiro existente", async () => {
    const { deps, writes, activities } = harness();
    await importScript(
      "u1",
      "ws-a",
      "p-a",
      file,
      { appendToExisting: false },
      deps,
    );

    assert.equal(writes.length, 1);
    const [write] = writes;
    // "apresentadora" já existe com outra grafia: liga ao existente.
    assert.deepEqual(write.characters, ["Jardineiro"]);
    assert.deepEqual(write.scenes[0].characterNames, [
      "Apresentadora",
      "Jardineiro",
    ]);
    assert.equal(write.script.hook, "Gancho já escrito");
    assert.equal(
      write.script.notes,
      "Nota antiga\n\nPersonagens\nApresentadora.",
    );
    assert.deepEqual(
      write.scenes.map((scene) => [
        scene.title,
        scene.type,
        scene.status,
        scene.speakerId,
        scene.shots.map((shot) => [shot.name, shot.shotType, shot.status]),
      ]),
      [
        [
          "Vasos",
          "HOOK",
          "PLANNED",
          null,
          [
            ["Mudas", "INSERT", "PLANNED"],
            [null, "CAMERA", "PLANNED"],
          ],
        ],
        ["Rega", "OTHER", "PLANNED", null, []],
      ],
    );
    assert.deepEqual(
      activities.map((a) => [a.action, a.videoProjectId, a.metadata]),
      [["SCRIPT_IMPORTED", "p-a", { scenes: 2, shots: 2 }]],
    );
  });

  it("pede confirmação quando a produção já tem cenas", async () => {
    const { deps, writes } = harness({ scenes: 1 });
    await assert.rejects(
      importScript(
        "u1",
        "ws-a",
        "p-a",
        file,
        { appendToExisting: false },
        deps,
      ),
      (error) =>
        error instanceof ValidationError && "appendToExisting" in error.fields,
    );
    assert.equal(writes.length, 0);
    await importScript(
      "u1",
      "ws-a",
      "p-a",
      file,
      { appendToExisting: true },
      deps,
    );
    assert.equal(writes.length, 1);
  });

  it("não grava arquivo com campo inválido e aponta onde está", async () => {
    const { deps, writes } = harness();
    const broken = `# Cena 1 — ${"x".repeat(121)}\n## Plano 1.1\n**Assunto:** ${"y".repeat(121)}`;
    const preview = await previewScriptImport(
      "u1",
      "ws-a",
      "p-a",
      broken,
      deps,
    );
    assert.deepEqual(
      preview.problems.map((p) => [p.scene, p.shot, Object.keys(p.fields)]),
      [
        [1, null, ["title"]],
        [1, 1, ["subject"]],
      ],
    );
    await assert.rejects(
      importScript(
        "u1",
        "ws-a",
        "p-a",
        broken,
        { appendToExisting: true },
        deps,
      ),
      ValidationError,
    );
    assert.equal(writes.length, 0);
  });

  it("recusa arquivo sem cena", async () => {
    const { deps } = harness();
    await assert.rejects(
      previewScriptImport("u1", "ws-a", "p-a", "# Só título", deps),
      (error) => error instanceof ValidationError && "text" in error.fields,
    );
  });

  it("leitor não importa e outro workspace não enxerga a produção", async () => {
    const viewer = harness({ role: "VIEWER" });
    await assert.rejects(
      importScript(
        "u1",
        "ws-a",
        "p-a",
        file,
        { appendToExisting: true },
        viewer.deps,
      ),
      ForbiddenError,
    );
    assert.equal(viewer.writes.length, 0);

    const member = harness();
    await assert.rejects(
      previewScriptImport("u1", "ws-b", "p-a", file, member.deps),
      ForbiddenError,
    );
    await assert.rejects(
      previewScriptImport("u1", "ws-a", "p-outra", file, member.deps),
      NotFoundError,
    );
  });
});
