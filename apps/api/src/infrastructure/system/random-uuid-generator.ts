import { randomUUID } from "node:crypto";

import type { IdGenerator } from "../../application/id-generator.js";

export const randomUuidGenerator: IdGenerator = {
  next: randomUUID,
};
