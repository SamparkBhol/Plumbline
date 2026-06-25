import type { Embedder, Engine, Nli, VerifyOpts } from "../types.js";
import { LexEmbedder, TransformerEmbedder } from "../retrieve/embed.js";
import { LexNli, TransformerNli } from "../entail/nli.js";
import { models } from "../config.js";

export interface Picked {
  embedder: Embedder;
  nli: Nli;
  engine: Engine;
}

interface Hub {
  pipeline: (...a: unknown[]) => Promise<unknown>;
  AutoTokenizer: { from_pretrained: (id: string) => Promise<(p: string, o: Record<string, unknown>) => unknown> };
  AutoModelForSequenceClassification: {
    from_pretrained: (id: string, o?: unknown) => Promise<((i: unknown) => Promise<{ logits: { data: ArrayLike<number> } }>) & { config: { id2label: Record<string, string> } }>;
  };
}

const load = { dtype: "fp32", session_options: { intraOpNumThreads: 1, interOpNumThreads: 1 } };

async function tryTransformer(): Promise<{ embedder: Embedder; nli: Nli } | null> {
  try {
    const name = "@huggingface/transformers";
    const mod = (await import(name)) as unknown as Hub;
    const fe = (await mod.pipeline("feature-extraction", models.embed, load)) as (
      t: string,
      o: Record<string, unknown>
    ) => Promise<{ data: ArrayLike<number> }>;
    const tok = await mod.AutoTokenizer.from_pretrained(models.nli);
    const model = await mod.AutoModelForSequenceClassification.from_pretrained(models.nli, load);
    const id2label = model.config.id2label;
    const labels = Object.keys(id2label)
      .sort((a, b) => Number(a) - Number(b))
      .map((k) => id2label[k] ?? "");
    const run = async (p: string, h: string): Promise<number[]> => {
      const inputs = tok(p, { text_pair: h, padding: true, truncation: true });
      const out = await model(inputs);
      return Array.from(out.logits.data, Number);
    };
    const embedder = new TransformerEmbedder((t, o) => fe(t, o));
    const nli = new TransformerNli(run, labels);
    return { embedder, nli };
  } catch {
    return null;
  }
}

export async function providers(opts: VerifyOpts): Promise<Picked> {
  if (opts.embedder && opts.nli) {
    return { embedder: opts.embedder, nli: opts.nli, engine: opts.embedder.engine };
  }
  const want = opts.engine ?? "auto";
  if (want !== "lexical") {
    const t = await tryTransformer();
    if (t) {
      return {
        embedder: opts.embedder ?? t.embedder,
        nli: opts.nli ?? t.nli,
        engine: "transformer"
      };
    }
    if (want === "transformer") throw new Error("transformer models unavailable");
  }
  return {
    embedder: opts.embedder ?? new LexEmbedder(),
    nli: opts.nli ?? new LexNli(),
    engine: "lexical"
  };
}
