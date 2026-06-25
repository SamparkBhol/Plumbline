import { describe, it, expect } from "vitest";
import { verify } from "../src/verify.js";
import { answer, sources } from "./fixtures/cases.js";

const run = process.env.PLUMBLINE_E2E ? describe : describe.skip;

run("transformer engine", () => {
  it("loads local models and judges claims by meaning", async () => {
    const r = await verify(answer, sources, { engine: "transformer" });
    expect(r.engine).toBe("transformer");
    const find = (s: string) => r.claims.find((c) => c.claim.raw.includes(s) || c.claim.text.includes(s));
    expect(find("local models")!.verdict).toBe("supported");
    expect(find("stores no user data")!.verdict).toBe("contradicted");
    expect(r.score).toBeGreaterThan(0);
    expect(r.score).toBeLessThanOrEqual(1);
  }, 120000);
});
