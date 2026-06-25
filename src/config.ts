import type { Settings, VerifyOpts } from "./types.js";

export const defaults: Settings = {
  topK: 3,
  supportFloor: 0.5,
  contraFloor: 0.5,
  relFloor: 0.12,
  temp: 1.6,
  chunk: { size: 320, overlap: 64 }
};

export function settle(opts: VerifyOpts | undefined): Settings {
  const o = opts ?? {};
  return {
    topK: o.topK ?? defaults.topK,
    supportFloor: o.supportFloor ?? defaults.supportFloor,
    contraFloor: o.contraFloor ?? defaults.contraFloor,
    relFloor: o.relFloor ?? defaults.relFloor,
    temp: o.temp ?? defaults.temp,
    chunk: o.chunk ?? defaults.chunk
  };
}

export const models = {
  embed: "Xenova/all-MiniLM-L6-v2",
  nli: "Xenova/nli-deberta-v3-xsmall"
};
