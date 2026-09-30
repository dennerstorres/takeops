"use client";

import { Check } from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";
import { surfaceClass } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toggleShootChecklistItemAction } from "@/server/shoot-actions";

type Item = {
  id: string;
  text: string;
  completed: boolean;
  completedByName: string | null;
};

// Lista para o celular: a linha inteira é o alvo do toque, sem hover.
// A marca aparece na hora e volta se o servidor recusar.
export function ShootChecklist({
  projectId,
  shootId,
  items,
  canEdit,
}: {
  projectId: string;
  shootId: string;
  items: Item[];
  canEdit: boolean;
}) {
  const [optimistic, setOptimistic] = useOptimistic(
    items,
    (current, change: { id: string; completed: boolean }) =>
      current.map((item) =>
        item.id === change.id ? { ...item, completed: change.completed } : item,
      ),
  );
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const done = optimistic.filter((item) => item.completed).length;

  function toggle(item: Item) {
    const completed = !item.completed;
    setError(null);
    startTransition(async () => {
      setOptimistic({ id: item.id, completed });
      const formData = new FormData();
      formData.set("projectId", projectId);
      formData.set("shootId", shootId);
      formData.set("itemId", item.id);
      if (completed) formData.set("completed", "on");
      try {
        const result = await toggleShootChecklistItemAction(formData);
        if (!result.ok) setError(result.message);
      } catch {
        setError("Não foi possível salvar. Tente novamente.");
      }
    });
  }

  return (
    <div className="space-y-3">
      <div
        className="h-2 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label="Itens feitos"
        aria-valuemin={0}
        aria-valuemax={optimistic.length}
        aria-valuenow={done}
      >
        <div
          className="h-full bg-primary transition-[width]"
          style={{
            width: `${optimistic.length ? (done / optimistic.length) * 100 : 0}%`,
          }}
        />
      </div>
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {done} de {optimistic.length} feitos
      </p>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <ul className={cn(surfaceClass, "flex flex-col divide-y")}>
        {optimistic.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              role="checkbox"
              aria-checked={item.completed}
              disabled={!canEdit}
              onClick={() => toggle(item)}
              className="flex min-h-14 w-full items-center gap-3 px-3 py-2 text-left disabled:cursor-default"
            >
              <span
                aria-hidden
                className={`flex size-6 shrink-0 items-center justify-center rounded-md border ${
                  item.completed
                    ? "border-primary bg-primary text-primary-foreground"
                    : ""
                }`}
              >
                {item.completed ? <Check className="size-4" /> : null}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={`block text-base ${
                    item.completed ? "text-muted-foreground line-through" : ""
                  }`}
                >
                  {item.text}
                </span>
                {item.completed && item.completedByName ? (
                  <span className="block text-xs text-muted-foreground">
                    {item.completedByName}
                  </span>
                ) : null}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
