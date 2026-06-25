import { describe, it, expect } from "vitest";
import { sentences } from "../src/text/segment.js";

describe("sentences", () => {
  it("splits on terminal punctuation", () => {
    const s = sentences("One thing. Two things! Three?");
    expect(s.map((x) => x.text)).toEqual(["One thing.", "Two things!", "Three?"]);
  });

  it("keeps offsets aligned to the source", () => {
    const text = "Alpha is here. Beta follows.";
    const s = sentences(text);
    expect(text.slice(s[1]!.start, s[1]!.end)).toBe("Beta follows.");
  });

  it("does not split common abbreviations", () => {
    const s = sentences("Dr. Lee joined the team. She leads research.");
    expect(s).toHaveLength(2);
    expect(s[0]!.text).toBe("Dr. Lee joined the team.");
  });

  it("does not split decimals", () => {
    const s = sentences("The score is 3.14 today. It holds.");
    expect(s).toHaveLength(2);
  });

  it("returns a trailing fragment without terminal punctuation", () => {
    const s = sentences("No period here");
    expect(s).toHaveLength(1);
    expect(s[0]!.text).toBe("No period here");
  });

  it("returns nothing for blank input", () => {
    expect(sentences("   ")).toHaveLength(0);
  });
});
