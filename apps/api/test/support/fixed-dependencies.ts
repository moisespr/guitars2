import type { Clock } from "../../src/application/clock.js";
import type { IdGenerator } from "../../src/application/id-generator.js";

export function fixedClock(instant = new Date("2026-08-30T08:00:00Z")): Clock {
  return { now: () => instant };
}

export function fixedIds(...ids: readonly string[]): IdGenerator {
  let index = 0;

  return {
    next: () => {
      const id = ids[index];
      index += 1;

      if (id === undefined) {
        throw new Error("The fixed ID sequence was exhausted.");
      }

      return id;
    },
  };
}
