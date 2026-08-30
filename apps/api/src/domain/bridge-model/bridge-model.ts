import type { AuditedEntity } from "../shared/audited-entity.js";
import type { ModelReference } from "../shared/model-reference.js";

export interface BridgeModel extends AuditedEntity {
  readonly bridgeType?: string;
  readonly catalogId: string;
  readonly name: string;
  readonly normalizedName: string;
}

export interface BridgeModelCreation {
  readonly bridgeType?: string;
  readonly name: string;
}

export type BridgeModelInput = BridgeModelCreation | ModelReference;
