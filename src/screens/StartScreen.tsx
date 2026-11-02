import { SegmentDisplay } from "../components/SegmentDisplay";

interface Props {
  puzzleNo: number;
  /** Ergebnis des heutigen Tagesrätsels, falls schon gespielt. */
  todayResult: { wins: number; losses: number } | null;
  dailyInProgress: boolean;
  storageOk: boolean;
  onDaily: () => void;
  onFree: () => void;
  onStats: () => void;
  onRules: () => void;
  onSettings: () => void;
}

export function StartScreen({ puzzleNo, todayResult, dailyInProgress, storageOk, onDaily, onFree, onStats, onRules, onSettings }: Props) {
  const dailySub = todayResult ? `Heute gespielt: ${todayResult.wins}-${todayResult.losses}`
    : dailyInProgress ? "Weiterspielen" : "Ein Versuch, für alle gleich";
  return (
    <>
      <section className="board">
        <div className="board__screen score">
          <SegmentDisplay value="82-0" label="82 Siege, 0 Niederlagen" />
        </div>
        <p className="board__caption">Stell deine Starting Five aus echten Gehältern zusammen. Schaffst du die perfekte Saison?</p>
      </section>

      <div className="stack">
        <button type="button" className="btn btn--main" onClick={onDaily}>
          Tagesrätsel #{puzzleNo}
          <span className="btn__sub">{dailySub}</span>
        </button>
        <button type="button" className="btn btn--quiet" onClick={onFree}>
          Freies Spiel
          <span className="btn__sub">So oft du willst, jedes Mal neue Angebote</span>
        </button>
      </div>

      {!storageOk && <p className="muted">Dein Browser speichert gerade nichts. Fortschritt und Statistik gehen beim Schließen verloren.</p>}

      <nav className="footer-nav" aria-label="Mehr">
        <button type="button" className="btn btn--small btn--quiet" onClick={onStats}>Statistik</button>
        <button type="button" className="btn btn--small btn--quiet" onClick={onRules}>Regeln</button>
        <button type="button" className="btn btn--small btn--quiet" onClick={onSettings}>Einstellungen</button>
      </nav>
    </>
  );
}
