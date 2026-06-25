import { describe, it, expect } from "vitest";
import { calib } from "../src/entail/calibrate.js";

describe("calib", () => {
  it("leaves a midpoint unchanged for any temperature", () => {
    expect(calib(0.5, 1)).toBeCloseTo(0.5, 6);
    expect(calib(0.5, 3)).toBeCloseTo(0.5, 6);
  });

  it("pulls a confident score toward the midpoint when temperature exceeds one", () => {
    const c = calib(0.9, 2);
    expect(c).toBeLessThan(0.9);
    expect(c).toBeGreaterThan(0.5);
  });

  it("lifts a low score toward the midpoint", () => {
    const c = calib(0.1, 2);
    expect(c).toBeGreaterThan(0.1);
    expect(c).toBeLessThan(0.5);
  });

  it("stays monotonic in the input probability", () => {
    expect(calib(0.8, 1.6)).toBeGreaterThan(calib(0.6, 1.6));
  });
});
