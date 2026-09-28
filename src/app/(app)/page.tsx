"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-medium tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          A base da interface está pronta. Os módulos entram nas próximas
          tarefas.
        </p>
      </header>
      <div className="flex flex-wrap gap-2">
        <Button
          className="min-h-11"
          onClick={() => toast.success("Alteração registrada.")}
        >
          Mostrar aviso
        </Button>
        <Button
          variant="outline"
          className="min-h-11"
          onClick={() => setConfirmOpen(true)}
        >
          Pedir confirmação
        </Button>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Descartar esta alteração?"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Descartar"
        destructive
        onConfirm={() => toast("Alteração descartada.")}
      />
      <div className="grid gap-4">
        <EmptyState
          title="Nenhuma produção"
          description="As produções aparecem aqui quando o módulo existir."
        />
        <LoadingState />
        <ErrorState
          action={
            <Button
              variant="outline"
              className="min-h-11"
              onClick={() =>
                toast.error("Não foi possível carregar. Tente novamente.")
              }
            >
              Tentar novamente
            </Button>
          }
        />
      </div>
    </div>
  );
}
