import type { Source } from "../../src/types.js";

export const sources: Source[] = [
  {
    id: "s0",
    text:
      "Plumbline runs entirely on local models and needs no api keys. " +
      "The library is written in TypeScript. " +
      "It exposes a verify function that returns a structured report. " +
      "The default fail threshold for the cli is 0.5."
  },
  {
    id: "s1",
    text: "The service stores user data on disk for fast retrieval."
  }
];

export const answer = [
  "Plumbline runs entirely on local models and needs no api keys.",
  "It is written in TypeScript.",
  "The library sends private text to a remote server.",
  "The service stores no user data on disk.",
  "Otters build dams along quiet rivers."
].join(" ");

export const expected: Record<string, string> = {
  "local models": "supported",
  "written in TypeScript": "supported",
  "remote server": "unsupported",
  "stores no user data": "contradicted",
  "Otters build dams": "unverifiable"
};
