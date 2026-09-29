import type { SceneStatus, SceneType } from "./scene-labels.ts";
import type { ShotType } from "./shot-labels.ts";

type SceneLike = {
  id: string;
  order: number;
  title: string;
  type: SceneType;
  status: SceneStatus;
  speakerId: string | null;
  dialogue: string | null;
  action: string | null;
  cameraInstructions: string | null;
  editingInstructions: string | null;
  continuityNotes: string | null;
};

type ShotLike = {
  id: string;
  order: number;
  name: string | null;
  shotType: ShotType;
  framing: string | null;
  cameraLabel: string | null;
  angle: string | null;
  subject: string | null;
  movement: string | null;
  description: string | null;
  requiredTakes: number;
  notes: string | null;
};

// Cena descartada não entra na gravação: a contagem "Cena X de N" e a
// navegação só consideram o que ainda vai para a câmera.
export function recordableScenes<T extends SceneLike>(scenes: T[]) {
  return scenes
    .filter((scene) => scene.status !== "DISCARDED")
    .sort((a, b) => a.order - b.order);
}

// A posição vem da URL e é 1-based, como o texto "Cena X de N". Valor
// inválido ou fora da faixa cai na primeira cena em vez de dar erro no set.
export function clampPosition(raw: unknown, total: number) {
  const value = typeof raw === "string" ? Number(raw) : NaN;
  if (!Number.isInteger(value) || value < 1) return 1;
  return Math.min(value, Math.max(total, 1));
}

export function buildRecordView<S extends SceneLike, T extends ShotLike>(
  scenes: S[],
  shotsByScene: Map<string, T[]>,
  people: { id: string; label: string }[],
  position: number,
) {
  const list = recordableScenes(scenes);
  if (list.length === 0) return null;
  const index = Math.min(Math.max(position, 1), list.length) - 1;
  const scene = list[index];
  const names = new Map(people.map((person) => [person.id, person.label]));
  const shots = [...(shotsByScene.get(scene.id) ?? [])].sort(
    (a, b) => a.order - b.order,
  );
  return {
    position: index + 1,
    total: list.length,
    previous: index > 0 ? index : null,
    next: index < list.length - 1 ? index + 2 : null,
    scene: {
      ...scene,
      speaker: scene.speakerId ? (names.get(scene.speakerId) ?? null) : null,
    },
    shots,
  };
}
