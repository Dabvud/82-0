import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SegmentDisplay } from "../../src/components/SegmentDisplay";

function litSegments(glyph: Element): string[] {
  return [...glyph.querySelectorAll("[data-seg][data-lit='true']")].map((s) => s.getAttribute("data-seg")!);
}

describe("SegmentDisplay", () => {
  it("liest sich für Screenreader als Klartext", () => {
    render(<SegmentDisplay value="82-0" label="Ziel: 82 Siege, 0 Niederlagen" />);
    expect(screen.getByRole("img", { name: "Ziel: 82 Siege, 0 Niederlagen" })).toBeInTheDocument();
  });

  it("zeichnet je Zeichen eine Ziffer mit den richtigen leuchtenden Segmenten", () => {
    const { container } = render(<SegmentDisplay value="81" label="81" />);
    const glyphs = container.querySelectorAll("[data-glyph]");
    expect(glyphs).toHaveLength(2);
    expect(litSegments(glyphs[0]).sort()).toEqual(["a", "b", "c", "d", "e", "f", "g"]);
    expect(litSegments(glyphs[1]).sort()).toEqual(["b", "c"]);
  });

  it("zeigt den Bindestrich als mittleres Segment und unbeleuchtete Segmente bleiben sichtbar", () => {
    const { container } = render(<SegmentDisplay value="-" label="-" />);
    const glyph = container.querySelector("[data-glyph]")!;
    expect(litSegments(glyph)).toEqual(["g"]);
    expect(glyph.querySelectorAll("[data-seg]")).toHaveLength(7);
  });

  it("füllt mit führenden Leerstellen auf, wenn eine Mindestbreite verlangt ist", () => {
    const { container } = render(<SegmentDisplay value="7" label="7" minDigits={2} />);
    const glyphs = container.querySelectorAll("[data-glyph]");
    expect(glyphs).toHaveLength(2);
    expect(litSegments(glyphs[0])).toEqual([]);
  });
});
