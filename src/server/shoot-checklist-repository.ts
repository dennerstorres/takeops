export type ShootChecklistItemRecord = {
  id: string;
  shootId: string;
  text: string;
  order: number;
  completed: boolean;
  completedById: string | null;
  completedByName: string | null;
  completedAt: Date | null;
};

// A linha só é alcançada pela gravação visível da produção do workspace.
export type ShootChecklistScope = {
  workspaceId: string;
  projectId: string;
  shootId: string;
};

export type ShootChecklistRepository = {
  list(scope: ShootChecklistScope): Promise<ShootChecklistItemRecord[]>;
  // Copia os textos do modelo para o fim da lista da gravação. O modelo precisa
  // ser do mesmo workspace. Devolve null quando gravação ou modelo não batem.
  copyFromTemplate(
    scope: ShootChecklistScope,
    templateId: string,
  ): Promise<ShootChecklistItemRecord[] | null>;
  setCompleted(
    scope: ShootChecklistScope,
    itemId: string,
    completion: { userId: string; at: Date } | null,
  ): Promise<ShootChecklistItemRecord | null>;
};
