import en from "../../messages/en.json" with { type: "json" };
import ptBR from "../../messages/pt-BR.json" with { type: "json" };
import type { Locale } from "../i18n/locale.ts";
import { ideaFormats, type IdeaFormat } from "./idea-labels.ts";
import { aspectRatios, type AspectRatio } from "./project-labels.ts";
import { sceneTypes, type SceneType } from "./scene-labels.ts";
import { shotTypes, type ShotType } from "./shot-labels.ts";

// Formato markdown do roteiro (SPEC §18.1). Quem escreve o roteiro fora do
// app usa o mesmo arquivo que o app exporta, então o parser aceita os rótulos
// dos dois idiomas e os que já aparecem em roteiros reais (Subject, Purpose).

export type ScriptFileShot = {
  name: string | null;
  cameraLabel: string | null;
  shotType: ShotType;
  framing: string | null;
  angle: string | null;
  subject: string | null;
  movement: string | null;
  description: string | null;
  requiredTakes: number;
  notes: string | null;
};

export type ScriptFileScene = {
  title: string;
  type: SceneType;
  description: string | null;
  dialogue: string | null;
  action: string | null;
  estimatedDurationSeconds: number | null;
  cameraInstructions: string | null;
  editingInstructions: string | null;
  continuityNotes: string | null;
  shots: ScriptFileShot[];
};

export type ScriptFileProject = {
  title: string | null;
  format: IdeaFormat | null;
  aspectRatio: AspectRatio | null;
  estimatedDurationSeconds: number | null;
  objective: string | null;
  audience: string | null;
  product: string | null;
  description: string | null;
};

export type ScriptFileText = {
  hook: string | null;
  mainMessage: string | null;
  cta: string | null;
  notes: string | null;
};

export type ScriptFile = {
  project: ScriptFileProject;
  script: ScriptFileText;
  scenes: ScriptFileScene[];
};

// Trecho que não virou campo. Quem importa decide o destino (as notas do
// roteiro), para nada sumir em silêncio.
export type ScriptFileSection = { title: string; body: string };

export type ScriptFileWarning = {
  line: number;
  kind: "unknownValue" | "badDuration" | "badTakes";
  field: string;
  value: string;
};

export type ParsedScriptFile = ScriptFile & {
  sections: ScriptFileSection[];
  warnings: ScriptFileWarning[];
};

type Labels = {
  scene: string;
  shot: string;
  project: Record<Exclude<keyof ScriptFileProject, "title">, string>;
  script: Record<keyof ScriptFileText, string>;
  sceneFields: Record<SceneField, string>;
  shotFields: Record<ShotField, string>;
};

type SceneField =
  | "type"
  | "duration"
  | "purpose"
  | "action"
  | "cameraInstructions"
  | "editingInstructions"
  | "continuityNotes"
  | "description"
  | "dialogue";

type ShotField =
  | "shotType"
  | "framing"
  | "angle"
  | "subject"
  | "movement"
  | "cameraLabel"
  | "requiredTakes"
  | "purpose"
  | "description"
  | "notes";

const labels: Record<Locale, Labels> = {
  "pt-BR": {
    scene: "Cena",
    shot: "Plano",
    project: {
      format: "Formato",
      aspectRatio: "Proporção",
      estimatedDurationSeconds: "Duração",
      objective: "Objetivo",
      audience: "Público",
      product: "Produto",
      description: "Descrição",
    },
    script: {
      hook: "Gancho",
      mainMessage: "Mensagem principal",
      cta: "Chamada para ação",
      notes: "Notas",
    },
    sceneFields: {
      type: "Tipo",
      duration: "Duração",
      purpose: "Propósito",
      action: "Ação",
      cameraInstructions: "Câmera",
      editingInstructions: "Edição",
      continuityNotes: "Continuidade",
      description: "Descrição",
      dialogue: "Fala",
    },
    shotFields: {
      shotType: "Tipo",
      framing: "Enquadramento",
      angle: "Ângulo",
      subject: "Assunto",
      movement: "Movimento",
      cameraLabel: "Câmera",
      requiredTakes: "Takes",
      purpose: "Propósito",
      description: "Descrição",
      notes: "Notas",
    },
  },
  en: {
    scene: "Scene",
    shot: "Shot",
    project: {
      format: "Format",
      aspectRatio: "Aspect ratio",
      estimatedDurationSeconds: "Duration",
      objective: "Objective",
      audience: "Audience",
      product: "Product",
      description: "Description",
    },
    script: {
      hook: "Hook",
      mainMessage: "Main message",
      cta: "Call to action",
      notes: "Notes",
    },
    sceneFields: {
      type: "Type",
      duration: "Duration",
      purpose: "Purpose",
      action: "Action",
      cameraInstructions: "Camera",
      editingInstructions: "Editing",
      continuityNotes: "Continuity",
      description: "Description",
      dialogue: "Dialogue",
    },
    shotFields: {
      shotType: "Type",
      framing: "Framing",
      angle: "Angle",
      subject: "Subject",
      movement: "Movement",
      cameraLabel: "Camera",
      requiredTakes: "Takes",
      purpose: "Purpose",
      description: "Description",
      notes: "Notes",
    },
  },
};

