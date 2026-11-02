import type { Stats } from "../game/stats";

export function StatsScreen({ stats, onBack }: { stats: Stats; onBack: () => void }) {
  const avg = stats.seasons ? Math.round(stats.totalWins / stats.seasons) : null;
  return (
    <>
      <div className="topbar"><h2>Statistik</h2><button type="button" className="iconbtn" onClick={onBack} aria-label="Zurück">✕</button></div>
      {stats.seasons === 0 ? <p className="muted">Noch keine Saison gespielt.</p> : (
        <dl className="statlist">
          <div><dt>Saisons</dt><dd>{stats.seasons}</dd></div>
          <div><dt>Siege im Schnitt</dt><dd>{avg}</dd></div>
          <div><dt>Beste Bilanz</dt><dd>{stats.best ? `${stats.best.wins}-${stats.best.losses}` : "–"}</dd></div>
          <div><dt>Perfekte Saisons</dt><dd>{stats.perfect}</dd></div>
          <div><dt>Tagesrätsel-Serie</dt><dd>{stats.dailyStreak}</dd></div>
          {Object.entries(stats.byTier).map(([label, n]) => <div key={label}><dt>{label}</dt><dd>{n}</dd></div>)}
        </dl>
      )}
    </>
  );
}
