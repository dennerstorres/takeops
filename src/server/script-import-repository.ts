import type { SceneWrite } from "./scene-repository.ts";
import type { ScriptWrite } from "./script-repository.ts";
import type { ShotWrite } from "./shot-repository.ts";

export type ScriptImportWrite = {
  script: ScriptWrite;
  // Personagens que ainda não existem na produção.
  characters: string[];
  // characterNames usa o nome exato já existente ou um dos novos.
  scenes: (SceneWrite & { shots: ShotWrite[]; characterNames: string[] })[];
};

export type ScriptImportRepository = {
  // Tudo ou nada: roteiro, cenas ao fim da lista e planos na mesma
  // transação. null quando a produção não é visível no workspace.
  importScript(
    workspaceId: string,
    projectId: string,
    input: ScriptImportWrite,
  ): Promise<{ sceneIds: string[]; shots: number } | null>;
};
