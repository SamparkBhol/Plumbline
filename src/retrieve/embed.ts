import type { Embedder } from "../types.js";
import { content } from "../text/normalize.js";

const DIM = 256;

function fnv(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export class LexEmbedder implements Embedder {
  readonly engine = "lexical" as const;

  async embed(texts: string[]): Promise<Float32Array[]> {
    return texts.map((t) => this.one(t));
  }

  private one(text: string): Float32Array {
    const v = new Float32Array(DIM);
    for (const tok of content(text)) {
      v[fnv(tok) % DIM]! += 1;
    }
    let n = 0;
    for (let i = 0; i < DIM; i += 1) n += v[i]! * v[i]!;
    if (n > 0) {
      const inv = 1 / Math.sqrt(n);
      for (let i = 0; i < DIM; i += 1) v[i]! *= inv;
    }
    return v;
  }
}

type Pipe = (text: string, opts: Record<string, unknown>) => Promise<{ data: ArrayLike<number> }>;

export class TransformerEmbedder implements Embedder {
  readonly engine = "transformer" as const;
  private pipe: Pipe;

  constructor(pipe: Pipe) {
    this.pipe = pipe;
  }

  async embed(texts: string[]): Promise<Float32Array[]> {
    const out: Float32Array[] = [];
    for (const t of texts) {
      const r = await this.pipe(t, { pooling: "mean", normalize: true });
      out.push(Float32Array.from(r.data));
    }
    return out;
  }
}
