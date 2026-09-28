const secretKey =
  /access_token|refresh_token|id_token|token|code|secret|authorization|cookie/i;

export function redactForLog(value: unknown): unknown {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactString(value.message),
      stack: value.stack ? redactString(value.stack) : undefined,
    };
  }
  if (typeof value === "string") return redactString(value);
  if (Array.isArray(value)) return value.map(redactForLog);
  if (value && typeof value === "object") {
    const redacted: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      redacted[key] = secretKey.test(key) ? "[redacted]" : redactForLog(item);
    }
    return redacted;
  }
  return value;
}

function redactString(value: string) {
  return value
    .replace(
      /((?:access_token|refresh_token|id_token|code)=)[^&\s]+/gi,
      "$1[redacted]",
    )
    .replace(/Bearer\s+\S+/gi, "Bearer [redacted]");
}
