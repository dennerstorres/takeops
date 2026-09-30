"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { captureIdeaAction, type IdeaFormState } from "@/server/idea-actions";
import { Input } from "@/components/ui/input";

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
        <Input
          id="captura-titulo"
          name="title"
          required
          maxLength={120}
          placeholder="Anotar uma ideia"
          disabled={pending}
          aria-invalid={state?.fields?.title ? true : undefined}
          className="min-w-0 flex-1"
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
