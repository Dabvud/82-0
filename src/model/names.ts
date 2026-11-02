export function normalizeName(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
    .replace(/[.'’‘ʼ]/g, "")
    .trim().replace(/\s+/g, " ")
    .replace(/(?:\s+(?:jr|sr|ii|iii|iv))+$/, "").trim();
}
