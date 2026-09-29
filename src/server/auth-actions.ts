"use server";

import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn, signOut } from "@/server/auth";
import { safeNextPath } from "@/server/auth-routes";

export type EmailLoginState = { message: string } | null;

const emailSchema = z.email().max(254);

export async function loginWithGoogle(formData: FormData) {
  const nextPath = safeNextPath(formData.get("callbackUrl"));
  await signIn("google", { redirectTo: nextPath ?? "/" });
}

export async function loginWithEmail(
  _state: EmailLoginState,
  formData: FormData,
): Promise<EmailLoginState> {
  const parsed = emailSchema.safeParse(
    String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),
  );
  if (!parsed.success) return { message: "Digite um e-mail válido." };
  const nextPath = safeNextPath(formData.get("callbackUrl"));
  try {
    // Sucesso redireciona para /login/verificar (lança o redirect do Next).
    await signIn("nodemailer", {
      email: parsed.data,
      redirectTo: nextPath ?? "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { message: "Não foi possível enviar o link. Tente novamente." };
    }
    throw error;
  }
  return null;
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}
