import { describe, it, expect } from "vitest";
import { decompose } from "../src/text/claims.js";

describe("decompose", () => {
  it("splits on sentence boundaries", () => {
    const d = decompose("Alpha holds. Beta follows.");
    expect(d).toHaveLength(2);
    expect(d[0]!.text).toBe("Alpha holds.");
  });

  it("splits independent clauses on a semicolon", () => {
    const d = decompose("The cache is warm; the latency is low.");
    expect(d).toHaveLength(2);
  });

  it("keeps coordinated verb phrases as one claim", () => {
    const d = decompose("Plumbline runs locally and needs no keys.");
    expect(d).toHaveLength(1);
  });

  it("leaves pronouns untouched rather than inventing a subject", () => {
    const d = decompose("Alice met Bob. He left.");
    expect(d).toHaveLength(2);
    expect(d[1]!.text).toBe("He left.");
  });

  it("maps offsets back to the source", () => {
    const text = "Alpha holds. Beta follows.";
    const d = decompose(text);
    for (const c of d) {
      expect(text.slice(c.start, c.end)).toBe(c.raw);
    }
  });
});
