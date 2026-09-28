// Converte entre o horário de parede de um fuso (o que a pessoa digita num
// input datetime-local) e o instante UTC que o banco guarda. Usa só Intl,
// sem depender do fuso do servidor.

const localPattern = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

function wallClock(instant: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const value = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);
  return Date.UTC(
    value("year"),
    value("month") - 1,
    value("day"),
    value("hour"),
    value("minute"),
    value("second"),
  );
}

export function zonedLocalToUtc(local: string, timeZone: string) {
  const match = localPattern.exec(local);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match.map(Number);
  const asUtc = Date.UTC(year, month - 1, day, hour, minute);
  const check = new Date(asUtc);
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day ||
    hour > 23 ||
    minute > 59
  ) {
    return null;
  }
  // Duas passadas acertam o deslocamento também perto da troca de horário.
  let guess = asUtc - (wallClock(new Date(asUtc), timeZone) - asUtc);
  guess = asUtc - (wallClock(new Date(guess), timeZone) - guess);
  return new Date(guess);
}

export function utcToZonedLocal(instant: Date, timeZone: string) {
  const wall = new Date(wallClock(instant, timeZone));
  return wall.toISOString().slice(0, 16);
}
