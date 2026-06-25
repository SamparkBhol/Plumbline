import { describe, it, expect } from "vitest";
import { Bm25 } from "../src/retrieve/bm25.js";

describe("Bm25", () => {
  it("ranks the document containing the query term highest", () => {
    const bm = new Bm25(["the cat sat on a mat", "a dog ran far", "fish swim deep"]);
    const s = bm.score("cat");
    const best = s.indexOf(Math.max(...s));
    expect(best).toBe(0);
  });

  it("scores zero when no term matches", () => {
    const bm = new Bm25(["alpha beta", "gamma delta"]);
    const s = bm.score("omega");
    expect(s.every((x) => x === 0)).toBe(true);
  });

  it("rewards rarer terms more than common ones", () => {
    const bm = new Bm25(["common term here", "common word there", "common rare token"]);
    const rare = bm.score("rare");
    const common = bm.score("common");
    expect(Math.max(...rare)).toBeGreaterThan(Math.max(...common));
  });
});
