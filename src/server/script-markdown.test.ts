import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatScriptMarkdown,
  parseDuration,
  parseScriptMarkdown,
  type ScriptFile,
} from "./script-markdown.ts";
import { scriptFileName } from "./script-file.ts";
import { scriptTemplate } from "./script-template.ts";

// Mesma estrutura de um roteiro real escrito fora do app (rótulos em inglês
// misturados, quebra de linha markdown com dois espaços, seções de direção).
// O texto é inventado: o repositório é público.
const external = [
  "# OFICINA — “ONDE ESTÁ A CHAVE?”",
  "",
  "**Formato:** Vertical 9:16  ",
  "**Plataformas:** Reels e Shorts  ",
  "**Proporção:** 9:16",
  "",
  "---",
  "",
  "# PERSONAGENS",
  "",
  "## ATOR 1 — MECÂNICO",
  "Quem conserta a bicicleta.",
  "",
  "---",
  "",
  "# CENA 1 — A PORCA",
  "",
  "**Tempo:** 0:00 – 0:12  ",
  "**Purpose:** problem",
  "",
  "## Shot 1.1 — Mecânico na bancada",
  "**Enquadramento:** Plano médio  ",
  "**Tipo:** dialogue  ",
  "**Subject:** Mecânico",
  "",
  "Mecânico procura a chave.",
  "",
  "**MECÂNICO:**  ",
  "Só um minutinho.",
  "",
  "## Shot 1.2 — Tela",
  "**Tipo:** insert",
  "",
  "> CHAVE 10 MM",
  "",
  "# CENA 2 — A QUEBRA",
  "",
  "**ATOR 3 — OFF:**  ",
  "Está na gaveta.",
  "",
  "Ator 3 aponta a gaveta.",
  "",
  "# DIREÇÃO",
  "",
  "Não exagerar no começo.",
].join("\n");

