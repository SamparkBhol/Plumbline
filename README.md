# Plumbline

Language models make things up. Not always, not obviously, but often enough that you cannot put one in front of a user and assume that what it says is backed by the documents you gave it. Plumbline is the check that sits between the model and the user.

You hand it an answer and the sources that answer was supposed to come from. It tells you, claim by claim, what is actually supported, what has no backing, and what the sources flatly contradict, and it points at the exact span of source text behind every call it makes.

It runs locally and it is deterministic. No api keys, nothing leaves the process in the default engine, and the same answer checked twice gives the same verdict. That last part matters more than it sounds. Most tools in this space hand the output to a hosted model and ask it to grade itself, which costs money on every call, sends your data to someone else, and quietly disagrees with itself between runs.

## The idea in one example

```ts
import { verify } from "plumbline"

const sources = [
  "Plumbline runs on local models and needs no api keys.",
  "The library is written in TypeScript."
]

const answer = "Plumbline is written in TypeScript. It sends your text to a remote server."

const report = await verify(answer, sources)

console.log(report.score)
for (const c of report.flagged) {
  console.log(c.verdict, c.claim.text)
}
```

The first sentence is backed by the sources, so Plumbline marks it supported. The second is invented, so it lands in `report.flagged`. The `score` is the share of checkable content that held up, or `null` when nothing could be checked.

## What you actually need to run it

Nothing beyond the package. The default engine ships inside Plumbline, works the moment you install, downloads nothing, and asks for no keys. Install it and call `verify`. That is the whole setup.

```
npm install plumbline
```

If you want the stronger transformer engine, add the optional model package. The first run pulls a small model from a public model host and caches it on disk, and every run after that is local and offline.

```
npm install @huggingface/transformers
```

You never have to choose between them by hand. Plumbline uses the transformer engine when the package is present and falls back to the built in engine when it is not.

## As a library

`verify(answer, sources, options)` returns a report. Every claim in it carries a verdict, a confidence, the `span` of source text behind the verdict, and the `evidence` that was retrieved for it. At the top, `score` is the share of verifiable content that holds up, or `null` when no claim could be checked, and `coverage` is how much of the answer was checkable at all.

Sources can be plain strings or `{ id, text }` objects when you want stable identifiers in the output.

## Guarding a model call

Wrap any async function that produces an answer. Plumbline runs the function, verifies what comes back, and hands you the result with a verdict attached.

```ts
import { guard } from "plumbline"

const ask = async (q: string) => callYourModel(q)

const safeAsk = guard(ask, (answer, args) => retrieveSources(args[0]), { min: 0.6 })

const out = await safeAsk("what does plumbline do")
if (!out.ok) {
  handleLowTrust(out.report)
}
```

The second argument is where the sources come from. Pass a fixed list, or a function that builds them from the result and the original arguments. If the function returns an object instead of a string, Plumbline reads the answer from an `answer`, `text`, `content`, or `output` field, and you can override that with `answerOf`.

## On the command line

```
plumbline --answer answer.txt --source a.txt --source b.txt --min 0.6
cat answer.txt | plumbline --source a.txt --json
```

It prints a short summary and the flagged claims, or the full report with `--json`. It exits non zero when the score drops below `--min`, so you can drop it into a build step and fail the build when an answer drifts off its sources.

```
  -a, --answer <file>   answer text, stdin when omitted
  -s, --source <file>   a source file, repeatable
  -m, --min <n>         fail threshold for the overall score, default 0.5
  -e, --engine <name>   auto, lexical, or transformer, default auto
  -j, --json            print the full report as json
```

## How it decides

The work happens in small, separable steps, and only two of them touch a model.

1. Split the answer into sentences, with an eye for abbreviations and decimals so it does not break mid thought.
2. Break those into standalone claims at sentence and semicolon boundaries, so each claim can be judged on its own.
3. Pull the most relevant source passages for the claim by combining keyword scoring with embedding similarity.
4. Weigh the claim against its most relevant evidence sentence, looking both for support and for direct contradiction.
5. Temper overconfident scores with temperature scaling, and step back when nothing relevant turned up.
6. Tie the verdict to the smallest piece of source text that justifies it.
7. Roll the per claim verdicts into one faithfulness score.

Everything except step three and four is plain, testable logic, which is why the verdicts are reproducible and the engine is easy to trust.

## The four verdicts

- `supported` the sources back the claim
- `contradicted` the sources say the opposite
- `unsupported` the sources neither back nor deny it
- `unverifiable` nothing relevant enough turned up, so the claim is set aside rather than guessed at

That last verdict is deliberate. A faithfulness checker that pretends to judge claims it has no evidence for is worse than one that admits the gap.

## Two engines, one interface

Both engines sit behind the same `Embedder` and `Nli` contracts.

The transformer engine loads small embedding and inference models and runs them locally. It reasons about meaning, so it handles paraphrase, antonyms, and number mismatches that surface text cannot. The built in engine reads the same signals from word overlap, term rarity, negation cues, and numeric agreement. It needs no download and never varies, which makes it the dependable floor and the backbone of the test suite, though its negation handling is a heuristic rather than true understanding. You can pin either one with the `engine` option, or pass your own providers to slot in a different model entirely.

## Tuning

`verify` takes thresholds when you need them: how many passages to weigh per claim, how strong support or contradiction must be, how relevant a passage has to be before a claim counts as checkable, the calibration temperature, and how sources are chunked. The defaults are set for short, factual answers over a handful of sources. Confidence is temperature scaled to curb overconfidence rather than fitted to a labeled set, so read it as a relative signal.

## Running it yourself

```
npm test
npm run typecheck
npm run build
```

The built in engine makes the suite fully reproducible. Every step except the model call is a pure function, tested against fixtures that plant hallucinations, negations, paraphrases, and partial truths and check that each one lands where it should.

## License

MIT
