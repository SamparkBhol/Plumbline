import type { Report, Sources, VerifyOpts } from "./types.js";
import { verify } from "./verify.js";

export interface Guarded<T> {
  value: T;
  answer: string;
  report: Report;
  ok: boolean;
}

export interface GuardOpts<T> extends VerifyOpts {
  min?: number;
  answerOf?: (value: T) => string;
}

function textOf<T>(value: T): string {
  if (typeof value === "string") return value;
  const v = value as Record<string, unknown>;
  for (const key of ["answer", "text", "content", "output"]) {
    const f = v?.[key];
    if (typeof f === "string") return f;
  }
  return String(value);
}

export function guard<A extends unknown[], T>(
  fn: (...args: A) => Promise<T>,
  sources: Sources | ((value: T, args: A) => Sources),
  opts: GuardOpts<T> = {}
): (...args: A) => Promise<Guarded<T>> {
  const min = opts.min ?? 0.5;
  return async (...args: A): Promise<Guarded<T>> => {
    const value = await fn(...args);
    const answer = opts.answerOf ? opts.answerOf(value) : textOf(value);
    const src = typeof sources === "function" ? sources(value, args) : sources;
    const report = await verify(answer, src, opts);
    const ok = report.score !== null && report.score >= min;
    return { value, answer, report, ok };
  };
}
