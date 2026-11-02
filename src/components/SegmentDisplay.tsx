// 7-Segment-Anzeige wie auf einer Hallen-Anzeigetafel: unbeleuchtete Segmente schimmern mit.
type Seg = "a" | "b" | "c" | "d" | "e" | "f" | "g";

const SEGMENTS: Record<Seg, string> = {
  a: "12,4 48,4 54,10 48,16 12,16 6,10",
  b: "56,12 62,18 62,44 56,50 50,44 50,18",
  c: "56,54 62,60 62,86 56,92 50,86 50,60",
  d: "12,88 48,88 54,94 48,100 12,100 6,94",
  e: "4,54 10,60 10,86 4,92 -2,86 -2,60",
  f: "4,12 10,18 10,44 4,50 -2,44 -2,18",
  g: "12,46 48,46 54,52 48,58 12,58 6,52",
};

const GLYPHS: Record<string, Seg[]> = {
  "0": ["a", "b", "c", "d", "e", "f"],
  "1": ["b", "c"],
  "2": ["a", "b", "g", "e", "d"],
  "3": ["a", "b", "g", "c", "d"],
  "4": ["f", "g", "b", "c"],
  "5": ["a", "f", "g", "c", "d"],
  "6": ["a", "f", "g", "e", "c", "d"],
  "7": ["a", "b", "c"],
  "8": ["a", "b", "c", "d", "e", "f", "g"],
  "9": ["a", "b", "c", "d", "f", "g"],
  "-": ["g"],
  " ": [],
};

const ORDER: Seg[] = ["a", "b", "c", "d", "e", "f", "g"];

interface Props {
  value: string;
  label: string;
  minDigits?: number;
  className?: string;
  /** Nur Zierde, wenn ein umgebendes Element den Text schon vorliest. */
  decorative?: boolean;
}

export function SegmentDisplay({ value, label, minDigits = 0, className, decorative = false }: Props) {
  const chars = value.padStart(minDigits, " ").split("");
  return (
    <span className={["segments", className].filter(Boolean).join(" ")} {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": label })}>
      {chars.map((char, index) => {
        const lit = new Set(GLYPHS[char] ?? []);
        return (
          <svg key={index} data-glyph className="segments__glyph" viewBox="-4 0 68 104" aria-hidden="true">
            {ORDER.map((seg) => (
              <polygon key={seg} data-seg={seg} data-lit={lit.has(seg)} points={SEGMENTS[seg]} />
            ))}
          </svg>
        );
      })}
    </span>
  );
}
