import { describe, it, expect } from "vitest";
import { guard } from "../src/guard.js";
import { sources } from "./fixtures/cases.js";

describe("guard", () => {
  it("passes a grounded answer", async () => {
    const fn = async (_q: string) => "Plumbline runs entirely on local models and needs no api keys.";
    const wrapped = guard(fn, sources, { engine: "lexical", min: 0.5 });
    const out = await wrapped("anything");
    expect(out.ok).toBe(true);
    expect(out.report.score).toBeGreaterThan(0.5);
  });

  it("rejects a fabricated answer", async () => {
    const fn = async () => "Plumbline was founded on Mars in 1066.";
    const wrapped = guard(fn, sources, { engine: "lexical", min: 0.5 });
    const out = await wrapped();
    expect(out.ok).toBe(false);
  });

  it("pulls the answer field from an object result", async () => {
    const fn = async () => ({ answer: "Plumbline is written in TypeScript.", id: 7 });
    const wrapped = guard(fn, sources, { engine: "lexical", min: 0.4 });
    const out = await wrapped();
    expect(out.answer).toContain("TypeScript");
    expect(out.value.id).toBe(7);
  });
});
