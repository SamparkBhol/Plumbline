import { describe, it, expect } from "vitest";
import { Retriever } from "../src/retrieve/retriever.js";
import { LexEmbedder } from "../src/retrieve/embed.js";
import type { Chunk } from "../src/types.js";

const chunks: Chunk[] = [
  { id: "a:0", src: "a", text: "Cats chase mice across the old barn.", start: 0, end: 36 },
  { id: "b:0", src: "b", text: "Servers store user data on disk for retrieval.", start: 0, end: 46 }
];

describe("Retriever", () => {
  it("ranks the most relevant chunk first", async () => {
    const r = await Retriever.build(chunks, new LexEmbedder());
    const top = await r.top("where is user data stored on disk", 2);
    expect(top[0]!.chunk.src).toBe("b");
  });

  it("reports zero lexical relevance for unrelated claims", async () => {
    const r = await Retriever.build(chunks, new LexEmbedder());
    const top = await r.top("quantum entanglement of distant particles", 2);
    expect(top[0]!.lex).toBe(0);
  });

  it("returns nothing when there are no chunks", async () => {
    const r = await Retriever.build([], new LexEmbedder());
    expect(await r.top("anything", 3)).toHaveLength(0);
  });
});
