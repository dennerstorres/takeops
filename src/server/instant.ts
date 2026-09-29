import { ValidationError } from "./errors.ts";

// A API recebe instante com fuso explícito. Sem Z ou deslocamento o horário
// seria lido no fuso do servidor, que não é o do workspace.
const isoInstant =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

export function instant(value: string, field: string) {
  const date = isoInstant.test(value) ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) {
    throw new ValidationError({ [field]: "Informe data e hora válidas." });
  }
  return date;
}
