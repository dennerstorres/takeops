import { z } from "zod";

// Valida as variáveis do servidor (ADR-036). Login: Google e/ou link por
// e-mail, cada um ativo só se configurado por inteiro; produção exige ao
// menos um (ADR-040). Mensagens citam só o nome da variável, nunca o valor.

type Env = Record<string, string | undefined>;

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

const optional = z.preprocess(
  (value) => (typeof value === "string" && value.trim() ? value : undefined),
  z.string().optional(),
);

const smtpUrl = /^smtps?:\/\//;
// "nome@dominio" ou "Nome <nome@dominio>".
const sender = /^(?:[^<>]*<)?[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+>?$/;

const filled = (env: Env, name: string) => Boolean(env[name]?.trim());

export function loginMethods(env: Env) {
  return {
    google: filled(env, "AUTH_GOOGLE_ID") && filled(env, "AUTH_GOOGLE_SECRET"),
    email: filled(env, "EMAIL_SERVER") && filled(env, "EMAIL_FROM"),
  };
}

function loginProblems(env: Env, production: boolean) {
  const problems: string[] = [];
  const pairs = [
    ["AUTH_GOOGLE_ID", "AUTH_GOOGLE_SECRET"],
    ["EMAIL_SERVER", "EMAIL_FROM"],
  ] as const;
  for (const [a, b] of pairs) {
    if (filled(env, a) !== filled(env, b)) {
      problems.push(`${a} e ${b} precisam estar definidas juntas.`);
    }
  }
  if (filled(env, "EMAIL_SERVER") && !smtpUrl.test(env.EMAIL_SERVER!.trim())) {
    problems.push("EMAIL_SERVER precisa começar com smtp:// ou smtps://.");
  }
  if (filled(env, "EMAIL_FROM") && !sender.test(env.EMAIL_FROM!.trim())) {
    problems.push("EMAIL_FROM precisa ser um e-mail, como Nome <eu@dominio>.");
  }
  const methods = loginMethods(env);
  if (production && !methods.google && !methods.email) {
    problems.push(
      "Configure ao menos um login: Google (AUTH_GOOGLE_ID/SECRET) ou e-mail (EMAIL_SERVER/FROM).",
    );
  }
  return problems;
}

const productionSchema = z.object({
  DATABASE_URL: databaseUrl,
  AUTH_SECRET: authSecret,
});

const developmentSchema = z.object({
  DATABASE_URL: databaseUrl,
  AUTH_SECRET: optional,
});

export type EnvCheck = { ok: true } | { ok: false; problems: string[] };

export function checkServerEnv(env: Env): EnvCheck {
  const production = env.NODE_ENV === "production";
  const schema = production ? productionSchema : developmentSchema;
  const result = schema.safeParse(env);
  const problems = [
    ...(result.success ? [] : result.error.issues.map((i) => i.message)),
    ...loginProblems(env, production),
  ];
  return problems.length ? { ok: false, problems } : { ok: true };
}

export function assertServerEnv(env: Env) {
  const check = checkServerEnv(env);
  if (!check.ok) {
    throw new Error(`Configuração inválida:\n- ${check.problems.join("\n- ")}`);
  }
}
