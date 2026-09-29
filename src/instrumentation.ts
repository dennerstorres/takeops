// Roda uma vez quando o servidor Next sobe: falha cedo com env inválido.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { assertServerEnv } = await import("./server/env.ts");
  assertServerEnv(process.env);
}
