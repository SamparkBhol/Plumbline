import type { Claim } from "../types.js";
import { sentences } from "./segment.js";
import { tokenize } from "./normalize.js";

const verbs = new Set([
  "is", "are", "was", "were", "be", "been", "being", "has", "have", "had",
  "does", "did", "will", "would", "can", "could", "may", "might", "should",
  "includes", "include", "contains", "contain", "provides", "provide",
  "supports", "support", "uses", "use", "requires", "require", "returns",
  "return", "raised", "reported", "increased", "reduced", "launched", "offers",
  "offer", "enables", "enable", "allows", "allow", "handles", "handle",
  "detects", "detect", "runs", "run", "builds", "build", "reduces", "improves",
  "improve", "achieves", "achieved", "reached", "added", "removed", "created",
  "released", "published", "found", "shows", "showed", "means", "covers",
  "maps", "scores", "measures", "checks", "verifies", "verify", "costs",
  "grew", "fell", "rose", "ranks", "rank", "scaled", "trains", "serves",
  "sends", "send", "stores", "store", "stored", "exposes", "expose"
]);

interface Piece {
  s: number;
  e: number;
}

function hasVerb(text: string): boolean {
  for (const t of tokenize(text)) {
    if (verbs.has(t)) return true;
    if (t.length > 4 && (t.endsWith("ed") || t.endsWith("ing"))) return true;
  }
  return false;
}

function rawSplit(text: string): Piece[] {
  const out: Piece[] = [];
  const re = /;/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    out.push({ s: last, e: m.index });
    last = m.index + m[0].length;
  }
  out.push({ s: last, e: text.length });
  return out.filter((p) => text.slice(p.s, p.e).trim().length > 0);
}

function merge(text: string, ps: Piece[]): Piece[] {
  const res: Piece[] = [];
  for (const p of ps) {
    const seg = text.slice(p.s, p.e);
    const prev = res[res.length - 1];
    if (prev && !hasVerb(seg)) prev.e = p.e;
    else res.push({ s: p.s, e: p.e });
  }
  const head = res[0];
  const second = res[1];
  if (head && second && !hasVerb(text.slice(head.s, head.e))) {
    second.s = head.s;
    res.shift();
  }
  return res;
}

export function decompose(answer: string): Claim[] {
  const segs = sentences(answer);
  const out: Claim[] = [];
  let n = 0;
  segs.forEach((seg, si) => {
    const pieces = merge(seg.text, rawSplit(seg.text));
    pieces.forEach((p) => {
      const slice = seg.text.slice(p.s, p.e);
      const lead = slice.length - slice.replace(/^\s+/, "").length;
      const trimmed = slice.trim();
      if (trimmed.length === 0) return;
      const start = seg.start + p.s + lead;
      const end = start + trimmed.length;
      out.push({ id: "c" + n, text: trimmed, raw: trimmed, sentence: si, start, end });
      n += 1;
    });
  });
  return out;
}
