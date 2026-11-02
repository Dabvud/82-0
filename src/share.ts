export type ShareOutcome = "shared" | "copied" | "cancelled" | "failed";

/** Teilen-Menü des Handys, sonst Zwischenablage. Ein Abbruch ist kein Fehler. */
export async function shareResult(text: string): Promise<ShareOutcome> {
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ text });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}