const messages = { "pt-BR": ptBR, en } as const;

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function aliasMap<K extends string>(
  groups: readonly Record<K, string>[],
  extra: Record<string, K> = {},
) {
  const map = new Map<string, K>();
  for (const group of groups) {
    for (const [key, label] of Object.entries(group) as [K, string][]) {
      map.set(normalize(label), key);
    }
  }
  for (const [alias, key] of Object.entries(extra)) map.set(alias, key);
  return map;
}

const allLabels = Object.values(labels);
const projectKeys = aliasMap(allLabels.map((l) => l.project));
const scriptKeys = aliasMap(
  allLabels.map((l) => l.script),
  {
    chamada: "cta",
    cta: "cta",
  },
);
const sceneKeys = aliasMap(
  allLabels.map((l) => l.sceneFields),
  {
    tempo: "duration",
    time: "duration",
    falas: "dialogue",
    "instrucoes de camera": "cameraInstructions",
    "instrucoes de edicao": "editingInstructions",
  },
);
const shotKeys = aliasMap(
  allLabels.map((l) => l.shotFields),
  {
    enquadramento: "framing",
  },
);

// Rótulo do enum nos dois idiomas, o próprio nome do enum e apelidos. O
// apelido não é exato: o valor original vai para a descrição.
function enumMap<T extends string>(
  values: readonly T[],
  pick: (m: typeof ptBR) => Record<string, string>,
) {
  const map = new Map<string, T>();
  for (const value of values) map.set(normalize(value), value);
  for (const m of Object.values(messages)) {
    const group = pick(m as typeof ptBR);
    for (const value of values) map.set(normalize(group[value]), value);
  }
  return map;
}

const formatValues = enumMap(ideaFormats, (m) => m.enums.ideaFormat);
const aspectValues = enumMap(aspectRatios, (m) => m.enums.aspectRatio);
const sceneTypeValues = enumMap(sceneTypes, (m) => m.enums.sceneType);
const shotTypeValues = enumMap(shotTypes, (m) => m.enums.shotType);

const sceneTypeAliases: Record<string, SceneType> = {
  "talking head": "TALKING_HEAD",
  "voice over": "VOICE_OVER",
  off: "VOICE_OVER",
  broll: "BROLL",
  screen: "SCREEN_CAPTURE",
};

const shotTypeAliases: Record<string, ShotType> = {
  dialogue: "CAMERA",
  dialogo: "CAMERA",
  reaction: "CAMERA",
  reacao: "CAMERA",
  tela: "SCREEN_CAPTURE",
  screen: "SCREEN_CAPTURE",
  broll: "BROLL",
  off: "VOICE_ONLY",
  voz: "VOICE_ONLY",
};

export function parseDuration(text: string): number | null {
  const value = text.trim();
  const range = value.match(/(\d+):(\d{2})\s*[–—-]\s*(\d+):(\d{2})/);
  if (range) {
    const start = Number(range[1]) * 60 + Number(range[2]);
    const end = Number(range[3]) * 60 + Number(range[4]);
    return end > start ? end - start : null;
  }
  const clock = value.match(/^(\d+):(\d{2})$/);
  if (clock) return Number(clock[1]) * 60 + Number(clock[2]);
  const minutes = value.match(/^(\d+)\s*min(?:\s*(\d+)\s*s)?$/i);
  if (minutes) return Number(minutes[1]) * 60 + Number(minutes[2] ?? 0);
  const seconds = value.match(/^(\d+)\s*(?:s|seg|segundos|seconds)?$/i);
  if (seconds) return Number(seconds[1]);
  return null;
}

