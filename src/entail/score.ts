import type { Evidence, Nli } from "../types.js";
import { bestSentence } from "../attribute/span.js";

export interface ClaimScore {
  support: number;
  contra: number;
  ePick: Evidence | null;
  cPick: Evidence | null;
}

function rel(e: Evidence): number {
  return Math.max(e.cos >= 0.25 ? e.cos : 0, e.lex);
}

export async function scoreClaim(claim: string, ev: Evidence[], nli: Nli, relFloor: number): Promise<ClaimScore> {
  let support = 0;
  let contra = 0;
  let ePick: Evidence | null = null;
  let cPick: Evidence | null = null;
  for (const e of ev) {
    if (rel(e) < relFloor) continue;
    const f = await nli.score(bestSentence(claim, e.chunk.text), claim);
    if (ePick === null || f.entail > support) {
      support = f.entail;
      ePick = e;
    }
    if (cPick === null || f.contra > contra) {
      contra = f.contra;
      cPick = e;
    }
  }
  return { support, contra, ePick, cPick };
}
