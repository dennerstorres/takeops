"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

// Erro inesperado numa página. O detalhe fica no log do servidor.
export function RouteError({ reset }: { reset: () => void }) {
  return (
    <div
      role="alert"
      className="mx-auto flex w-full max-w-3xl flex-col items-start gap-3"
    >
      <h1 className="text-2xl font-medium tracking-tight">
        Não foi possível carregar
      </h1>
      <p className="text-sm text-muted-foreground">
        Algo deu errado do nosso lado. Tente de novo em instantes.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" className="min-h-11" onClick={() => reset()}>
          Tentar novamente
        </Button>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center px-2 text-sm font-medium underline-offset-4 hover:underline"
        >
          Ir para o início
        </Link>
      </div>
    </div>
  );
}
