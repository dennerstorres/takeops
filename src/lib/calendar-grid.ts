// Grade de calendário em dias de parede (AAAA-MM-DD), sem fuso: quem chama
// converte os limites para instantes com o fuso do workspace.

const DAY_MS = 24 * 60 * 60 * 1000;

function parseDay(day: string) {
  return new Date(`${day}T00:00:00.000Z`);
}

export function addDays(day: string, amount: number) {
  return new Date(parseDay(day).getTime() + amount * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

// Semana começa no domingo, como no calendário de parede brasileiro.
export function weekStart(day: string) {
  return addDays(day, -parseDay(day).getUTCDay());
}

// "2026-10" válido ou null. Ano entre 2000 e 2100 evita URL absurda.
export function parseMonth(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}$/.test(value)) return null;
  const [year, month] = value.split("-").map(Number);
  if (year < 2000 || year > 2100 || month < 1 || month > 12) return null;
  return value;
}

export function shiftMonth(month: string, amount: number) {
  const [year, index] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, index - 1 + amount, 1));
  return date.toISOString().slice(0, 7);
}

// Seis semanas fixas: a grade não muda de altura entre meses.
export function monthGrid(month: string) {
  const first = weekStart(`${month}-01`);
  return Array.from({ length: 42 }, (_, index) => addDays(first, index));
}
