export class DomainError extends Error {
  readonly code: string;
  readonly status: number;
  // Chave do catálogo (ADR-041). Sem chave, a tela recebe `message` como
  // está: é o caso das mensagens específicas ainda não migradas.
  readonly messageKey?: string;

  constructor(
    code: string,
    message: string,
    status = 400,
    messageKey?: string,
  ) {
    super(message);
    this.name = "DomainError";
    this.code = code;
    this.status = status;
    this.messageKey = messageKey;
  }
}

export class ValidationError extends DomainError {
  readonly fields: Record<string, string>;

  constructor(fields: Record<string, string>, message?: string) {
    super(
      "VALIDATION",
      message ?? "Verifique os dados e tente novamente.",
      422,
      message ? undefined : "errors.validation",
    );
    this.name = "ValidationError";
    this.fields = fields;
  }
}

export class NotFoundError extends DomainError {
  constructor(message?: string) {
    super(
      "NOT_FOUND",
      message ?? "Não encontrado.",
      404,
      message ? undefined : "errors.notFound",
    );
    this.name = "NotFoundError";
  }
}

export class ForbiddenError extends DomainError {
  constructor(message?: string) {
    super(
      "FORBIDDEN",
      message ?? "Você não tem acesso a este recurso.",
      403,
      message ? undefined : "errors.forbidden",
    );
    this.name = "ForbiddenError";
  }
}
