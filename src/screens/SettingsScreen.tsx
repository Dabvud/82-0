import type { Settings } from "../app-data";

interface Props {
  settings: Settings;
  onChange: (settings: Settings) => void;
  onBack: () => void;
}

export function SettingsScreen({ settings, onChange, onBack }: Props) {
  return (
    <>
      <div className="topbar"><h2>Einstellungen</h2><button type="button" className="iconbtn" onClick={onBack} aria-label="Zurück">✕</button></div>
      <label className="toggle">
        <span>Trade Deadline<span className="btn__sub">Nach Spiel 50 darfst du einen Spieler tauschen.</span></span>
        <input type="checkbox" checked={settings.deadline} onChange={(e) => onChange({ ...settings, deadline: e.target.checked })} />
      </label>
      <label className="toggle">
        <span>Luxussteuer-Pleite<span className="btn__sub">Über 120 % des Caps kann der Owner pleitegehen.</span></span>
        <input type="checkbox" checked={settings.bankruptcy} onChange={(e) => onChange({ ...settings, bankruptcy: e.target.checked })} />
      </label>
      <p className="muted">Änderungen gelten ab der nächsten Saison.</p>
    </>
  );
}
