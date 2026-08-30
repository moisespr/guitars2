import type { BodyModel } from "../domain/body-model/body-model.js";
import type { BodyArchetype } from "../domain/body-model/body-archetype.js";
import type { BridgeModel } from "../domain/bridge-model/bridge-model.js";
import type { Catalog } from "../domain/catalog/catalog.js";
import type { GuitarModel } from "../domain/guitar-model/guitar-model.js";
import type { NeckModel } from "../domain/neck-model/neck-model.js";

export interface CatalogAndModelStore {
  findBodyArchetype(id: string): Promise<BodyArchetype | undefined>;
  findBodyModel(id: string): Promise<BodyModel | undefined>;
  findBridgeModel(id: string): Promise<BridgeModel | undefined>;
  findCatalog(id: string): Promise<Catalog | undefined>;
  findGuitarModel(id: string): Promise<GuitarModel | undefined>;
  findNeckModel(id: string): Promise<NeckModel | undefined>;
  saveBodyModel(model: BodyModel): Promise<void>;
  saveBridgeModel(model: BridgeModel): Promise<void>;
  saveCatalog(catalog: Catalog): Promise<void>;
  saveGuitarModel(
    model: Omit<GuitarModel, "body" | "bridge" | "neck"> & {
      readonly bodyId: string;
      readonly bridgeId: string;
      readonly neckId: string;
    },
  ): Promise<void>;
  saveNeckModel(model: NeckModel): Promise<void>;
  transaction<T>(work: (store: CatalogAndModelStore) => Promise<T>): Promise<T>;
}
