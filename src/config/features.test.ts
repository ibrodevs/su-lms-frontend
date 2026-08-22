import { describe, expect, it } from "vitest";
import { parseFeatureFlag } from "./features";

describe("feature flags", () => {
  it("enables only an explicit true value", () => {
    expect(parseFeatureFlag(true)).toBe(true);
    expect(parseFeatureFlag("true")).toBe(true);
    expect(parseFeatureFlag("false")).toBe(false);
    expect(parseFeatureFlag(undefined)).toBe(false);
  });
});
