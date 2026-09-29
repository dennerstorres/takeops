// Tempo no vídeo digitado na revisão: "18", "0:18", "01:04" ou "1:02:03".
// Devolve segundos, null para vazio e NaN quando não dá para ler, para o
// schema de validação dar a mensagem certa.
export function parseTimestamp(text: string): number | null {
  const value = text.trim();
  if (!value) return null;
  if (/^\d{1,5}$/.test(value)) return Number(value);
  const parts = value.split(":");
  if (parts.length < 2 || parts.length > 3) return NaN;
  if (!parts.every((part) => /^\d{1,4}$/.test(part))) return NaN;
  const numbers = parts.map(Number);
  const seconds = numbers[numbers.length - 1];
  if (parts[parts.length - 1].length !== 2 || seconds > 59) return NaN;
  if (numbers.length === 2) return numbers[0] * 60 + seconds;
  const [hours, minutes] = numbers;
  if (parts[1].length !== 2 || minutes > 59) return NaN;
  return hours * 3600 + minutes * 60 + seconds;
}

// Até uma hora mostra MM:SS, como na spec ("00:18"); depois H:MM:SS.
export function formatTimestamp(total: number) {
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const mmss = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return hours > 0 ? `${hours}:${mmss}` : mmss;
}