describe("roteiro em markdown", () => {
  it("lê um roteiro escrito fora do app sem perder nada", () => {
    const file = parseScriptMarkdown(external);

    assert.equal(file.project.title, "OFICINA — “ONDE ESTÁ A CHAVE?”");
    assert.equal(file.project.aspectRatio, "NINE_SIXTEEN");
    assert.deepEqual(file.warnings, []);

    assert.equal(file.scenes.length, 2);
    const [first, second] = file.scenes;
    assert.equal(first.title, "A PORCA");
    assert.equal(first.estimatedDurationSeconds, 12);
    assert.equal(first.description, "Purpose: problem");
    assert.equal(first.dialogue, "MECÂNICO: Só um minutinho.");

    assert.equal(first.shots.length, 2);
    assert.deepEqual(
      {
        name: first.shots[0].name,
        shotType: first.shots[0].shotType,
        framing: first.shots[0].framing,
        subject: first.shots[0].subject,
        description: first.shots[0].description,
      },
      {
        name: "Mecânico na bancada",
        shotType: "CAMERA",
        framing: "Plano médio",
        subject: "Mecânico",
        description: "Tipo: dialogue\nMecânico procura a chave.",
      },
    );
    assert.equal(first.shots[1].shotType, "INSERT");
    assert.equal(first.shots[1].description, "CHAVE 10 MM");

    assert.equal(second.dialogue, "ATOR 3 — OFF: Está na gaveta.");
    assert.equal(second.description, "Ator 3 aponta a gaveta.");

    assert.deepEqual(file.sections, [
      { title: "", body: "Plataformas: Reels e Shorts" },
      {
        title: "PERSONAGENS",
        body: "## ATOR 1 — MECÂNICO\nQuem conserta a bicicleta.",
      },
      { title: "DIREÇÃO", body: "Não exagerar no começo." },
    ]);
  });

  it("avisa valor que não reconhece em vez de descartar", () => {
    const file = parseScriptMarkdown(
      [
        "# Vídeo",
        "**Formato:** Novela",
        "# Cena 1 — Abertura",
        "**Tipo:** Musical",
        "**Duração:** logo",
        "## Plano 1.1",
        "**Takes:** cem",
      ].join("\n"),
    );
    assert.deepEqual(
      file.warnings.map((w) => [w.line, w.kind, w.value]),
      [
        [2, "unknownValue", "Novela"],
        [4, "unknownValue", "Musical"],
        [5, "badDuration", "logo"],
        [7, "badTakes", "cem"],
      ],
    );
    assert.equal(file.scenes[0].type, "OTHER");
    assert.equal(file.scenes[0].description, "Tipo: Musical");
    assert.equal(file.scenes[0].shots[0].requiredTakes, 1);
  });

  it("exportar e importar devolve as mesmas cenas e planos", () => {
    const original: ScriptFile = {
      project: {
        title: "Horta na varanda",
        format: "SKETCH",
        aspectRatio: "NINE_SIXTEEN",
        estimatedDurationSeconds: 150,
        objective: "Plantar temperos em vasos",
        audience: null,
        product: "Kit de vasos",
        description: "Tutorial\ncom passo a passo",
      },
      script: {
        hook: "Tempero fresco sem quintal.",
        mainMessage: null,
        cta: "Comece pelo manjericão.",
        notes: "Luz natural.\nSem vento.",
      },
      scenes: [
        {
          title: "Três vasos",
          type: "HOOK",
          description: "Purpose: problem",
          dialogue: "APRESENTADORA: Olá.\nAPRESENTADORA: Vamos lá.",
          action: "Mostra os vasos",
          estimatedDurationSeconds: 15,
          cameraInstructions: "Plano médio",
          editingInstructions: null,
          continuityNotes: "Mesmo avental",
          shots: [
            {
              name: "Apresentadora na varanda",
              cameraLabel: "A",
              shotType: "CAMERA",
              framing: "Plano médio",
              angle: "Frontal",
              subject: "Apresentadora",
              movement: null,
              description: "Segurando os vasos",
              requiredTakes: 3,
              notes: null,
            },
            {
              name: null,
              cameraLabel: null,
              shotType: "INSERT",
              framing: null,
              angle: null,
              subject: null,
              movement: "Travado",
              description: null,
              requiredTakes: 1,
              notes: "Folhas em foco",
            },
          ],
        },
        {
          title: "CTA",
          type: "CTA",
          description: null,
          dialogue: null,
          action: null,
          estimatedDurationSeconds: null,
          cameraInstructions: null,
          editingInstructions: "Logo no fim",
          continuityNotes: null,
          shots: [],
        },
      ],
    };

    for (const locale of ["pt-BR", "en"] as const) {
      const parsed = parseScriptMarkdown(
        formatScriptMarkdown(original, locale),
      );
      assert.deepEqual(parsed.warnings, [], locale);
      assert.deepEqual(parsed.sections, [], locale);
      assert.deepEqual(
        {
          project: parsed.project,
          script: parsed.script,
          scenes: parsed.scenes,
        },
        original,
        locale,
      );
    }
  });

  it("o modelo para baixar é lido sem aviso nos dois idiomas", () => {
    for (const locale of ["pt-BR", "en"] as const) {
      const file = parseScriptMarkdown(scriptTemplate(locale));
      assert.deepEqual(file.warnings, [], locale);
      assert.deepEqual(file.sections, [], locale);
      assert.equal(file.project.format, "TUTORIAL");
      assert.equal(file.script.notes?.split("\n").length, 2);
      assert.deepEqual(
        file.scenes.map((scene) => [
          scene.type,
          scene.estimatedDurationSeconds,
          scene.shots.map((shot) => shot.shotType),
        ]),
        [
          ["HOOK", 15, ["CAMERA", "INSERT"]],
          ["VOICE_OVER", 20, ["BROLL"]],
        ],
        locale,
      );
      assert.equal(file.scenes[0].shots[1].requiredTakes, 2);
      assert.ok(file.scenes[1].dialogue?.includes(": "), locale);
      assert.ok(file.scenes[1].cameraInstructions, locale);
    }
  });

  it("entende duração em segundos, relógio, minutos e intervalo", () => {
    assert.equal(parseDuration("15"), 15);
    assert.equal(parseDuration("15 s"), 15);
    assert.equal(parseDuration("1:30"), 90);
    assert.equal(parseDuration("2min20s"), 140);
    assert.equal(parseDuration("1:55 – 2:15"), 20);
    assert.equal(parseDuration("amanhã"), null);
  });
});

describe("arquivo do roteiro da produção", () => {
  it("nomeia o arquivo só com letras simples", () => {
    assert.equal(
      scriptFileName({
        slug: null,
        title: 'Horta — "Três vasos na varanda"',
      }),
      "horta-tres-vasos-na-varanda.md",
    );
    assert.equal(scriptFileName({ slug: "", title: "!!!" }), "roteiro.md");
  });
});
