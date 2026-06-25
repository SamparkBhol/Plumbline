import type { Evidence, Span } from "../types.js";
import { sentences } from "../text/segment.js";
import { contentSet, coverage } from "../text/normalize.js";

export function bestSentence(claim: string, text: string): string {
  const segs = sentences(text);
  if (segs.length <= 1) return text;
  const qs = contentSet(claim);
  let best = -1;
  let pick = text;
  for (const s of segs) {
    const c = coverage(qs, contentSet(s.text));
    if (c > best) {
      best = c;
      pick = s.text;
    }
  }
  return pick;
}

export function attribute(claim: string, ev: Evidence | null): Span | null {
  if (ev === null) return null;
  const segs = sentences(ev.chunk.text);
  if (segs.length === 0) return null;
  const qs = contentSet(claim);
  let best = 0;
  let pick = -1;
  segs.forEach((s, i) => {
    const c = coverage(qs, contentSet(s.text));
    if (c > best) {
      best = c;
      pick = i;
    }
  });
  if (pick < 0 || best <= 0) return null;
  const s = segs[pick]!;
  return {
    src: ev.chunk.src,
    chunk: ev.chunk.id,
    start: ev.chunk.start + s.start,
    end: ev.chunk.start + s.end,
    text: s.text
  };
}
