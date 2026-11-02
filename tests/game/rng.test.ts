import { describe, expect, it } from "vitest";
import { hash, makeRng, pick, randInt, shuffle } from "../../src/game/rng";

describe("deterministischer Zufall", () => {
  it("verwendet FNV-1a mit 32 Bit", () => {
    expect(hash("")).toBe(0x811c9dc5);
    expect(hash("a")).toBe(0xe40c292c);
    expect(hash("hello")).toBe(0x4f9f2cab);
    expect(hash("a")).not.toBe(hash("b"));
  });

  it("liefert für denselben Seed dieselbe Mulberry32-Folge", () => {
    const a = makeRng(1);
    const b = makeRng(1);
    expect(a()).toBe(0.6270739405881613);
    expect(b()).toBe(0.6270739405881613);
    const sequence = Array.from({ length: 1000 }, () => a());
    expect(sequence).toEqual(Array.from({ length: 1000 }, () => b()));
    expect(sequence.every((n) => n >= 0 && n < 1)).toBe(true);
    expect(sequence).not.toEqual(Array.from({ length: 1000 }, makeRng(2)));
  });

  it("zieht ein Element und berücksichtigt beide ganzzahligen Grenzen", () => {
    expect(pick(() => 0, ["a", "b"])).toBe("a");
    expect(pick(() => 0.999999, ["a", "b"])).toBe("b");
    expect(() => pick(makeRng(1), [])).toThrow();
    expect(randInt(() => 0, -2, 3)).toBe(-2);
    expect(randInt(() => 0.999999, -2, 3)).toBe(3);
    expect(randInt(makeRng(1), 4, 4)).toBe(4);
  });

  it("mischt deterministisch, ohne das Eingabearray zu verändern", () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    const result = shuffle(makeRng(42), items);
    expect(result).toEqual(shuffle(makeRng(42), items));
    expect(result).not.toEqual(items);
    expect([...result].sort()).toEqual(items);
    expect(items).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(shuffle(makeRng(1), [])).toEqual([]);
  });
});
