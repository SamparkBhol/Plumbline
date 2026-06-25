import { sigmoid, logit, clamp01 } from "../math.js";

export function calib(p: number, temp: number): number {
  const t = temp > 0 ? temp : 1;
  return clamp01(sigmoid(logit(p) / t));
}
