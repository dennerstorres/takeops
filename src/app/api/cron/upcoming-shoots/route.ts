import { createHash, timingSafeEqual } from "node:crypto";
import { prismaNotificationRepository } from "@/server/notification-prisma";
import { prismaParticipantRepository } from "@/server/participant-prisma";
import { notifyUpcomingShoots } from "@/server/upcoming-shoot";
import { prismaUpcomingShootRepository } from "@/server/upcoming-shoot-prisma";

export const dynamic = "force-dynamic";

// Compara por hash para o tempo não depender do tamanho nem do conteúdo.
function sameSecret(received: string, expected: string) {
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(received), digest(expected));
}

// Aviso de gravação próxima (HARDEN-009). Chamada por cron externo (Coolify
// Scheduled Task ou cron do host). Idempotente: cada gravação avisa uma vez
// por data marcada.
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return new Response(null, { status: 404 });
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token || !sameSecret(token, secret)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const result = await notifyUpcomingShoots({
      shoots: prismaUpcomingShootRepository,
      participants: prismaParticipantRepository,
      notifications: prismaNotificationRepository,
    });
    return Response.json(result);
  } catch (error) {
    console.error("cron.upcoming-shoots", { error });
    return Response.json({ error: "failed" }, { status: 500 });
  }
}
