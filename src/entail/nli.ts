import type { Nli, NliScores } from "../types.js";
import { contentSet, coverage, hasNeg } from "../text/normalize.js";
import { softmax } from "../math.js";

function norm(e: number, n: number, c: number): NliScores {
  const s = e + n + c;
  if (s <= 0) return { entail: 0, neutral: 1, contra: 0 };
  return { entail: e / s, neutral: n / s, contra: c / s };
}

function nums(s: string): Set<string> {
  return new Set(s.match(/\d+(?:\.\d+)?/g) ?? []);
}

function numbersMatch(hyp: string, prem: string): boolean {
  const h = nums(hyp);
  if (h.size === 0) return true;
  const p = nums(prem);
  for (const x of h) {
    if (!p.has(x)) return false;
  }
  return true;
}

export class LexNli implements Nli {
  readonly engine = "lexical" as const;

  async score(premise: string, hyp: string): Promise<NliScores> {
    const ps = contentSet(premise);
    const hs = contentSet(hyp);
    if (hs.size === 0) return { entail: 0, neutral: 1, contra: 0 };
    const cov = coverage(hs, ps);
    if (hasNeg(hyp) !== hasNeg(premise) && cov >= 0.5) return norm(0, 1 - cov, cov);
    if (!numbersMatch(hyp, premise)) {
      const e = Math.min(cov, 0.3);
      return norm(e, 1 - e, 0);
    }
    return norm(cov, 1 - cov, 0);
  }
}

export type Logits = (premise: string, hyp: string) => Promise<number[]>;

export class TransformerNli implements Nli {
  readonly engine = "transformer" as const;
  private run: Logits;
  private labels: string[];

  constructor(run: Logits, labels: string[]) {
    this.run = run;
    this.labels = labels;
  }

  async score(premise: string, hyp: string): Promise<NliScores> {
    const p = softmax(await this.run(premise, hyp));
    let e = 0;
    let n = 0;
    let c = 0;
    this.labels.forEach((lab, i) => {
      const v = p[i] ?? 0;
      const l = lab.toLowerCase();
      if (l.startsWith("entail")) e = v;
      else if (l.startsWith("neutral")) n = v;
      else if (l.startsWith("contradic")) c = v;
    });
    return norm(e, n, c);
  }
}
