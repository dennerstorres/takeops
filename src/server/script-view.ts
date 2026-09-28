import type { SceneStatus, SceneType } from "./scene-labels.ts";

type SceneLike = {
  id: string;
  order: number;
  title: string;
  type: SceneType;
  status: SceneStatus;
  speakerId: string | null;
  dialogue: string | null;
  action: string | null;
  estimatedDurationSeconds: number | null;
};

export function formatSeconds(total: number) {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  if (minutes === 0) return `${seconds} s`;
  return `${minutes} min ${seconds.toString().padStart(2, "0")} s`;
}

// A leitura do roteiro segue a ordem das cenas. A soma da duração só conta
// o que foi estimado, e avisa quantas cenas ainda não têm tempo.
export function buildScriptView(
  scenes: SceneLike[],
  people: { id: string; label: string }[],
) {
  const names = new Map(people.map((person) => [person.id, person.label]));
  const rows = [...scenes]
    .sort((a, b) => a.order - b.order)
    .map((scene) => ({
      id: scene.id,
      order: scene.order,
      title: scene.title,
      type: scene.type,
      status: scene.status,
      speaker: scene.speakerId ? (names.get(scene.speakerId) ?? null) : null,
      dialogue: scene.dialogue,
      action: scene.action,
      duration:
        scene.estimatedDurationSeconds == null
          ? null
          : formatSeconds(scene.estimatedDurationSeconds),
    }));
  const totalSeconds = scenes.reduce(
    (sum, scene) => sum + (scene.estimatedDurationSeconds ?? 0),
    0,
  );
  return {
    rows,
    total: formatSeconds(totalSeconds),
    withoutDuration: scenes.filter(
      (scene) => scene.estimatedDurationSeconds == null,
    ).length,
  };
}
