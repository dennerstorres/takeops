export class DomainError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.name = "DomainError";
    this.code = code;
    this.status = status;
  }
}

export class ValidationError extends DomainError {
  readonly fields: Record<string, string>;

  constructor(
    fields: Record<string, string>,
    message = "Verifique os dados e tente novamente.",
  ) {
    super("VALIDATION", message, 422);
    this.name = "ValidationError";
    this.fields = fields;
  }
}

export class NotFoundError extends DomainError {
  constructor(message = "Não encontrado.") {
    super("NOT_FOUND", message, 404);
    this.name = "NotFoundError";
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = "Você não tem acesso a este recurso.") {
    super("FORBIDDEN", message, 403);
    this.name = "ForbiddenError";
  }
}