const fieldLine = /^\*\*(.+?):\*\*\s*(.*)$/;
const sceneHeading = /^(?:cena|scene)\s+\d+\s*(?:[—–:-]\s*(.*))?$/i;
const shotHeading = /^(?:shot|plano)\s*[\d.]*\s*(?:[—–:-]\s*(.*))?$/i;

function emptyShot(name: string | null): ScriptFileShot {
  return {
    name,
    cameraLabel: null,
    shotType: "CAMERA",
    framing: null,
    angle: null,
    subject: null,
    movement: null,
    description: null,
    requiredTakes: 1,
    notes: null,
  };
}

function emptyScene(title: string): ScriptFileScene {
  return {
    title,
    type: "OTHER",
    description: null,
    dialogue: null,
    action: null,
    estimatedDurationSeconds: null,
    cameraInstructions: null,
    editingInstructions: null,
    continuityNotes: null,
    shots: [],
  };
}

function append(current: string | null, line: string) {
  return current ? `${current}\n${line}` : line;
}

export function parseScriptMarkdown(text: string): ParsedScriptFile {
  const project: ScriptFileProject = {
    title: null,
    format: null,
    aspectRatio: null,
    estimatedDurationSeconds: null,
    objective: null,
    audience: null,
    product: null,
    description: null,
  };
  const script: ScriptFileText = {
    hook: null,
    mainMessage: null,
    cta: null,
    notes: null,
  };
  const scenes: ScriptFileScene[] = [];
  const sections: ScriptFileSection[] = [];
  const warnings: ScriptFileWarning[] = [];

  let scene: ScriptFileScene | null = null;
  let shot: ScriptFileShot | null = null;
  let section: ScriptFileSection | null = null;
  // Texto antes da primeira cena que não é campo (plataformas, estilo).
  let loose: ScriptFileSection | null = null;
  // Onde caem as linhas seguintes até a próxima linha em branco: um campo
  // multilinha ou uma fala.
  let open: ((line: string) => void) | null = null;
  let inComment = false;

  const warn = (
    line: number,
    kind: ScriptFileWarning["kind"],
    field: string,
    value: string,
  ) => warnings.push({ line, kind, field, value });

  // Texto solto: descrição do plano, da cena ou trecho sem campo.
  const freeText = (line: string) => {
    if (shot) shot.description = append(shot.description, line);
    else if (scene) scene.description = append(scene.description, line);
    else {
      if (!loose) {
        loose = { title: "", body: "" };
        sections.push(loose);
      }
      loose.body = loose.body ? `${loose.body}\n${line}` : line;
    }
  };

  const addDialogue = (speaker: string, line: string) => {
    if (!scene) return freeText(`${speaker}: ${line}`);
    scene.dialogue = append(scene.dialogue, `${speaker}: ${line}`);
  };

  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  lines.forEach((raw, index) => {
    const lineNumber = index + 1;
    let line = raw.trimEnd();

    if (inComment) {
      if (line.includes("-->")) inComment = false;
      return;
    }
    if (line.trimStart().startsWith("<!--")) {
      if (!line.includes("-->")) inComment = true;
      return;
    }

    if (line.trim() === "" || /^-{3,}$/.test(line.trim())) {
      open = null;
      return;
    }

    // Dentro de um trecho sem campo (personagens, direção) tudo é texto,
    // até a próxima cena ou o próximo título de primeiro nível.
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      open = null;
      const [, marks, title] = heading;
      const sceneMatch = title.match(sceneHeading);
      if (marks.length === 1 && sceneMatch) {
        scene = emptyScene((sceneMatch[1] ?? title).trim());
        scenes.push(scene);
        shot = null;
        section = null;
        return;
      }
      const shotMatch = title.match(shotHeading);
      if (marks.length > 1 && scene && !section && shotMatch) {
        shot = emptyShot(shotMatch[1]?.trim() || null);
        scene.shots.push(shot);
        return;
      }
      if (marks.length === 1) {
        if (!project.title && !scenes.length && !sections.length) {
          project.title = title.trim();
          return;
        }
        section = { title: title.trim(), body: "" };
        sections.push(section);
        scene = null;
        shot = null;
        return;
      }
      if (section) {
        section.body = append(section.body || null, line) ?? "";
        return;
      }
      freeText(title.trim());
      return;
    }

    if (section) {
      section.body = section.body ? `${section.body}\n${line}` : line;
      return;
    }

    line = line.replace(/^>\s?/, "");
    const field = line.match(fieldLine);
    if (field) {
      const label = field[1].trim();
      const value = field[2].trim();
      const key = normalize(label);
      const target = assignField(key, label, value, lineNumber);
      if (target) {
        open = target;
        return;
      }
      // Rótulo que não é campo: fala. MAIÚSCULAS ou sem texto na linha
      // (a fala vem embaixo) indicam personagem.
      const isSpeaker = value === "" || label === label.toUpperCase();
      if (isSpeaker) {
        if (value) addDialogue(label, value);
        let first = !value;
        open = (next) => {
          if (first) {
            addDialogue(label, next);
            first = false;
          } else if (scene?.dialogue) {
            scene.dialogue = `${scene.dialogue} ${next}`;
          }
        };
        return;
      }
      freeText(`${label}: ${value}`);
      return;
    }

    if (open) {
      open(line.trim());
      return;
    }
    freeText(line.trim());
  });

  return { project, script, scenes, sections, warnings };

  // Devolve onde caem as linhas de continuação, ou null se o rótulo não é
  // campo deste ponto do arquivo.
  function assignField(
    key: string,
    label: string,
    value: string,
    line: number,
  ): ((next: string) => void) | null {
    if (shot) {
      const target = shotKeys.get(key);
      if (target) return setShotField(shot, target, label, value, line);
    }
    if (scene) {
      const target = sceneKeys.get(key);
      if (target) return setSceneField(scene, target, label, value, line);
      return null;
    }
    const scriptKey = scriptKeys.get(key);
    if (scriptKey) {
      script[scriptKey] = value || null;
      return (next) => {
        script[scriptKey] = append(script[scriptKey], next);
      };
    }
    const projectKey = projectKeys.get(key);
    if (!projectKey) return null;
    if (projectKey === "format") {
      const format = formatValues.get(normalize(value));
      if (format) project.format = format;
      else {
        // "Vertical 9:16" no campo formato: a proporção vem junto.
        const ratio = [...aspectValues].find(
          ([alias]) => alias.includes(":") && normalize(value).includes(alias),
        );
        if (ratio) project.aspectRatio = ratio[1];
        else warn(line, "unknownValue", label, value);
      }
      return () => {};
    }
    if (projectKey === "aspectRatio") {
      const ratio = aspectValues.get(normalize(value));
      if (ratio) project.aspectRatio = ratio;
      else warn(line, "unknownValue", label, value);
      return () => {};
    }
    if (projectKey === "estimatedDurationSeconds") {
      const seconds = parseDuration(value);
      if (seconds === null) warn(line, "badDuration", label, value);
      project.estimatedDurationSeconds = seconds;
      return () => {};
    }
    project[projectKey] = value || null;
    return (next) => {
      project[projectKey] = append(project[projectKey], next);
    };
  }

  function setSceneField(
    target: ScriptFileScene,
    key: SceneField,
    label: string,
    value: string,
    line: number,
  ): (next: string) => void {
    if (key === "type") {
      const normalized = normalize(value);
      const exact = sceneTypeValues.get(normalized);
      if (exact) target.type = exact;
      else {
        target.type = sceneTypeAliases[normalized] ?? "OTHER";
        target.description = append(target.description, `${label}: ${value}`);
        if (!sceneTypeAliases[normalized])
          warn(line, "unknownValue", label, value);
      }
      return () => {};
    }
    if (key === "duration") {
      const seconds = parseDuration(value);
      if (seconds === null) warn(line, "badDuration", label, value);
      target.estimatedDurationSeconds = seconds;
      return () => {};
    }
    // Cena não tem campo de propósito; ele fica legível na descrição.
    if (key === "purpose") {
      target.description = append(target.description, `${label}: ${value}`);
      return (next) => {
        target.description = append(target.description, next);
      };
    }
    const field = key;
    target[field] = value || null;
    return (next) => {
      target[field] = append(target[field], next);
    };
  }

  function setShotField(
    target: ScriptFileShot,
    key: ShotField,
    label: string,
    value: string,
    line: number,
  ): (next: string) => void {
    if (key === "shotType") {
      const normalized = normalize(value);
      const exact = shotTypeValues.get(normalized);
      if (exact) target.shotType = exact;
      else {
        target.shotType = shotTypeAliases[normalized] ?? "OTHER";
        target.description = append(target.description, `${label}: ${value}`);
        if (!shotTypeAliases[normalized])
          warn(line, "unknownValue", label, value);
      }
      return () => {};
    }
    if (key === "requiredTakes") {
      const takes = Number(value);
      if (Number.isInteger(takes) && takes >= 1 && takes <= 99)
        target.requiredTakes = takes;
      else warn(line, "badTakes", label, value);
      return () => {};
    }
    if (key === "purpose") {
      target.description = append(target.description, `${label}: ${value}`);
      return (next) => {
        target.description = append(target.description, next);
      };
    }
    const field = key;
    target[field] = value || null;
    return (next) => {
      target[field] = append(target[field], next);
    };
  }
}

