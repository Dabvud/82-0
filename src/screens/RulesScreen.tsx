export function RulesScreen({ onBack }: { onBack: () => void }) {
  return (
    <>
      <div className="topbar"><h2>So geht 82-0</h2><button type="button" className="iconbtn" onClick={onBack} aria-label="Zurück">✕</button></div>
      <div className="stack rules">
        <p>Du stellst eine Starting Five zusammen: zwei Guards, zwei Forwards, einen Center. Dein Budget liegt bei 140 % des aktuellen Salary Caps.</p>
        <p>Jeder Spieler kostet seinen teuersten Vertrag, umgerechnet auf den heutigen Cap. Seine Stärke kommt aus seinen besten drei Saisons. Wer zu viel verdient hat, ist eine Falle, unterbezahlte Spieler sind Schnäppchen.</p>
        <p>In jeder der fünf Runden liegen in jedem Tier fünf Spieler bereit. Du nimmst einen davon, aus welchem Tier du willst.</p>
        <p>Danach spielt dein Team 82 Spiele. Entscheidend ist, wie gut es zusammenpasst: Ohne Ballverteiler, Werfer oder Rim Protector wird es schwer.</p>
        <p>Bei der Trade Deadline nach Spiel 50 kannst du einen Spieler tauschen. Für einen überbezahlten Spieler gibt es meist wieder Ballast, manchmal einen verletzten Star.</p>
        <p>Liegt dein Kader über 120 % des Caps, kann der Owner pleitegehen. Dann muss ein teurer Spieler gehen.</p>
        <p>60 Siege bringen die Playoffs, 70 machen dich zum Contender, ab 74 hast du den Rekord der Warriors geknackt. 82-0 ist die perfekte Saison.</p>
      </div>
    </>
  );
}
