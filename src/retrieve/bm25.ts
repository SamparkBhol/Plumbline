import { tokenize } from "../text/normalize.js";

export class Bm25 {
  private tfs: Array<Map<string, number>>;
  private len: number[];
  private idf: Map<string, number>;
  private avg: number;
  private k1 = 1.5;
  private b = 0.75;

  constructor(texts: string[]) {
    const docs = texts.map(tokenize);
    this.len = docs.map((d) => d.length);
    const n = docs.length;
    this.avg = n > 0 ? this.len.reduce((a, c) => a + c, 0) / n : 0;
    this.tfs = docs.map((d) => {
      const m = new Map<string, number>();
      for (const t of d) m.set(t, (m.get(t) ?? 0) + 1);
      return m;
    });
    const df = new Map<string, number>();
    for (const m of this.tfs) {
      for (const t of m.keys()) df.set(t, (df.get(t) ?? 0) + 1);
    }
    this.idf = new Map();
    for (const [t, f] of df) {
      this.idf.set(t, Math.log(1 + (n - f + 0.5) / (f + 0.5)));
    }
  }

  score(query: string): number[] {
    const q = new Set(tokenize(query));
    const out = new Array<number>(this.tfs.length).fill(0);
    const avg = this.avg > 0 ? this.avg : 1;
    for (let i = 0; i < this.tfs.length; i += 1) {
      const tf = this.tfs[i]!;
      const dl = this.len[i]!;
      let s = 0;
      for (const t of q) {
        const f = tf.get(t);
        if (!f) continue;
        const idf = this.idf.get(t) ?? 0;
        const denom = f + this.k1 * (1 - this.b + this.b * (dl / avg));
        s += idf * ((f * (this.k1 + 1)) / denom);
      }
      out[i] = s;
    }
    return out;
  }
}
