export type Platform = "installed" | "ios-safari" | "ios-other" | "android" | "other";

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferred: InstallPromptEvent | null = null;

export function detectPlatform(ua: string, standalone: boolean): Platform {
  if (standalone) return "installed";
  if (/iPhone|iPad|iPod/.test(ua)) {
    const otherBrowser = /CriOS|FxiOS|EdgiOS|OPiOS|Instagram|FBAN|FBAV|GSA\//.test(ua);
    return !otherBrowser && /Version\/[\d.]+.*Safari/.test(ua) ? "ios-safari" : "ios-other";
  }
  if (/Android/.test(ua)) return "android";
  return "other";
}

export function isStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true || window.matchMedia?.("(display-mode: standalone)").matches === true;
}

export function wantsInstall(search: string): boolean {
  return new URLSearchParams(search).has("installieren");
}

/** Muss früh laufen (main.tsx), sonst ist das Ereignis schon vorbei. */
export function captureInstallPrompt(): void {
  window.addEventListener("beforeinstallprompt", e => {
    e.preventDefault();
    deferred = e as InstallPromptEvent;
  });
}

export function canPromptInstall(): boolean {
  return deferred !== null;
}

export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  const e = deferred;
  deferred = null;
  await e.prompt();
  return (await e.userChoice).outcome === "accepted";
}
