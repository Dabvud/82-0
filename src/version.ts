/**
 * Macht aus `git describe --tags --long` (z. B. "v1.0.0-7-g1fe52dc") eine fortlaufende
 * Version: Commits seit dem Tag werden auf die Patch-Nummer addiert ("v1.0.7").
 */
export function versionFromDescribe(describe: string, fallback: string): string {
  const m = describe.trim().match(/^v(\d+)\.(\d+)\.(\d+)-(\d+)-g[0-9a-f]+$/);
  if (!m) return `v${fallback}`;
  return `v${m[1]}.${m[2]}.${Number(m[3]) + Number(m[4])}`;
}
