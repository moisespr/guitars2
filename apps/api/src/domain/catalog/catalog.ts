import type { AuditedEntity } from "../shared/audited-entity.js";

export interface Catalog extends AuditedEntity {
  readonly name: string;
}
