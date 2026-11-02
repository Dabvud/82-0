import type { Platform } from "../install";

interface Props {
  platform: Platform;
  canPrompt: boolean;
  onPrompt(): void;
  onClose(): void;
}

export default function InstallHelp({ platform, canPrompt, onPrompt, onClose }: Props) {
  if (platform === "installed") return null;
  return (
    <section className="install" aria-labelledby="install-title">
      <h2 id="install-title">Aufs Handy holen</h2>
      <p className="muted">Dann startet das Spiel wie eine App vom Home-Bildschirm und läuft auch offline.</p>

      {platform === "android" && (canPrompt ? (
        <button type="button" className="primary" onClick={onPrompt}>Installieren</button>
      ) : (
        <ol className="steps">
          <li>Oben rechts auf das Menü ⋮ tippen</li>
          <li>„App installieren“ oder „Zum Startbildschirm hinzufügen“ wählen</li>
        </ol>
      ))}

      {platform === "ios-safari" && (
        <ol className="steps">
          <li>Unten auf das Teilen-Symbol tippen <span className="glyph" aria-hidden="true">⎋</span></li>
          <li>Nach unten scrollen und „Zum Home-Bildschirm“ wählen</li>
          <li>Oben rechts auf „Hinzufügen“ tippen</li>
        </ol>
      )}

      {platform === "ios-other" && (
        <p className="steps-note">
          Bitte in Safari öffnen. Auf dem iPhone geht das Installieren nur dort. Kopiere die Adresse oder tippe im Menü auf „In Safari öffnen“.
        </p>
      )}

      {platform === "other" && (
        <p className="steps-note">Öffne diese Seite auf deinem Handy, dann erscheint hier die passende Anleitung.</p>
      )}

      <button type="button" onClick={onClose}>Zum Start</button>
    </section>
  );
}
