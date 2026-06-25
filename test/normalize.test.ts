import { describe, it, expect } from "vitest";
import { tokenize, content, hasNeg, coverage, jaccard, contentSet } from "../src/text/normalize.js";

describe("normalize", () => {
  it("tokenizes to lowercase word tokens", () => {
    expect(tokenize("The Cat, sat!")).toEqual(["the", "cat", "sat"]);
  });

  it("drops stopwords from content", () => {
    expect(content("the system stores the data")).toEqual(["system", "stores", "data"]);
  });

  it("detects explicit negation", () => {
    expect(hasNeg("the service does not store data")).toBe(true);
    expect(hasNeg("the service stores no data")).toBe(true);
    expect(hasNeg("the service stores data")).toBe(false);
  });

  it("detects contracted negation", () => {
    expect(hasNeg("it isn't supported")).toBe(true);
  });

  it("computes coverage of a hypothesis by a premise", () => {
    const h = contentSet("user data disk");
    const p = contentSet("the server keeps user data on a disk");
    expect(coverage(h, p)).toBeCloseTo(1, 5);
  });

  it("computes jaccard overlap", () => {
    expect(jaccard(new Set(["a", "b"]), new Set(["b", "c"]))).toBeCloseTo(1 / 3, 5);
  });
});
