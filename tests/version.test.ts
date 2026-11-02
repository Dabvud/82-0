import { describe, expect, it } from "vitest";
import { versionFromDescribe } from "../src/version";

describe("versionFromDescribe", () => {
  it("zählt die Commits seit dem Tag auf die Patch-Nummer", () => {
    expect(versionFromDescribe("v1.0.0-7-g1fe52dc", "0.0.0")).toBe("v1.0.7");
    expect(versionFromDescribe("v1.2.3-0-gabcdef0", "0.0.0")).toBe("v1.2.3");
  });

  it("fällt ohne passenden Tag auf die package.json-Version zurück", () => {
    expect(versionFromDescribe("", "1.0.0")).toBe("v1.0.0");
    expect(versionFromDescribe("1fe52dc", "1.0.0")).toBe("v1.0.0");
  });
});
