import type { Categories } from "../game/types";

const LABELS: [keyof Categories, string][] = [
  ["shooter", "Werfer"], ["finisher", "Finisher"], ["playmaking", "Playmaking"], ["rebound", "Rebound"], ["defense", "Defense"],
];

export function CategoryBars({ cats }: { cats: Categories }) {
  return (
    <dl className="cats">
      {LABELS.map(([key, label]) => {
        const value = Math.round(cats[key]);
        return (
          <div key={key} className="cats__row">
            <dt>{label}</dt>
            <dd>
              <span className="cats__track" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={99} aria-valuenow={value}>
                <span className="cats__fill" style={{ width: `${(value / 99) * 100}%` }} />
              </span>
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
