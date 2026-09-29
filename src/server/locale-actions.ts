"use server";

import { revalidatePath } from "next/cache";
import { isLocale } from "@/i18n/locale";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db";

export type LocaleResult = { ok: true } | { ok: false };

// Preferência é do usuário, não do workspace (ADR-041): vale em qualquer
// workspace e em qualquer aparelho em que ele entrar.
export async function setLocaleAction(value: string): Promise<LocaleResult> {
  const session = await auth();
  if (!session?.user?.id || !isLocale(value)) return { ok: false };
  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { locale: value },
    });
  } catch (error) {
    console.error("setLocale", { userId: session.user.id, error });
    return { ok: false };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
