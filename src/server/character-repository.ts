export type CharacterRecord = {
  id: string;
  videoProjectId: string;
  name: string;
  actorName: string | null;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CharacterWrite = Pick<
  CharacterRecord,
  "name" | "actorName" | "userId"
>;

export type SceneCharacterLink = { sceneId: string; characterId: string };

// O personagem não guarda workspaceId: toda consulta passa pela produção
// visível no workspace aberto.
export type CharacterRepository = {
  list(workspaceId: string, projectId: string): Promise<CharacterRecord[]>;
  // "duplicate" quando o nome já existe na produção (corrida com outra aba).
  create(
    workspaceId: string,
    projectId: string,
    input: CharacterWrite,
  ): Promise<CharacterRecord | "duplicate" | null>;
  update(
    workspaceId: string,
    projectId: string,
    characterId: string,
    input: CharacterWrite,
  ): Promise<CharacterRecord | "duplicate" | null>;
  delete(
    workspaceId: string,
    projectId: string,
    characterId: string,
  ): Promise<boolean>;
  listLinks(
    workspaceId: string,
    projectId: string,
  ): Promise<SceneCharacterLink[]>;
  // Troca todos os personagens da cena. false se a cena ou algum
  // personagem não é da produção visível.
  setSceneCharacters(
    workspaceId: string,
    projectId: string,
    sceneId: string,
    characterIds: readonly string[],
  ): Promise<boolean>;
};
