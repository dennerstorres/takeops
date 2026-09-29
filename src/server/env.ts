import { z } from "zod";

// Valida as variáveis do servidor. Em produção todas são obrigatórias; em
// desenvolvimento o login Google pode faltar (a tela esconde o botão).
// Mensagens citam só o nome da variável, nunca o valor.

const placeholderSecret = "gere com openssl rand -base64 32";

const databaseUrl = z
  .string({ error: "DATABASE_URL não está definida." })
  .trim()
  .regex(/^postgres(ql)?:\/\//, {
    error: "DATABASE_URL precisa começar com postgres:// ou postgresql://.",
  });

const authSecret = z
  .string({ error: "AUTH_SECRET não está definida." })
  .trim()
  .min(32, { error: "AUTH_SECRET precisa ter ao menos 32 caracteres." })
  .refine((value) => value !== placeholderSecret, {
    error: "AUTH_SECRET ainda é o texto do .env.example.",
  });

const filled = (name: string) =>
  z
    .string({ error: `${name} não está definida.` })
    .trim()
    .min(1, { error: `${name} está vazia.` });

const optional = z.preprocess(
  (value) => (typeof value === "string" && value.trim() ? value : undefined),
  z.string().optional(),
);

const productionSchema = z.object({
  DATABASE_URL: databaseUrl,
  AUTH_SECRET: authSecret,
  AUTH_GOOGLE_ID: filled("AUTH_GOOGLE_ID"),
  AUTH_GOOGLE_SECRET: filled("AUTH_GOOGLE_SECRET"),
});

const developmentSchema = z.object({
  DATABASE_URL: databaseUrl,
  AUTH_SECRET: optional,
  AUTH_GOOGLE_ID: optional,
  AUTH_GOOGLE_SECRET: optional,
});

export type EnvCheck = { ok: true } | { ok: false; problems: string[] };

export function checkServerEnv(
  env: Record<string, string | undefined>,
): EnvCheck {
  const schema =
    env.NODE_ENV === "production" ? productionSchema : developmentSchema;
  const result = schema.safeParse(env);
  if (result.success) return { ok: true };
  return {
    ok: false,
    problems: result.error.issues.map((issue) => issue.message),
  };
}

export function assertServerEnv(env: Record<string, string | undefined>) {
  const check = checkServerEnv(env);
  if (!check.ok) {
    throw new Error(`Configuração inválida:\n- ${check.problems.join("\n- ")}`);
  }
}
