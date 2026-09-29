"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { loginWithEmail, type EmailLoginState } from "@/server/auth-actions";

export function EmailLoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, action, pending] = useActionState(
    loginWithEmail,
    null as EmailLoginState,
  );
  return (
    <form action={action} className="flex flex-col gap-2">
      {callbackUrl ? (
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
      ) : null}
      <label htmlFor="login-email" className="text-sm font-medium">
        E-mail
      </label>
      <input
        id="login-email"
        name="email"
        type="email"
        required
        autoComplete="email"
        inputMode="email"
        placeholder="voce@empresa.com"
        className="h-11 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      {state?.message ? (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      ) : null}
      <Button
        type="submit"
        variant="outline"
        className="min-h-11 w-full"
        disabled={pending}
      >
        {pending ? "Enviando…" : "Receber link por e-mail"}
      </Button>
    </form>
  );
}
