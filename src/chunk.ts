import type { Chunk, ChunkOpts, Source, Sources } from "./types.js";
import { sentences } from "./text/segment.js";

export function asSources(input: Sources): Source[] {
  const arr = Array.isArray(input) ? input : [input];
  const seen = new Set<string>();
  return arr.map((s, i) => {
    const base = typeof s === "string" ? { id: "s" + i, text: s } : { id: s.id, text: s.text };
    let id = base.id;
    let k = 1;
    while (seen.has(id)) {
      id = base.id + "_" + k;
      k += 1;
    }
    seen.add(id);
    return { id, text: base.text };
  });
}

function pack(src: Source, opts: ChunkOpts): Chunk[] {
  const segs = sentences(src.text);
  if (segs.length === 0) {
    const t = src.text.trim();
    if (t.length === 0) return [];
    return [{ id: src.id + ":0", src: src.id, text: src.text, start: 0, end: src.text.length }];
  }
  const out: Chunk[] = [];
  let buf: typeof segs = [];
  let len = 0;
  let k = 0;
  const flush = () => {
    if (buf.length === 0) return;
    const first = buf[0]!;
    const last = buf[buf.length - 1]!;
    out.push({
      id: src.id + ":" + k,
      src: src.id,
      text: src.text.slice(first.start, last.end),
      start: first.start,
      end: last.end
    });
    k += 1;
  };
  for (const seg of segs) {
    const sl = seg.end - seg.start;
    if (len > 0 && len + sl > opts.size) {
      flush();
      const carry: typeof segs = [];
      let cl = 0;
      for (let i = buf.length - 1; i >= 0; i -= 1) {
        const s = buf[i]!;
        const w = s.end - s.start;
        if (cl + w > opts.overlap) break;
        carry.unshift(s);
        cl += w;
      }
      buf = carry;
      len = cl;
    }
    buf.push(seg);
    len += sl;
  }
  flush();
  return out;
}

export function chunkSources(input: Sources, opts: ChunkOpts): Chunk[] {
  const out: Chunk[] = [];
  for (const src of asSources(input)) {
    for (const c of pack(src, opts)) out.push(c);
  }
  return out;
}
