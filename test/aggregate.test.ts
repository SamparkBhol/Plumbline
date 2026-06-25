import { describe, it, expect } from "vitest";
import { judge, assemble, buildClaim } from "../src/aggregate.js";
import { defaults } from "../src/config.js";
import type { Claim, ClaimResult, Evidence, Verdict } from "../src/types.js";

const st = defaults;

function ev(): Evidence {
  return { chunk: { id: "x", src: "s", text: "the system works", start: 0, end: 16 }, fused: 1, cos: 1, lex: 1 };
}

function score(support: number, contra: number, scored = true) {
  const e = scored ? ev() : null;
  return { support, contra, ePick: e, cPick: e };
}

function result(verdict: Verdict, support: number): ClaimResult {
  const claim: Claim = { id: "c", text: "t", raw: "t", sentence: 0, start: 0, end: 1 };
  return { claim, verdict, confidence: 0.5, support, contra: 0, span: null, evidence: [] };
}

describe("judge", () => {
  it("marks contradicted when contradiction leads", () => {
    expect(judge(score(0.1, 0.8), st)).toBe("contradicted");
  });
  it("marks supported above the support floor", () => {
    expect(judge(score(0.7, 0.1), st)).toBe("supported");
  });
  it("marks unsupported otherwise", () => {
    expect(judge(score(0.2, 0.1), st)).toBe("unsupported");
  });
});

describe("buildClaim", () => {
  const claim: Claim = { id: "c", text: "the system works", raw: "the system works", sentence: 0, start: 0, end: 16 };

  it("is unverifiable when no evidence was scored", () => {
    const r = buildClaim(claim, [], { support: 0, contra: 0, ePick: null, cPick: null }, st);
    expect(r.verdict).toBe("unverifiable");
    expect(r.span).toBeNull();
  });

  it("is supported when evidence entails", () => {
    const r = buildClaim(claim, [ev()], score(0.9, 0), st);
    expect(r.verdict).toBe("supported");
  });
});

describe("assemble", () => {
  it("scores over verifiable claims", () => {
    const r = assemble(
      [result("supported", 1), result("unsupported", 0.2), result("contradicted", 0.7), result("unverifiable", 0)],
      "lexical"
    );
    expect(r.counts.supported).toBe(1);
    expect(r.counts.contradicted).toBe(1);
    expect(r.score).toBeCloseTo(0.4, 5);
    expect(r.coverage).toBeCloseTo(0.75, 5);
    expect(r.flagged).toHaveLength(2);
  });

  it("returns a null score when nothing is verifiable", () => {
    const r = assemble([result("unverifiable", 0)], "lexical");
    expect(r.score).toBeNull();
    expect(r.coverage).toBe(0);
  });

  it("returns a null score for an empty answer", () => {
    const r = assemble([], "lexical");
    expect(r.score).toBeNull();
    expect(r.coverage).toBe(0);
  });
});
