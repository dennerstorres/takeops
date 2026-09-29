import type {
  ActivityRepository,
  ActivityWrite,
} from "./activity-repository.ts";

// Atividade é efeito de uma operação que já passou pela autorização do
// serviço dela. Falhar aqui não desfaz a operação: só vai para o log técnico.
export async function recordActivity(
  activities: ActivityRepository | undefined,
  input: ActivityWrite,
) {
  if (!activities) return;
  try {
    await activities.record(input);
  } catch (error) {
    console.error("activity.record", {
      workspaceId: input.workspaceId,
      action: input.action,
      entity: input.entityType,
      error,
    });
  }
}
