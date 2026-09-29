import type { Translate } from "../i18n/translate.ts";
import { DomainError, ValidationError } from "./errors.ts";

export type ServiceContext = {
  userId?: string;
  workspaceId?: string;
};

export type ServiceMeta = {
  operation: string;
  entity: string;
};

export type ActionSuccess<T> = {
  ok: true;
  data: T;
};

export type ActionFailure = {
  ok: false;
  message: string;
  fields?: Record<string, string>;
};

export type ActionResult<T> = ActionSuccess<T> | ActionFailure;

const fallbackMessage = "Não foi possível concluir. Tente novamente.";

export async function runService<T>(
  context: ServiceContext,
  meta: ServiceMeta,
  fn: () => Promise<T>,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    logServiceError(context, meta, error);
    throw error;
  }
}

export async function runAction<T>(
  context: ServiceContext,
  meta: ServiceMeta,
  fn: () => Promise<T>,
): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await runService(context, meta, fn) };
  } catch (error) {
    return toFailure(error, await requestTranslator());
  }
}

export async function runHandler<T>(
  context: ServiceContext,
  meta: ServiceMeta,
  fn: () => Promise<T>,
): Promise<Response> {
  try {
    return Response.json(await runService(context, meta, fn));
  } catch (error) {
    const failure = toFailure(error, await requestTranslator());
    const status = error instanceof DomainError ? error.status : 500;
    return Response.json(
      { message: failure.message, fields: failure.fields },
      { status },
    );
  }
}

// Tradutor do idioma de quem fez a requisição. Fora do Next (testes, seed)
// não há requisição: a mensagem sai no texto original.
async function requestTranslator(): Promise<Translate | null> {
  try {
    const { getTranslations } = await import("next-intl/server");
    return (await getTranslations()) as unknown as Translate;
  } catch {
    return null;
  }
}

export function toFailure(
  error: unknown,
  t: Translate | null = null,
): ActionFailure {
  if (error instanceof DomainError) {
    const message = t && error.messageKey ? t(error.messageKey) : error.message;
    return error instanceof ValidationError
      ? { ok: false, message, fields: error.fields }
      : { ok: false, message };
  }
  // Erro inesperado não vai para a tela. O detalhe fica só no log.
  return { ok: false, message: t ? t("errors.unexpected") : fallbackMessage };
}

function logServiceError(
  context: ServiceContext,
  meta: ServiceMeta,
  error: unknown,
) {
  console.error({
    error: error instanceof Error ? error.name : "unknown",
    userId: context.userId,
    workspaceId: context.workspaceId,
    entity: meta.entity,
    operation: meta.operation,
    stack: error instanceof Error ? error.stack : undefined,
  });
}
