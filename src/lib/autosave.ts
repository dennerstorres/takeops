export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

export type AutosaveResult = { ok: true } | { ok: false; message: string };

type Timers = {
  set: (fn: () => void, ms: number) => unknown;
  clear: (handle: unknown) => void;
};

const defaultTimers: Timers = {
  set: (fn, ms) => setTimeout(fn, ms),
  clear: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
};

// Guarda só a última edição pendente. Enquanto uma gravação está no ar,
// a próxima espera: duas requests juntas poderiam chegar fora de ordem e
// a versão antiga sobrescrever a nova.
export function createAutosave<T>(options: {
  save: (value: T) => Promise<AutosaveResult>;
  onChange: (status: AutosaveStatus, message?: string) => void;
  delayMs?: number;
  timers?: Timers;
}) {
  const delay = options.delayMs ?? 1000;
  const timers = options.timers ?? defaultTimers;
  let timer: unknown = null;
  let pending: { value: T } | null = null;
  let running = false;
  let dirty = false;

  async function flush() {
    if (timer !== null) {
      timers.clear(timer);
      timer = null;
    }
    if (running || !pending) return;
    const { value } = pending;
    pending = null;
    running = true;
    options.onChange("saving");
    let result: AutosaveResult;
    try {
      result = await options.save(value);
    } catch {
      result = { ok: false, message: "Verifique a conexão e tente novamente." };
    }
    running = false;
    if (pending) {
      await flush();
      return;
    }
    if (result.ok) {
      dirty = false;
      options.onChange("saved");
    } else {
      options.onChange("error", result.message);
    }
  }

  return {
    schedule(value: T) {
      pending = { value };
      dirty = true;
      if (timer !== null) timers.clear(timer);
      timer = timers.set(() => {
        timer = null;
        void flush();
      }, delay);
    },
    flush,
    // Edição que ainda não chegou ao servidor, ou que falhou ao chegar.
    hasUnsaved() {
      return dirty;
    },
    cancel() {
      if (timer !== null) timers.clear(timer);
      timer = null;
      pending = null;
    },
  };
}
