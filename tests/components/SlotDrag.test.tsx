import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SlotBar } from "../../src/components/SlotBar";
import { makePlayer } from "../helpers/fixtures";

const fc = makePlayer({ id: "fc", name: "Groß Mann", positions: ["F", "C"] });
const g = makePlayer({ id: "g", name: "Klein Mann", positions: ["G"] });

describe("SlotBar zum Umstellen", () => {
  afterEach(() => vi.restoreAllMocks());

  it("zeigt die Spieler auf ihren gespeicherten Plätzen", () => {
    render(<SlotBar picks={[fc, g]} slots={["g", null, "fc", null, null]} />);
    const slots = screen.getAllByRole("listitem");
    expect(slots[0]).toHaveTextContent("Klein Mann");
    expect(slots[2]).toHaveTextContent("Groß Mann");
    expect(slots[4]).toHaveTextContent("frei");
  });

  it("verschiebt per Antippen: erst Spieler, dann Zielplatz", () => {
    const onMove = vi.fn();
    render(<SlotBar picks={[fc, g]} slots={["g", null, "fc", null, null]} onMove={onMove} />);
    fireEvent.click(screen.getByRole("button", { name: /Groß Mann/ }));
    expect(screen.getByRole("button", { name: /Groß Mann/ })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: /^C: frei/ }));
    expect(onMove).toHaveBeenCalledWith(2, 4);
  });

  it("bietet beim Antippen nur passende Zielplätze an", () => {
    const onMove = vi.fn();
    render(<SlotBar picks={[fc, g]} slots={["g", null, "fc", null, null]} onMove={onMove} />);
    fireEvent.click(screen.getByRole("button", { name: /Klein Mann/ }));
    expect(screen.getByRole("button", { name: /^C: frei/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /^G: frei/ })).not.toBeDisabled();
  });

  it("verschiebt per Ziehen mit der Maus auf einen anderen Platz", () => {
    const onMove = vi.fn();
    render(<SlotBar picks={[fc, g]} slots={["g", null, "fc", null, null]} onMove={onMove} />);
    const target = screen.getByRole("button", { name: /^C: frei/ });
    vi.spyOn(document, "elementFromPoint").mockReturnValue(target);
    const source = screen.getByRole("button", { name: /Groß Mann/ });
    fireEvent.pointerDown(source, { pointerType: "mouse", clientX: 10, clientY: 10, button: 0 });
    fireEvent.pointerMove(window, { pointerType: "mouse", clientX: 80, clientY: 10 });
    fireEvent.pointerUp(window, { pointerType: "mouse", clientX: 80, clientY: 10 });
    expect(onMove).toHaveBeenCalledWith(2, 4);
  });
});
