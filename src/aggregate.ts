import type { Claim, ClaimResult, Engine, Evidence, Report, Settings, Verdict } from "./types.js";
import type { ClaimScore } from "./entail/score.js";
import { calib } from "./entail/calibrate.js";
import { attribute } from "./attribute/span.js";
import { clamp01 } from "./math.js";

export function judge(score: ClaimScore, st: Settings): Verdict {
  if (score.contra >= st.contraFloor && score.contra > score.support) return "contradicted";
  if (score.support >= st.supportFloor) return "supported";
  return "unsupported";
}

export function buildClaim(claim: Claim, ev: Evidence[], score: ClaimScore, st: Settings): ClaimResult {
  const scored = score.ePick !== null || score.cPick !== null;
  const verdict: Verdict = scored ? judge(score, st) : "unverifiable";
  const pick = verdict === "contradicted" ? score.cPick : score.ePick;
  const span = verdict === "unverifiable" ? null : attribute(claim.text, pick);
  let conf = 0;
  if (verdict === "supported") conf = calib(score.support, st.temp);
  else if (verdict === "contradicted") conf = calib(score.contra, st.temp);
  else if (verdict === "unsupported") conf = calib(1 - score.support, st.temp);
  return {
    claim,
    verdict,
    confidence: conf,
    support: clamp01(score.support),
    contra: clamp01(score.contra),
    span,
    evidence: ev
  };
}

export function assemble(results: ClaimResult[], engine: Engine): Report {
  const counts: Record<Verdict, number> = {
    supported: 0,
    unsupported: 0,
    contradicted: 0,
    unverifiable: 0
  };
  let sum = 0;
  let den = 0;
  for (const r of results) {
    counts[r.verdict] += 1;
    if (r.verdict !== "unverifiable") {
      den += 1;
      sum += r.verdict === "contradicted" ? 0 : r.support;
    }
  }
  const score = den > 0 ? sum / den : null;
  const coverage = results.length > 0 ? den / results.length : 0;
  const flagged = results.filter((r) => r.verdict === "unsupported" || r.verdict === "contradicted");
  return { score, coverage, engine, claims: results, counts, flagged };
}
