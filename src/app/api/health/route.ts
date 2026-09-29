import { prisma } from "@/server/db";

export const dynamic = "force-dynamic";

// Healthcheck: 200 se o banco responde, 503 se não. Não expõe detalhe.
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok" });
  } catch {
    return Response.json({ status: "unavailable" }, { status: 503 });
  }
}
