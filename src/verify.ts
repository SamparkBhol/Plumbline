import type { ClaimResult, Report, Sources, VerifyOpts } from "./types.js";
import { settle } from "./config.js";
import { providers } from "./models/registry.js";
import { chunkSources } from "./chunk.js";
import { decompose } from "./text/claims.js";
import { Retriever } from "./retrieve/retriever.js";
import { scoreClaim } from "./entail/score.js";
import { buildClaim, assemble } from "./aggregate.js";

export async function verify(answer: string, sources: Sources, opts: VerifyOpts = {}): Promise<Report> {
  const st = settle(opts);
  const prov = await providers(opts);
  const chunks = chunkSources(sources, st.chunk);
  const retr = await Retriever.build(chunks, prov.embedder);
  const claims = decompose(answer);
  const results: ClaimResult[] = [];
  for (const c of claims) {
    const ev = await retr.top(c.text, st.topK);
    const sc = await scoreClaim(c.text, ev, prov.nli, st.relFloor);
    results.push(buildClaim(c, ev, sc, st));
  }
  return assemble(results, prov.engine);
}
