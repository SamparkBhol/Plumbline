#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { verify } from "../src/index.js";
import type { Engine, Report, VerifyOpts } from "../src/types.js";

interface Args {
  answer?: string;
  sources: string[];
  min: number;
  engine: Engine | "auto";
  json: boolean;
  help: boolean;
}

function parse(argv: string[]): Args {
  const a: Args = { sources: [], min: 0.5, engine: "auto", json: false, help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const k = argv[i];
    if (k === "--answer" || k === "-a") a.answer = argv[++i];
    else if (k === "--source" || k === "-s") {
      const v = argv[++i];
      if (v) a.sources.push(v);
    } else if (k === "--min" || k === "-m") a.min = Number(argv[++i]);
    else if (k === "--engine" || k === "-e") a.engine = (argv[++i] as Engine | "auto") ?? "auto";
    else if (k === "--json" || k === "-j") a.json = true;
    else if (k === "--help" || k === "-h") a.help = true;
  }
  return a;
}

const usage = [
  "plumbline verifies generated text against its sources",
  "",
  "usage:",
  "  plumbline --answer ans.txt --source a.txt --source b.txt",
  "  cat ans.txt | plumbline --source a.txt",
  "",
  "options:",
  "  -a, --answer <file>   answer text, stdin when omitted",
  "  -s, --source <file>   a source file, repeatable",
  "  -m, --min <n>         fail threshold for overall score, default 0.5",
  "  -e, --engine <name>   auto, lexical, or transformer, default auto",
  "  -j, --json            print the full report as json",
  "  -h, --help            show this"
].join("\n");

function f2(n: number): string {
  return n.toFixed(2);
}

function render(r: Report): string {
  const c = r.counts;
  const score = r.score === null ? "n/a" : f2(r.score);
  const head = "plumbline  score " + score + "  coverage " + f2(r.coverage) + "  engine " + r.engine;
  const tally =
    "supported " + c.supported + "  unsupported " + c.unsupported +
    "  contradicted " + c.contradicted + "  unverifiable " + c.unverifiable;
  const lines = [head, tally];
  if (r.flagged.length > 0) {
    lines.push("", "flagged:");
    for (const f of r.flagged) {
      lines.push("  [" + f.verdict + " " + f2(f.confidence) + "] " + f.claim.text);
      if (f.verdict === "contradicted" && f.span) lines.push("     against: " + f.span.text + " (" + f.span.src + ")");
      else lines.push("     no supporting evidence found");
    }
  }
  return lines.join("\n");
}

async function main(): Promise<void> {
  const args = parse(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(usage + "\n");
    return;
  }
  if (!Number.isFinite(args.min)) {
    process.stderr.write("--min requires a number\n");
    process.exitCode = 2;
    return;
  }
  if (!["auto", "lexical", "transformer"].includes(args.engine)) {
    process.stderr.write("--engine must be auto, lexical, or transformer\n");
    process.exitCode = 2;
    return;
  }
  const answer = args.answer ? readFileSync(args.answer, "utf8") : readFileSync(0, "utf8");
  const sources = args.sources.map((p, i) => ({ id: "s" + i, text: readFileSync(p, "utf8") }));
  if (sources.length === 0) {
    process.stderr.write("at least one --source is required\n");
    process.exitCode = 2;
    return;
  }
  const opts: VerifyOpts = { engine: args.engine };
  const report = await verify(answer, sources, opts);
  process.stdout.write((args.json ? JSON.stringify(report, null, 2) : render(report)) + "\n");
  if (report.score === null || report.score < args.min) process.exitCode = 1;
}

main().catch((e: unknown) => {
  process.stderr.write(String(e instanceof Error ? e.message : e) + "\n");
  process.exitCode = 2;
});
