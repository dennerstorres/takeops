"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { captureIdeaAction, type IdeaFormState } from "@/server/idea-actions";

const initialState: IdeaFormState = null;

export function CaptureIdeaForm() {
  const [state, action, pending] = useActionState(
    captureIdeaAction,
    initialState,
  );

  return (
    <form action={action} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="captura-titulo" className="sr-only">
          Título
        </label>
        <input
          id="captura-titulo"
          name="title"
          required
          maxLength={120}
          placeholder="Anotar uma ideia"
          disabled={pending}
          aria-invalid={state?.fields?.title ? true : undefined}
          className="h-11 min-w-0 flex-1 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
        />
        <Button type="submit" className="min-h-11" disabled={pending}>
          {pending ? "Salvando…" : "Anotar"}
        </Button>
      </div>
      {state?.fields?.title ? (
        <p className="text-sm text-destructive">{state.fields.title}</p>
      ) : null}
      {state && !state.fields ? (
        <p className="text-sm text-destructive" role="alert">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
