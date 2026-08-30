import type { AuditedEntity } from "../shared/audited-entity.js";
import type { ModelReference } from "../shared/model-reference.js";

export interface BodyModel extends AuditedEntity {
  readonly bodyArchetypeId?: string;
  readonly catalogId: string;
  readonly finish?: string;
  readonly material?: string;
  readonly name: string;
  readonly normalizedName: string;
}

export interface BodyModelCreation {
  readonly bodyArchetypeId?: string;
  readonly finish?: string;
  readonly material?: string;
  readonly name: string;
}

export type BodyModelInput = BodyModelCreation | ModelReference;
