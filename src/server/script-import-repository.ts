import type { SceneWrite } from "./scene-repository.ts";
import type { ScriptWrite } from "./script-repository.ts";
import type { ShotWrite } from "./shot-repository.ts";

export type ScriptImportWrite = {
  script: ScriptWrite;
  scenes: (SceneWrite & { shots: ShotWrite[] })[];
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
