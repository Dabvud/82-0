export const LAUNCH_DATE = "2026-10-26";
const DAY_MS = 24 * 60 * 60 * 1000;

export function isCalendarDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const time = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value;
}
const berlinFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit",
});

export function berlinDate(d: Date): string {
  const parts = berlinFormatter.formatToParts(d);
  const part = (type: string) => parts.find(p => p.type === type)!.value;
  return part("year") + "-" + part("month") + "-" + part("day");
}

function calendarTime(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

export function puzzleNumber(d: Date): number {
  return Math.max(1, (calendarTime(berlinDate(d)) - calendarTime(LAUNCH_DATE)) / DAY_MS + 1);
}

export function msUntilNextPuzzle(d: Date): number {
  // Suche die nächste Datumsgrenze: ein Berliner Tag kann 23, 24 oder 25 Stunden haben.
  const today = berlinDate(d);
  let low = d.getTime();
  let high = low + 26 * 60 * 60 * 1000;
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2);
    if (berlinDate(new Date(middle)) === today) low = middle;
    else high = middle;
  }
  return high - d.getTime();
}
