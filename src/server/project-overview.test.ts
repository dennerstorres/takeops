import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildProjectOverview,
  calendarDate,
  pipelineProgress,
  productionTabs,
} from "./project-overview.ts";
import type { ProjectRecord } from "./project-repository.ts";
import { testTranslator } from "../i18n/test-translator.ts";

const t = testTranslator();

function project(patch: Partial<ProjectRecord> = {}): ProjectRecord {
  return {
    id: "proj-1",
    workspaceId: "ws-a",
    title: "Reels do produto",
    slug: null,
    description: null,
    objective: "Explicar",
    audience: "Time interno",
    product: "Takeops",
    format: "DEMO",
    aspectRatio: "NINE_SIXTEEN",
    estimatedDurationSeconds: 45,
    status: "IDEA",
    priority: "HIGH",
    thumbnailUrl: "https://cdn.example/thumb.jpg",
    ownerId: "user-1",
    plannedShootDate: new Date("2026-10-02T00:00:00.000Z"),
    plannedPublishDate: null,
    sourceIdeaId: "idea-1",
    createdById: "user-1",
    createdAt: new Date("2026-09-28T00:00:00.000Z"),
    updatedAt: new Date("2026-09-28T00:00:00.000Z"),
    ...patch,
  };
}

describe("visão geral", () => {
  it("monta os campos da página e o progresso da etapa", () => {
    const overview = buildProjectOverview({
      project: project(),
      ownerName: "Ana",
      t,
      participants: [
        { name: "Bia", email: null, role: "CAMERA" },
        { name: null, email: "caio@example.com", role: "EDITOR" },
      ],
    });

    assert.equal(overview.title, "Reels do produto");
    assert.equal(overview.objective, "Explicar");
    assert.equal(overview.product, "Takeops");
    assert.equal(overview.audience, "Time interno");
    assert.equal(overview.format, "Demonstração");
    assert.equal(overview.aspectRatio, "9:16");
    assert.equal(overview.duration, "45 s");
    assert.equal(overview.status, "Ideia");
    assert.equal(overview.progress, "1 de 10");
    assert.equal(overview.priority, "Alta");
    assert.equal(overview.shootDate, "02/10/2026");
    assert.equal(overview.publishDate, null);
    assert.equal(overview.ownerName, "Ana");
    assert.deepEqual(overview.participants, [
      { name: "Bia", role: "Câmera" },
      { name: "caio@example.com", role: "Editor" },
    ]);
    assert.deepEqual(overview.links, [
      { label: "Thumbnail", href: "https://cdn.example/thumb.jpg" },
      { label: "Ideia de origem", href: "/ideias/idea-1" },
    ]);
    assert.equal(pipelineProgress(t, "PUBLISHED").step, 10);
    assert.equal(pipelineProgress(t, "ARCHIVED").step, null);
    assert.equal(calendarDate(null), null);
    assert.equal(productionTabs[0], "Visão Geral");
    assert.equal(productionTabs.includes("Roteiro"), true);
  });
});
