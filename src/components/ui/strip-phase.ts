// Cor da tira no Quadro de tiras (ADR-045). As onze etapas da produção
// cabem em cinco cartolinas, como no stripboard de set: poucas cores
// evitam o arco-íris, e o código de letra da fase leva a etapa em texto.
export const stripPhases = ["plan", "set", "post", "done", "shelf"] as const;

export type StripPhase = (typeof stripPhases)[number];

// Estado pela ponta da tira: contínuo, riscado ou vazado (nunca só cor).
export const stripTips = ["ok", "pending", "idle"] as const;

export type StripTip = (typeof stripTips)[number];

const phaseByStage: Record<string, StripPhase> = {
  IDEA: "plan",
  PRE_PRODUCTION: "plan",
  SCRIPTING: "plan",
  READY_TO_RECORD: "set",
  RECORDING: "set",
  EDITING: "post",
  REVIEW: "post",
  APPROVED: "done",
  SCHEDULED: "done",
  PUBLISHED: "done",
  ARCHIVED: "shelf",
};

export function stripPhase(stage: string): StripPhase {
  return phaseByStage[stage] ?? "plan";
}
