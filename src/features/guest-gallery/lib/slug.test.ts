import { describe, expect, it } from "vitest";
import { generateSlug, kebabify, isValidSlug } from "./slug";

describe("slug", () => {
  it("kebabifies title", () => {
    expect(kebabify("Andini & Reza Wedding")).toBe("andini-reza-wedding");
    expect(kebabify("Dinner @ The Place 2026!")).toBe("dinner-the-place-2026");
    expect(kebabify("   spaces   ")).toBe("spaces");
    expect(kebabify("")).toBe("album");
  });
  it("generates slug with 5-char prefix and kebab title", () => {
    expect(generateSlug("Andini & Reza")).toMatch(/^[a-z0-9]{5}-andini-reza$/);
  });
  it("validates well-formed slug", () => {
    expect(isValidSlug("abc12-andini-reza")).toBe(true);
    expect(isValidSlug("xy9z0-x")).toBe(true);
    expect(isValidSlug("abc12")).toBe(false);
    expect(isValidSlug("ABC12-x")).toBe(false);
    expect(isValidSlug("")).toBe(false);
  });
  it("truncates very long titles", () => {
    expect(generateSlug("a".repeat(200)).length).toBeLessThanOrEqual(86);
  });
});
