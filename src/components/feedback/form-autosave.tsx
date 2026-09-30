"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import {
  createAutosave,
  type AutosaveActionResult,
  type AutosaveStatus,
} from "@/lib/autosave";

export function useFormAutosave(
  enabled: boolean,
  save: (formData: FormData) => Promise<AutosaveActionResult>,
) {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [message, setMessage] = useState<string>();
  const autosave = useRef<ReturnType<typeof createAutosave<FormData>>>(null);
  const saveRef = useRef(save);

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  useEffect(() => {
    if (!enabled) return;
    const current = createAutosave<FormData>({
      save: async (formData) => {
        const result = await saveRef.current(formData);
        if (result.ok) return { ok: true };
        const field = result.fields
          ? Object.values(result.fields)[0]
          : undefined;
        return { ok: false, message: field ?? result.message };
      },
      onChange: (next, text) => {
        setStatus(next);
        setMessage(text);
      },
    });
    autosave.current = current;
    // Sair com edição que não chegou ao servidor pede confirmação.
    const guard = (event: BeforeUnloadEvent) => {
      if (current.hasUnsaved()) event.preventDefault();
    };
    window.addEventListener("beforeunload", guard);
    return () => {
      window.removeEventListener("beforeunload", guard);
      current.cancel();
      autosave.current = null;
    };
  }, [enabled]);

  return {
    status,
    message,
    schedule: (form: HTMLFormElement) =>
      autosave.current?.schedule(new FormData(form)),
    flush: () => autosave.current?.flush(),
    cancel: () => autosave.current?.cancel(),
  };
}

export function AutosaveStatusText({
  status,
  message,
}: {
  status: AutosaveStatus;
  message?: string;
}) {
  const t = useTranslations();
  const label =
    status === "saving"
      ? t("autosave.saving")
      : status === "saved"
        ? t("autosave.saved")
        : status === "error"
          ? t("autosave.error")
          : "";
  return (
    <p
      aria-live="polite"
      className={
        status === "error"
          ? "text-sm text-destructive"
          : "text-sm text-muted-foreground"
      }
    >
      {label}
      {status === "error" && message ? `. ${message}` : null}
    </p>
  );
}
