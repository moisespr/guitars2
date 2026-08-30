import type { Clock } from "../../application/clock.js";

export const systemClock: Clock = {
  now: () => new Date(),
};
