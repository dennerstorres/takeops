"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { loginWithEmail, type EmailLoginState } from "@/server/auth-actions";

export function EmailLoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, action, pending] = useActionState(
    loginWithEmail,
    null as EmailLoginState,
  );
  return (
    <form action={action} className="flex flex-col gap-4">
      {callbackUrl ? (
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
      ) : null}
      <Field id="login-email" label="E-mail" error={state?.message}>
        <Input
          id="login-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="voce@empresa.com"
          aria-invalid={state?.message ? true : undefined}
        />
      </Field>
      <Button
        type="submit"
        variant="outline"
        className="w-full"
        disabled={pending}
      >
        {pending ? "Enviando…" : "Receber link por e-mail"}
      </Button>
    </form>
  );
}
