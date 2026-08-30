import type { CatalogAndModelStore } from "../../src/application/catalog-and-model-store.js";
import type { BodyArchetype } from "../../src/domain/body-model/body-archetype.js";
import type { BodyModel } from "../../src/domain/body-model/body-model.js";
import type { BridgeModel } from "../../src/domain/bridge-model/bridge-model.js";
import type { Catalog } from "../../src/domain/catalog/catalog.js";
import type { GuitarModel } from "../../src/domain/guitar-model/guitar-model.js";
import type { NeckModel } from "../../src/domain/neck-model/neck-model.js";
import {
  ModelNameConflictError,
  type ModelType,
} from "../../src/domain/shared/model-name-conflict-error.js";

type StoredGuitarModel = Omit<GuitarModel, "body" | "bridge" | "neck"> & {
  readonly bodyId: string;
  readonly bridgeId: string;
  readonly neckId: string;
};

export class InMemoryCatalogAndModelStore implements CatalogAndModelStore {
  private bodyArchetypes = new Map<string, BodyArchetype>();
  private bodyModels = new Map<string, BodyModel>();
  private bridgeModels = new Map<string, BridgeModel>();
  private catalogs = new Map<string, Catalog>();
  private guitarModels = new Map<string, StoredGuitarModel>();
  private neckModels = new Map<string, NeckModel>();

  public addBodyArchetype(archetype: BodyArchetype): void {
    this.bodyArchetypes.set(archetype.id, archetype);
  }

  public async findBodyArchetype(
    id: string,
  ): Promise<BodyArchetype | undefined> {
    return this.bodyArchetypes.get(id);
  }

  public async findBodyModel(id: string): Promise<BodyModel | undefined> {
    return this.bodyModels.get(id);
  }

  public async findBridgeModel(id: string): Promise<BridgeModel | undefined> {
    return this.bridgeModels.get(id);
  }

  public async findCatalog(id: string): Promise<Catalog | undefined> {
    return this.catalogs.get(id);
  }

  public async findGuitarModel(id: string): Promise<GuitarModel | undefined> {
    const model = this.guitarModels.get(id);

    if (model === undefined) {
      return undefined;
    }

    const body = this.bodyModels.get(model.bodyId);
    const neck = this.neckModels.get(model.neckId);
    const bridge = this.bridgeModels.get(model.bridgeId);

    if (body === undefined || neck === undefined || bridge === undefined) {
      throw new Error("A stored guitar model references a missing part.");
    }

    return {
      body,
      bridge,
      catalogId: model.catalogId,
      createdAt: model.createdAt,
      id: model.id,
      name: model.name,
      neck,
      normalizedName: model.normalizedName,
      updatedAt: model.updatedAt,
    };
  }

  public async findNeckModel(id: string): Promise<NeckModel | undefined> {
    return this.neckModels.get(id);
  }

  public async saveBodyModel(model: BodyModel): Promise<void> {
    this.rejectDuplicate(this.bodyModels.values(), model, "BodyModel");
    this.bodyModels.set(model.id, model);
  }

  public async saveBridgeModel(model: BridgeModel): Promise<void> {
    this.rejectDuplicate(this.bridgeModels.values(), model, "BridgeModel");
    this.bridgeModels.set(model.id, model);
  }

  public async saveCatalog(catalog: Catalog): Promise<void> {
    this.catalogs.set(catalog.id, catalog);
  }

  public async saveGuitarModel(model: StoredGuitarModel): Promise<void> {
    this.rejectDuplicate(this.guitarModels.values(), model, "GuitarModel");
    this.guitarModels.set(model.id, model);
  }

  public async saveNeckModel(model: NeckModel): Promise<void> {
    this.rejectDuplicate(this.neckModels.values(), model, "NeckModel");
    this.neckModels.set(model.id, model);
  }

  public async transaction<T>(
    work: (store: CatalogAndModelStore) => Promise<T>,
  ): Promise<T> {
    const transactionStore = this.copy();
    const result = await work(transactionStore);

    this.bodyArchetypes = transactionStore.bodyArchetypes;
    this.bodyModels = transactionStore.bodyModels;
    this.bridgeModels = transactionStore.bridgeModels;
    this.catalogs = transactionStore.catalogs;
    this.guitarModels = transactionStore.guitarModels;
    this.neckModels = transactionStore.neckModels;

    return result;
  }

  public counts(): Record<string, number> {
    return {
      bodyModels: this.bodyModels.size,
      bridgeModels: this.bridgeModels.size,
      catalogs: this.catalogs.size,
      guitarModels: this.guitarModels.size,
      neckModels: this.neckModels.size,
    };
  }

  private copy(): InMemoryCatalogAndModelStore {
    const copy = new InMemoryCatalogAndModelStore();
    copy.bodyArchetypes = new Map(this.bodyArchetypes);
    copy.bodyModels = new Map(this.bodyModels);
    copy.bridgeModels = new Map(this.bridgeModels);
    copy.catalogs = new Map(this.catalogs);
    copy.guitarModels = new Map(this.guitarModels);
    copy.neckModels = new Map(this.neckModels);
    return copy;
  }

  private rejectDuplicate(
    existingModels: Iterable<{
      readonly catalogId: string;
      readonly normalizedName: string;
    }>,
    candidate: {
      readonly catalogId: string;
      readonly name: string;
      readonly normalizedName: string;
    },
    modelType: ModelType,
  ): void {
    for (const existingModel of existingModels) {
      if (
        existingModel.catalogId === candidate.catalogId &&
        existingModel.normalizedName === candidate.normalizedName
      ) {
        throw new ModelNameConflictError(candidate.name, modelType);
      }
    }
  }
}
