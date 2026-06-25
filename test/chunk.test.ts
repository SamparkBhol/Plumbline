import { describe, it, expect } from "vitest";
import { chunkSources, asSources } from "../src/chunk.js";

describe("asSources", () => {
  it("wraps a single string", () => {
    expect(asSources("hello")).toEqual([{ id: "s0", text: "hello" }]);
  });
  it("assigns ids to an array of strings", () => {
    const out = asSources(["a", "b"]);
    expect(out.map((s) => s.id)).toEqual(["s0", "s1"]);
  });
  it("passes through objects unchanged", () => {
    expect(asSources({ id: "x", text: "y" })).toEqual([{ id: "x", text: "y" }]);
  });
});

describe("chunkSources", () => {
  const text = "One two three four. Five six seven eight. Nine ten eleven twelve.";

  it("produces several chunks under a small size budget", () => {
    const cs = chunkSources(text, { size: 25, overlap: 6 });
    expect(cs.length).toBeGreaterThan(1);
  });

  it("keeps chunk text aligned to source offsets", () => {
    const cs = chunkSources(text, { size: 25, overlap: 6 });
    for (const c of cs) {
      expect(text.slice(c.start, c.end)).toBe(c.text);
    }
  });

  it("starts at the beginning of the source", () => {
    const cs = chunkSources(text, { size: 25, overlap: 6 });
    expect(cs[0]!.start).toBe(0);
  });
});
