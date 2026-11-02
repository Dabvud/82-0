import { formatMoney } from "../format";

interface Props {
  spent: number;
  budget: number;
  luxuryLine: number;
  bankruptcyOn: boolean;
}

export function BudgetBar({ spent, budget, luxuryLine, bankruptcyOn }: Props) {
  const fill = Math.min(100, (spent / budget) * 100);
  const marker = (luxuryLine / budget) * 100;
  const overLuxury = spent > luxuryLine;
  return (
    <div className="budget">
      <div className="budget__head">
        <span className="budget__rest">{formatMoney(Math.max(0, budget - spent))} übrig</span>
        {overLuxury && bankruptcyOn && <span className="budget__risk">⚠️ 10 % Pleiterisiko</span>}
      </div>
      <div className="budget__track" aria-hidden="true">
        {/* Verlauf Grün → Gelb → Rot über das ganze Budget; die Füllung zeigt den Ausschnitt bis zu ihrer Position. */}
        <div className="budget__fill" style={{ width: `${fill}%`, backgroundSize: `${fill > 0 ? Math.round(10000 / fill) : 100}% 100%` }} />
        <div className="budget__marker" data-testid="luxury-marker" style={{ left: `${marker}%` }} title="Luxussteuergrenze" />
      </div>
    </div>
  );
}
