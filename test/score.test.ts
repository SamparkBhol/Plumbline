import { describe, it, expect } from "vitest";
import { LexNli } from "../src/entail/nli.js";
import { scoreClaim } from "../src/entail/score.js";
import type { Evidence } from "../src/types.js";

const nli = new LexNli();

function ev(text: string): Evidence {
  return { chunk: { id: "c", src: "s", text, start: 0, end: text.length }, fused: 1, cos: 1, lex: 1 };
}

describe("LexNli", () => {
  it("entails when the premise covers the hypothesis", async () => {
    const r = await nli.score("The system stores user data on disk every night.", "The system stores user data.");
    expect(r.entail).toBeGreaterThan(0.6);
    expect(r.contra).toBe(0);
  });

  it("contradicts on a negation flip with shared content", async () => {
    const r = await nli.score("The system stores user data on disk.", "The system stores no user data on disk.");
    expect(r.contra).toBeGreaterThanOrEqual(0.5);
    expect(r.entail).toBe(0);
  });

  it("stays neutral when content barely overlaps", async () => {
    const r = await nli.score("Servers keep records in memory.", "Penguins migrate across the ice.");
    expect(r.entail).toBeLessThan(0.3);
  });

  it("contradicts when the source denies a positive claim", async () => {
    const r = await nli.score("The drug is not a cure.", "The drug is a cure.");
    expect(r.contra).toBeGreaterThanOrEqual(0.5);
    expect(r.entail).toBe(0);
  });

  it("withholds support when a numeric claim does not match", async () => {
    const r = await nli.score("The median latency is 180 milliseconds.", "The median latency is 2 seconds.");
    expect(r.entail).toBeLessThan(0.5);
  });
});

describe("scoreClaim", () => {
  it("takes the strongest support and contradiction across evidence", async () => {
    const claim = "The system stores user data on disk.";
    const list = [ev("Unrelated text about birds and trees."), ev("The system stores user data on disk nightly.")];
    const s = await scoreClaim(claim, list, nli, 0.1);
    expect(s.support).toBeGreaterThan(0.6);
    expect(s.ePick!.chunk.text).toContain("stores user data");
  });
});
