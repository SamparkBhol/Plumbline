export interface Seg {
  text: string;
  start: number;
  end: number;
}

const abbr = new Set([
  "dr", "mr", "mrs", "ms", "prof", "inc", "ltd", "co", "corp", "vs", "etc",
  "eg", "ie", "fig", "al", "st", "jr", "sr", "no", "vol", "pp", "approx",
  "dept", "gov", "est"
]);

function wordBefore(text: string, i: number): string {
  let j = i - 1;
  let s = "";
  while (j >= 0) {
    const ch = text[j]!;
    if (!/[a-zA-Z]/.test(ch)) break;
    s = ch + s;
    j -= 1;
  }
  return s;
}

function boundary(text: string, i: number): boolean {
  const c = text[i]!;
  if (c === ".") {
    const prev = text[i - 1];
    const next = text[i + 1];
    if (prev && /[0-9]/.test(prev) && next && /[0-9]/.test(next)) return false;
    const w = wordBefore(text, i);
    if (w.length === 1) return false;
    if (abbr.has(w.toLowerCase())) return false;
  }
  let j = i + 1;
  while (j < text.length && /\s/.test(text[j]!)) j += 1;
  if (j >= text.length) return true;
  return /[A-Z0-9"“'(\[]/.test(text[j]!);
}

export function sentences(text: string): Seg[] {
  const out: Seg[] = [];
  const n = text.length;
  let start = -1;
  for (let i = 0; i < n; i += 1) {
    const c = text[i]!;
    if (start === -1 && !/\s/.test(c)) start = i;
    if (start !== -1 && (c === "." || c === "!" || c === "?")) {
      if (boundary(text, i)) {
        out.push({ text: text.slice(start, i + 1), start, end: i + 1 });
        start = -1;
      }
    }
  }
  if (start !== -1) out.push({ text: text.slice(start, n), start, end: n });
  return out;
}
