import { describe, expect, it } from "vitest";
import { viewportState } from "../src/viewport";

describe("sichtbarer Bereich", () => {
  it("nutzt ohne visualViewport die Fensterhöhe", () => {
    expect(viewportState(null, 844)).toEqual({height: 844, top: 0, keyboardOpen: false});
  });
  it("erkennt die offene Tastatur am geschrumpften sichtbaren Bereich", () => {
    expect(viewportState({height: 420, offsetTop: 0}, 844)).toEqual({height: 420, top: 0, keyboardOpen: true});
  });
  it("folgt einer von iOS verschobenen Ansicht", () => {
    expect(viewportState({height: 420, offsetTop: 300}, 844).top).toBe(300);
  });
  it("hält eine leicht kleinere Ansicht (Adressleiste) nicht für eine Tastatur", () => {
    expect(viewportState({height: 760, offsetTop: 0}, 844).keyboardOpen).toBe(false);
  });
});
