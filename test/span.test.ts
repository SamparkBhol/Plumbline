import { describe, it, expect } from "vitest";
import { attribute } from "../src/attribute/span.js";
import type { Evidence } from "../src/types.js";

describe("attribute", () => {
  it("locates the most overlapping evidence sentence with correct offsets", () => {
    const text = "Cats nap often. Servers store user data on disk.";
    const ev: Evidence = {
      chunk: { id: "s0:0", src: "s0", text, start: 10, end: 10 + text.length },
      fused: 1,
      cos: 1,
      lex: 1
    };
    const span = attribute("user data on disk", ev);
    expect(span).not.toBeNull();
    expect(span!.text).toBe("Servers store user data on disk.");
    expect(span!.start).toBe(10 + 16);
    expect(span!.src).toBe("s0");
  });

  it("returns null when nothing overlaps", () => {
    const text = "Cats nap often.";
    const ev: Evidence = {
      chunk: { id: "s0:0", src: "s0", text, start: 0, end: text.length },
      fused: 1,
      cos: 0,
      lex: 0
    };
    expect(attribute("quantum entanglement", ev)).toBeNull();
  });

  it("returns null for missing evidence", () => {
    expect(attribute("anything", null)).toBeNull();
  });
});
