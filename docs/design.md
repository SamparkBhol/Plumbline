# Plumbline

A local first faithfulness engine for language model output. Given generated text and the sources it was meant to rely on, Plumbline decides, claim by claim, whether the text is supported, unsupported, or contradicted by those sources, points to the exact supporting or contradicting span, and reports a calibrated confidence.

## Problem

Systems that put a language model in front of retrieved context cannot tell, at runtime, whether the answer is grounded in that context or invented. Existing faithfulness tools route every check through a hosted judge model, which costs money per call, leaks data, and is nondeterministic. Plumbline runs entirely on local models with a deterministic harness, so the same input always yields the same verdict and nothing leaves the process.

## Shape

Three surfaces over one engine.

1. Library. `verify(answer, sources, opts)` returns a structured report.
2. CLI. Reads an answer and sources from files or stdin, prints a report as JSON or text, exits non zero when faithfulness falls below a threshold, so it fits a CI gate.
3. Guard. `guard(fn, opts)` wraps any async chat function and returns the answer together with its verification, ready to flag or block at runtime.

## Engine

The pipeline is a sequence of pure stages around two swappable model providers.

1. Segment. Split the answer into sentences with an abbreviation aware splitter.
2. Decompose. Break the answer into claims at sentence and semicolon boundaries so each claim stands on its own.
3. Retrieve. For every claim, rank source chunks with a hybrid of BM25 and embedding cosine, fused by reciprocal rank, and keep the top candidates as evidence.
4. Entail. Score each claim against its most relevant evidence sentence with natural language inference, reading support from entailment and contradiction from its opposite. Evidence that fails the relevance floor casts no vote.
5. Calibrate. Temper overconfident raw scores with temperature scaling at a fixed default temperature, and set a claim aside as unverifiable when no evidence clears the floor.
6. Attribute. Locate the smallest evidence span that carries the support or contradiction.
7. Aggregate. Assign a per claim verdict, then roll claims up into one faithfulness score for the answer.

## Providers

Two interfaces, `Embedder` and `Nli`, isolate every model touch.

- Transformer providers load small sentence embedding and natural language inference models through transformers in Node. They are the default at runtime.
- Lexical providers compute the same signals from token coverage, idf weighting, negation cues, and numeric agreement. They need no download and are deterministic, so they back the test suite and serve as a graceful fallback when a model cannot load.

The engine selects a provider once, records which engine produced a report, and never mixes the two within a run.

## Verdicts

- supported. Evidence entails the claim with confidence above the support floor.
- contradicted. Evidence entails the negation of the claim.
- unsupported. Evidence neither entails nor contradicts the claim.
- unverifiable. No evidence cleared the retrieval floor, so the claim is set aside rather than judged.

## Correctness

Every stage except the model call is a pure function with golden and unit tests. Segmentation, decomposition, fusion, calibration, attribution, and aggregation are tested against fixed fixtures that include planted hallucinations, paraphrase, negation, and partial support. Provider selection is injected, so the full pipeline runs under deterministic providers in the suite.

## Boundaries

No dashboard, no account, no server, no vector database, no model training. The package is the engine, the CLI, and the guard. Nothing more.

## Stack

TypeScript, Node, vitest for tests, tsup for the build, transformers as an optional dependency loaded by dynamic import. No keys, no network required for the deterministic path.
