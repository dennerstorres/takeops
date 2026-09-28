export type ScriptRecord = {
  id: string;
  videoProjectId: string;
  hook: string | null;
  mainMessage: string | null;
  cta: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ScriptWrite = Pick<
  ScriptRecord,
  "hook" | "mainMessage" | "cta" | "notes"
>;

export type ScriptRepository = {
  find(workspaceId: string, projectId: string): Promise<ScriptRecord | null>;
  save(
    workspaceId: string,
    projectId: string,
    input: ScriptWrite,
  ): Promise<ScriptRecord | null>;
};
