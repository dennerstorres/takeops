import type { ParticipantRepository } from "./participant-repository.ts";

// Quem acompanha a produção: responsável e participantes (PROJECT-004).
// `notify` tira o autor e repetidos e confere se ainda são membros.
export async function projectAudience(
  project: { id: string; ownerId: string | null },
  participants: ParticipantRepository | undefined,
  extra: (string | null | undefined)[] = [],
) {
  const rows = participants ? await participants.list(project.id) : [];
  return [
    project.ownerId,
    ...rows
      .filter((row) => row.videoProjectId === project.id)
      .map((row) => row.userId),
    ...extra,
  ];
}
