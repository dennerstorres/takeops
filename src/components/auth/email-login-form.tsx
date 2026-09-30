"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { loginWithEmail, type EmailLoginState } from "@/server/auth-actions";

export function EmailLoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const t = useTranslations();
  const [state, action, pending] = useActionState(
    loginWithEmail,
    null as EmailLoginState,
  );
  return (
    <form action={action} className="flex flex-col gap-4">
      {callbackUrl ? (
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
      ) : null}
      <Field
        id="login-email"
        label={t("login.email")}
        error={
          state?.message === "login.invalidEmail" ||
          state?.message === "login.sendFailed"
            ? t(state.message)
            : state?.message
        }
      >
        <Input
          id="login-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder={t("login.emailPlaceholder")}
          aria-invalid={state?.message ? true : undefined}
        />
      </Field>
      <Button
        type="submit"
        variant="outline"
        className="w-full"
        disabled={pending}
      >
        {pending ? t("login.sending") : t("login.emailLink")}
      </Button>
    </form>
  );
}
