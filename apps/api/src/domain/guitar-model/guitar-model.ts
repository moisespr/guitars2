import type { BodyModel } from "../body-model/body-model.js";
import type { BridgeModel } from "../bridge-model/bridge-model.js";
import type { NeckModel } from "../neck-model/neck-model.js";
import type { AuditedEntity } from "../shared/audited-entity.js";

export interface GuitarModel extends AuditedEntity {
  readonly body: BodyModel;
  readonly bridge: BridgeModel;
  readonly catalogId: string;
  readonly name: string;
  readonly neck: NeckModel;
  readonly normalizedName: string;
}