// Linha em branco encerra o campo na leitura; dentro do valor ela vira
// quebra simples para o arquivo voltar igual.
function field(label: string, value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return [];
  const text = String(value)
    .replace(/\n\s*\n+/g, "\n")
    .trim();
  if (!text) return [];
  if (!text.includes("\n")) return [`**${label}:** ${text}`];
  return [`**${label}:**`, ...text.split("\n"), ""];
}

function block(lines: string[]) {
  const out = [...lines];
  while (out.at(-1) === "") out.pop();
  return out.length ? [...out, ""] : [];
}

export function formatScriptMarkdown(file: ScriptFile, locale: Locale) {
  const l = labels[locale];
  const m = messages[locale];
  const out: string[] = [];

  out.push(`# ${file.project.title ?? ""}`.trimEnd(), "");
  out.push(
    ...block([
      ...field(
        l.project.format,
        file.project.format && m.enums.ideaFormat[file.project.format],
      ),
      ...field(
        l.project.aspectRatio,
        file.project.aspectRatio &&
          m.enums.aspectRatio[file.project.aspectRatio],
      ),
      ...field(
        l.project.estimatedDurationSeconds,
        file.project.estimatedDurationSeconds,
      ),
      ...field(l.project.objective, file.project.objective),
      ...field(l.project.audience, file.project.audience),
      ...field(l.project.product, file.project.product),
      ...field(l.project.description, file.project.description),
    ]),
  );
  out.push(
    ...block([
      ...field(l.script.hook, file.script.hook),
      ...field(l.script.mainMessage, file.script.mainMessage),
      ...field(l.script.cta, file.script.cta),
      ...field(l.script.notes, file.script.notes),
    ]),
  );

  file.scenes.forEach((scene, sceneIndex) => {
    const f = l.sceneFields;
    out.push("---", "", `# ${l.scene} ${sceneIndex + 1} — ${scene.title}`, "");
    out.push(
      ...block([
        ...field(f.type, m.enums.sceneType[scene.type]),
        ...field(f.duration, scene.estimatedDurationSeconds),
        ...field(f.action, scene.action),
        ...field(f.cameraInstructions, scene.cameraInstructions),
        ...field(f.editingInstructions, scene.editingInstructions),
        ...field(f.continuityNotes, scene.continuityNotes),
        ...field(f.description, scene.description),
        ...field(f.dialogue, scene.dialogue),
      ]),
    );
    scene.shots.forEach((shot, shotIndex) => {
      const s = l.shotFields;
      const number = `${sceneIndex + 1}.${shotIndex + 1}`;
      out.push(
        `## ${l.shot} ${number}${shot.name ? ` — ${shot.name}` : ""}`,
        "",
      );
      out.push(
        ...block([
          ...field(s.shotType, m.enums.shotType[shot.shotType]),
          ...field(s.framing, shot.framing),
          ...field(s.angle, shot.angle),
          ...field(s.subject, shot.subject),
          ...field(s.movement, shot.movement),
          ...field(s.cameraLabel, shot.cameraLabel),
          ...field(
            s.requiredTakes,
            shot.requiredTakes === 1 ? null : shot.requiredTakes,
          ),
          ...field(s.description, shot.description),
          ...field(s.notes, shot.notes),
        ]),
      );
    });
  });

  return `${out.join("\n").trimEnd()}\n`;
}
