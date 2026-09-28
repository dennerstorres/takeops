"use server";

import { signIn, signOut } from "@/server/auth";
import { safeNextPath } from "@/server/auth-routes";

export async function loginWithGoogle(formData: FormData) {
  const nextPath = safeNextPath(formData.get("callbackUrl"));
  await signIn("google", { redirectTo: nextPath ?? "/" });
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}
