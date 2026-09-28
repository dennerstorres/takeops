export const takeStatuses = ["OK", "RETAKE", "DISCARDED"] as const;

export type TakeStatus = (typeof takeStatuses)[number];

export type TakeRecord = {
  id: string;
  shotId: string;
  number: number;
  status: TakeStatus;
  notes: string | null;
  favorite: boolean;
  recordedById: string | null;
  recordedAt: Date;
};

// O take só é alcançado pelo shot visível, na cena visível, na produção do
// workspace aberto.
export type TakeScope = {
  workspaceId: string;
  projectId: string;
  sceneId: string;
  shotId: string;
};

export type TakeRepository = {
  list(scope: TakeScope): Promise<TakeRecord[]>;
  find(scope: TakeScope, takeId: string): Promise<TakeRecord | null>;
};
