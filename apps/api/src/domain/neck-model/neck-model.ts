import type { AuditedEntity } from "../shared/audited-entity.js";
import type { ModelReference } from "../shared/model-reference.js";

export interface NeckModel extends AuditedEntity {
  readonly catalogId: string;
  readonly name: string;
  readonly normalizedName: string;
  readonly profile?: string;
}

export interface NeckModelCreation {
  readonly name: string;
  readonly profile?: string;
}

export type NeckModelInput = NeckModelCreation | ModelReference;
