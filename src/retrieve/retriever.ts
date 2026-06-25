import type { Chunk, Embedder, Evidence } from "../types.js";
import { Bm25 } from "./bm25.js";
import { cosine } from "../math.js";
import { contentSet, coverage } from "../text/normalize.js";

function ranks(scores: number[]): number[] {
  const idx = scores.map((_, i) => i).sort((a, b) => scores[b]! - scores[a]! || a - b);
  const r = new Array<number>(scores.length).fill(0);
  idx.forEach((i, pos) => {
    r[i] = pos + 1;
  });
  return r;
}

export class Retriever {
  private chunks: Chunk[];
  private bm: Bm25;
  private vecs: Float32Array[];
  private sets: Array<Set<string>>;
  private emb: Embedder;

  private constructor(chunks: Chunk[], emb: Embedder, vecs: Float32Array[]) {
    this.chunks = chunks;
    this.emb = emb;
    this.vecs = vecs;
    this.bm = new Bm25(chunks.map((c) => c.text));
    this.sets = chunks.map((c) => contentSet(c.text));
  }

  static async build(chunks: Chunk[], emb: Embedder): Promise<Retriever> {
    const vecs = chunks.length > 0 ? await emb.embed(chunks.map((c) => c.text)) : [];
    return new Retriever(chunks, emb, vecs);
  }

  async top(claim: string, k: number): Promise<Evidence[]> {
    if (this.chunks.length === 0) return [];
    const bs = this.bm.score(claim);
    const qv = (await this.emb.embed([claim]))[0]!;
    const cs = this.chunks.map((_, i) => cosine(qv, this.vecs[i]!));
    const rb = ranks(bs);
    const rc = ranks(cs);
    const qset = contentSet(claim);
    const ev: Evidence[] = this.chunks.map((c, i) => ({
      chunk: c,
      fused: 1 / (60 + rb[i]!) + 1 / (60 + rc[i]!),
      cos: cs[i]!,
      lex: coverage(qset, this.sets[i]!)
    }));
    ev.sort((a, b) => b.fused - a.fused || b.lex - a.lex);
    return ev.slice(0, Math.max(0, Math.floor(k)));
  }
}
