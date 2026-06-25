const stop = new Set([
  "a", "an", "the", "of", "to", "in", "on", "at", "by", "for", "with", "as",
  "is", "are", "was", "were", "be", "been", "being", "and", "or", "but", "if",
  "then", "than", "that", "this", "these", "those", "it", "its", "they", "them",
  "their", "he", "she", "his", "her", "we", "our", "you", "your", "i", "from",
  "into", "over", "under", "about", "which", "who", "whom", "whose", "there",
  "here", "so", "such", "can", "could", "will", "would", "may", "might", "do",
  "does", "did", "has", "have", "had", "also", "more", "most", "very", "much"
]);

const neg = new Set([
  "not", "no", "never", "none", "cannot", "without", "neither", "nor",
  "isnt", "arent", "wasnt", "werent", "dont", "doesnt", "didnt", "wont",
  "cant", "couldnt", "wouldnt", "shouldnt", "fails", "failed", "unable",
  "lacks", "absent", "excludes", "excluding"
]);

export function tokenize(text: string): string[] {
  const m = text.toLowerCase().match(/[a-z0-9]+/g);
  return m ?? [];
}

export function content(text: string): string[] {
  return tokenize(text).filter((t) => !stop.has(t) && t.length > 1);
}

export function contentSet(text: string): Set<string> {
  return new Set(content(text));
}

export function isStop(t: string): boolean {
  return stop.has(t);
}

export function hasNeg(text: string): boolean {
  const tk = tokenize(text);
  for (const t of tk) {
    if (neg.has(t)) return true;
  }
  return /n['’]?t\b/.test(text.toLowerCase());
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) {
    if (b.has(x)) inter += 1;
  }
  const uni = a.size + b.size - inter;
  return uni === 0 ? 0 : inter / uni;
}

export function coverage(hyp: Set<string>, prem: Set<string>): number {
  if (hyp.size === 0) return 0;
  let hit = 0;
  for (const x of hyp) {
    if (prem.has(x)) hit += 1;
  }
  return hit / hyp.size;
}
