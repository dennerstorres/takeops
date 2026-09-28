import { z } from "zod";
import { ValidationError } from "./errors.ts";

export function parseInput<Schema extends z.ZodType>(
  schema: Schema,
  input: unknown,
): z.infer<Schema> {
  const result = schema.safeParse(input);
  if (result.success) return result.data;

  const fields: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.map(String).join(".") || "form";
    if (!fields[key]) fields[key] = issue.message;
  }

  throw new ValidationError(fields);
}
