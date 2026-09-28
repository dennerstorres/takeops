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
    return toFailure(error);
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
    const failure = toFailure(error);
    const status = error instanceof DomainError ? error.status : 500;
    return Response.json(
      { message: failure.message, fields: failure.fields },
      { status },
    );
  }
}

function toFailure(error: unknown): ActionFailure {
  if (error instanceof ValidationError) {
    return { ok: false, message: error.message, fields: error.fields };
  }
  if (error instanceof DomainError) {
    return { ok: false, message: error.message };
  }
  // Erro inesperado não vai para a tela. O detalhe fica só no log.
  return { ok: false, message: fallbackMessage };
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
