import { describe, expect, it } from "vitest";
import { normalizeName } from "../../src/model/names";

describe("normalizeName", () => {
  it.each([
    ["Luka Dončić", "luka doncic"],
    ["Jaren Jackson Jr.", "jaren jackson"],
    ["Shaquille O'Neal", "shaquille oneal"],
    ["Nikola Jokić", "nikola jokic"],
    ["P.J. Tucker", "pj tucker"],
    ["  Gary   Payton II ", "gary payton"],
    ["D’Angelo Russell", "dangelo russell"],
    ["Jrue Holiday", "jrue holiday"],
    ["Player Sr.", "player"],
    ["Player III", "player"],
    ["Player IV", "player"],
  ])("normalisiert %s zu %s", (name, expected) => {
    expect(normalizeName(name)).toBe(expected);
  });
});
