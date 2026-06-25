import { describe, it, expect } from "vitest";
import { verify } from "../src/verify.js";
import { answer, sources, expected } from "./fixtures/cases.js";

describe("verify", () => {
  it("runs on the deterministic lexical engine", async () => {
    const r = await verify(answer, sources, { engine: "lexical" });
    expect(r.engine).toBe("lexical");
  });

  it("assigns the expected verdict to every planted claim", async () => {
    const r = await verify(answer, sources, { engine: "lexical" });
    for (const [needle, verdict] of Object.entries(expected)) {
      const hit = r.claims.find((c) => c.claim.raw.includes(needle) || c.claim.text.includes(needle));
      expect(hit, needle).toBeDefined();
      expect(hit!.verdict, needle).toBe(verdict);
    }
  });

  it("tallies counts and an overall score within range", async () => {
    const r = await verify(answer, sources, { engine: "lexical" });
    expect(r.counts.supported).toBeGreaterThanOrEqual(2);
    expect(r.counts.contradicted).toBe(1);
    expect(r.counts.unverifiable).toBe(1);
    expect(r.score).toBeGreaterThan(0.4);
    expect(r.score).toBeLessThan(0.7);
  });

  it("attributes a source span for a contradicted claim", async () => {
    const r = await verify(answer, sources, { engine: "lexical" });
    const c = r.claims.find((x) => x.verdict === "contradicted");
    expect(c!.span).not.toBeNull();
    expect(c!.span!.src).toBe("s1");
  });

  it("flags everything that is not supported or unverifiable", async () => {
    const r = await verify(answer, sources, { engine: "lexical" });
    expect(r.flagged.every((f) => f.verdict === "unsupported" || f.verdict === "contradicted")).toBe(true);
  });
});
