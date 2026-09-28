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
  create(
    scope: TakeScope,
    input: {
      status: TakeStatus;
      notes: string | null;
      recordedById: string;
      recordedAt: Date;
    },
  ): Promise<TakeRecord | null>;
  update(
    scope: TakeScope,
    takeId: string,
    input: { status: TakeStatus; notes: string | null },
  ): Promise<TakeRecord | null>;
  // Um preferido por shot: marcar um tira a marca dos outros na mesma
  // transação. null tira a marca de todos.
  setFavorite(
    scope: TakeScope,
    takeId: string | null,
  ): Promise<TakeRecord[] | null>;
};
