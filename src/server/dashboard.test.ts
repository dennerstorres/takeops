import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { CalendarEvent } from "./calendar.ts";
import { buildDashboard } from "./dashboard.ts";
import type { IdeaRecord } from "./idea-repository.ts";
import type { VideoProjectStatus } from "./project-labels.ts";
import type { ProjectRecord } from "./project-repository.ts";
import { testTranslator } from "../i18n/test-translator.ts";

const t = testTranslator();

function project(
  id: string,
  status: VideoProjectStatus,
  updatedAt = "2026-09-01",
): ProjectRecord {
  return {
    id,
    workspaceId: "ws-a",
    title: `Produção ${id}`,
    slug: null,
    description: null,
    objective: null,
    audience: null,
    product: null,
    format: "DEMO",
    aspectRatio: "NINE_SIXTEEN",
    estimatedDurationSeconds: null,
    status,
    priority: "NORMAL",
    thumbnailUrl: null,
    ownerId: "owner",
    plannedShootDate: null,
    plannedPublishDate: null,
    sourceIdeaId: null,
    createdById: "owner",
    createdAt: new Date("2026-08-01"),
    updatedAt: new Date(updatedAt),
  };
}

function idea(
  id: string,
  status: IdeaRecord["status"],
  createdAt: string,
): IdeaRecord {
  return {
    id,
    workspaceId: "ws-a",
    title: `Ideia ${id}`,
    description: null,
    format: null,
    objective: null,
    product: null,
    audience: null,
    referenceUrl: null,
    notes: null,
    authorId: "owner",
    authorName: "Dono",
    status,
    createdAt: new Date(createdAt),
    updatedAt: new Date(createdAt),
  };
}

function shoot(
  key: string,
  projectId: string,
  canceled = false,
): CalendarEvent {
  return {
    key,
    kind: "SHOOT",
    projectId,
    projectTitle: `Produção ${projectId}`,
    label: "Gravação",
    href: `/producoes/${projectId}/gravacao/${key}`,
    at: new Date("2026-10-01T12:00:00Z"),
    day: null,
    canceled,
  };
}

describe("dashboard", () => {
  it("separa andamento, revisão, aprovação, ideias e contadores", () => {
    const data = buildDashboard({
      projects: [
        project("idea", "IDEA"),
        project("pre", "PRE_PRODUCTION", "2026-09-02"),
        project("rec", "RECORDING", "2026-09-05"),
        project("rev", "REVIEW", "2026-09-03"),
        project("pub", "PUBLISHED"),
        project("arq", "ARCHIVED"),
      ],
      ideas: [
        idea("velha", "NEW", "2026-09-01"),
        idea("nova", "UNDER_REVIEW", "2026-09-10"),
        idea("virou", "CONVERTED", "2026-09-20"),
        idea("fora", "DISCARDED", "2026-09-21"),
      ],
      shoots: [
        shoot("s1", "rec"),
        shoot("s2", "rec", true),
        { ...shoot("p1", "pre"), kind: "PLANNED_PUBLISH" },
      ],
      participants: [
        {
          videoProjectId: "rec",
          userId: "camera",
          name: "Câmera",
          email: null,
        },
      ],
      people: [{ userId: "owner", name: "Dono", email: null }],
      pendingApprovalProjectIds: ["rev"],
      t,
    });

    assert.deepEqual(
      data.inProgress.map((card) => card.id),
      ["rec", "rev", "pre"],
    );
    assert.equal(data.inProgress[0].nextAction, "Registrar os takes");
    assert.equal(data.inProgress[0].status, "Gravação");
    assert.deepEqual(data.inProgress[0].people, ["Dono", "Câmera"]);
    assert.deepEqual(
      data.review.map((card) => card.id),
      ["rev"],
    );
    assert.deepEqual(
      data.approval.map((card) => card.id),
      ["rev"],
    );
    assert.deepEqual(
      data.shoots.map((event) => event.key),
      ["s1"],
    );
    assert.deepEqual(data.shoots[0].people, ["Dono", "Câmera"]);
    assert.deepEqual(
      data.ideas.map((item) => item.id),
      ["nova", "velha"],
    );
    assert.deepEqual(
      Object.fromEntries(data.counters.map((item) => [item.label, item.value])),
      {
        Ideias: 2,
        "Pré-produção": 1,
        Gravação: 1,
        Edição: 0,
        Revisão: 1,
        Publicados: 1,
      },
    );
  });

  it("aprovação pendente de produção de fora da lista não aparece", () => {
    const data = buildDashboard({
      projects: [project("a", "EDITING")],
      ideas: [],
      shoots: [],
      participants: [],
      people: [],
      pendingApprovalProjectIds: ["outra"],
      t,
    });
    assert.deepEqual(data.approval, []);
  });
});
