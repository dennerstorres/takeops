"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { loginWithEmail, type EmailLoginState } from "@/server/auth-actions";
import { Input } from "@/components/ui/input";

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
      <Input
        id="login-email"
        name="email"
        type="email"
        required
        autoComplete="email"
        inputMode="email"
        placeholder="voce@empresa.com"
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
