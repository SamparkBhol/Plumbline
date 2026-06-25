export type Verdict = "supported" | "unsupported" | "contradicted" | "unverifiable";

export type Engine = "transformer" | "lexical";

export interface Source {
  id: string;
  text: string;
}

export type Sources = string | Source | Array<string | Source>;

export interface Chunk {
  id: string;
  src: string;
  text: string;
  start: number;
  end: number;
}

export interface Claim {
  id: string;
  text: string;
  raw: string;
  sentence: number;
  start: number;
  end: number;
}

export interface Span {
  src: string;
  chunk: string;
  start: number;
  end: number;
  text: string;
}

export interface Evidence {
  chunk: Chunk;
  fused: number;
  cos: number;
  lex: number;
}

export interface NliScores {
  entail: number;
  neutral: number;
  contra: number;
}

export interface ClaimResult {
  claim: Claim;
  verdict: Verdict;
  confidence: number;
  support: number;
  contra: number;
  span: Span | null;
  evidence: Evidence[];
}

export interface Report {
  score: number | null;
  coverage: number;
  engine: Engine;
  claims: ClaimResult[];
  counts: Record<Verdict, number>;
  flagged: ClaimResult[];
}

export interface Embedder {
  readonly engine: Engine;
  embed(texts: string[]): Promise<Float32Array[]>;
}

export interface Nli {
  readonly engine: Engine;
  score(premise: string, hyp: string): Promise<NliScores>;
}

export interface ChunkOpts {
  size: number;
  overlap: number;
}

export interface VerifyOpts {
  embedder?: Embedder;
  nli?: Nli;
  engine?: Engine | "auto";
  topK?: number;
  supportFloor?: number;
  contraFloor?: number;
  relFloor?: number;
  temp?: number;
  chunk?: ChunkOpts;
}

export interface Settings {
  topK: number;
  supportFloor: number;
  contraFloor: number;
  relFloor: number;
  temp: number;
  chunk: ChunkOpts;
}
