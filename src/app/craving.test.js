// The craving intervention adapts to intensity and routes its outcomes
// compassionately. Both are pure, so both are pinned here.
import { describe, it, expect } from "vitest";
import { buildCravingSteps, breatheSeconds, resolveCravingOutcome, horizonLabel, REPLACEMENTS } from "./craving.js";

describe("buildCravingSteps adapts to intensity", () => {
  it("a mild urge gets the short path", () => {
    expect(buildCravingSteps(2)).toEqual(["arrive", "breathe", "reflect"]);
  });
  it("a moderate urge adds urge-surfing", () => {
    expect(buildCravingSteps(5)).toEqual(["arrive", "breathe", "ride", "reflect"]);
  });
  it("a strong urge adds a concrete replacement action too", () => {
    expect(buildCravingSteps(9)).toEqual(["arrive", "breathe", "ride", "act", "reflect"]);
  });
  it("always begins by arriving and ends by reflecting", () => {
    for (const i of [1, 4, 7, 10]) {
      const steps = buildCravingSteps(i);
      expect(steps[0]).toBe("arrive");
      expect(steps[steps.length - 1]).toBe("reflect");
    }
  });
});

describe("breatheSeconds scales the delay with intensity", () => {
  it("longer for stronger cravings", () => {
    expect(breatheSeconds(2)).toBe(75);
    expect(breatheSeconds(5)).toBe(120);
    expect(breatheSeconds(9)).toBe(180);
    expect(breatheSeconds(9)).toBeGreaterThan(breatheSeconds(2));
  });
});

describe("resolveCravingOutcome routes compassionately", () => {
  it("made_it logs the won craving and goes home", () => {
    const r = resolveCravingOutcome("made_it", { before: 7, after: 2 });
    expect(r.route).toBe("/home");
    expect(r.event).toMatchObject({ type: "urge_surf" });
    expect(r.event.payload).toMatchObject({ before: 7, after: 2, outcome: "made_it" });
  });

  it("drank defers to the drink log without writing a phantom failed craving", () => {
    const r = resolveCravingOutcome("drank", { before: 8, after: 8 });
    expect(r.route).toBe("/sendoff");
    expect(r.event).toBeNull(); // no urge_surf written here
    expect(r.routeState).toMatchObject({ fromUrge: true, before: 8, after: 8 });
  });
});

describe("supporting content", () => {
  it("gives an honest, non-medical horizon and several replacement actions", () => {
    expect(typeof horizonLabel(9)).toBe("string");
    expect(REPLACEMENTS.length).toBeGreaterThanOrEqual(4);
    for (const r of REPLACEMENTS) expect(r).toHaveProperty("label");
  });
});
