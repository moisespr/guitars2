import type {
  BodyModel,
  BodyModelCreation,
  BodyModelInput,
} from "../../domain/body-model/body-model.js";
import type {
  BridgeModel,
  BridgeModelCreation,
  BridgeModelInput,
} from "../../domain/bridge-model/bridge-model.js";
import { CatalogNotFoundError } from "../../domain/catalog/catalog-not-found-error.js";
import type { GuitarModel } from "../../domain/guitar-model/guitar-model.js";
import type {
  NeckModel,
  NeckModelCreation,
  NeckModelInput,
} from "../../domain/neck-model/neck-model.js";
import { InvalidReferenceError } from "../../domain/shared/invalid-reference-error.js";
import {
  assertMeaningfulName,
  normalizeModelName,
} from "../../domain/shared/model-name.js";
import { isModelReference } from "../../domain/shared/model-reference.js";
import type { CatalogAndModelStore } from "../catalog-and-model-store.js";
import type { Clock } from "../clock.js";
import type { IdGenerator } from "../id-generator.js";

export interface CreateGuitarModelCommand {
  readonly body: BodyModelInput;
  readonly bridge: BridgeModelInput;
  readonly catalogId: string;
  readonly name: string;
  readonly neck: NeckModelInput;
}

export class CreateGuitarModel {
  public constructor(
    private readonly store: CatalogAndModelStore,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  public async execute(
    command: CreateGuitarModelCommand,
  ): Promise<GuitarModel> {
    assertMeaningfulName(command.name);

    return this.store.transaction(async (store) => {
      if ((await store.findCatalog(command.catalogId)) === undefined) {
        throw new CatalogNotFoundError(command.catalogId);
      }

      const timestamp = this.clock.now();
      const body = await this.resolveBody(
        store,
        command.catalogId,
        command.body,
        timestamp,
      );
      const neck = await this.resolveNeck(
        store,
        command.catalogId,
        command.neck,
        timestamp,
      );
      const bridge = await this.resolveBridge(
        store,
        command.catalogId,
        command.bridge,
        timestamp,
      );
      const guitarModel: GuitarModel = {
        body,
        bridge,
        catalogId: command.catalogId,
        createdAt: timestamp,
        id: this.ids.next(),
        name: command.name,
        neck,
        normalizedName: normalizeModelName(command.name),
        updatedAt: timestamp,
      };

      await store.saveGuitarModel({
        ...guitarModel,
        bodyId: body.id,
        bridgeId: bridge.id,
        neckId: neck.id,
      });

      return guitarModel;
    });
  }

  private async resolveBody(
    store: CatalogAndModelStore,
    catalogId: string,
    input: BodyModelInput,
    timestamp: Date,
  ): Promise<BodyModel> {
    if (isModelReference(input)) {
      const model = await store.findBodyModel(input.id);

      if (model === undefined) {
        throw new InvalidReferenceError(
          "/body/id",
          "BodyModel reference does not exist.",
        );
      }

      return model;
    }

    return this.createBody(store, catalogId, input, timestamp);
  }

  private async createBody(
    store: CatalogAndModelStore,
    catalogId: string,
    input: BodyModelCreation,
    timestamp: Date,
  ): Promise<BodyModel> {
    assertMeaningfulName(input.name, "body/name");

    if (
      input.bodyArchetypeId !== undefined &&
      (await store.findBodyArchetype(input.bodyArchetypeId)) === undefined
    ) {
      throw new InvalidReferenceError(
        "/body/bodyArchetypeId",
        "BodyArchetype reference does not exist.",
      );
    }

    const model: BodyModel = {
      ...(input.bodyArchetypeId === undefined
        ? {}
        : { bodyArchetypeId: input.bodyArchetypeId }),
      ...(input.finish === undefined ? {} : { finish: input.finish }),
      ...(input.material === undefined ? {} : { material: input.material }),
      catalogId,
      createdAt: timestamp,
      id: this.ids.next(),
      name: input.name,
      normalizedName: normalizeModelName(input.name),
      updatedAt: timestamp,
    };

    await store.saveBodyModel(model);
    return model;
  }

  private async resolveNeck(
    store: CatalogAndModelStore,
    catalogId: string,
    input: NeckModelInput,
    timestamp: Date,
  ): Promise<NeckModel> {
    if (isModelReference(input)) {
      const model = await store.findNeckModel(input.id);

      if (model === undefined) {
        throw new InvalidReferenceError(
          "/neck/id",
          "NeckModel reference does not exist.",
        );
      }

      return model;
    }

    return this.createNeck(store, catalogId, input, timestamp);
  }

  private async createNeck(
    store: CatalogAndModelStore,
    catalogId: string,
    input: NeckModelCreation,
    timestamp: Date,
  ): Promise<NeckModel> {
    assertMeaningfulName(input.name, "neck/name");
    const model: NeckModel = {
      ...(input.profile === undefined ? {} : { profile: input.profile }),
      catalogId,
      createdAt: timestamp,
      id: this.ids.next(),
      name: input.name,
      normalizedName: normalizeModelName(input.name),
      updatedAt: timestamp,
    };

    await store.saveNeckModel(model);
    return model;
  }

  private async resolveBridge(
    store: CatalogAndModelStore,
    catalogId: string,
    input: BridgeModelInput,
    timestamp: Date,
  ): Promise<BridgeModel> {
    if (isModelReference(input)) {
      const model = await store.findBridgeModel(input.id);

      if (model === undefined) {
        throw new InvalidReferenceError(
          "/bridge/id",
          "BridgeModel reference does not exist.",
        );
      }

      return model;
    }

    return this.createBridge(store, catalogId, input, timestamp);
  }

  private async createBridge(
    store: CatalogAndModelStore,
    catalogId: string,
    input: BridgeModelCreation,
    timestamp: Date,
  ): Promise<BridgeModel> {
    assertMeaningfulName(input.name, "bridge/name");
    const model: BridgeModel = {
      ...(input.bridgeType === undefined
        ? {}
        : { bridgeType: input.bridgeType }),
      catalogId,
      createdAt: timestamp,
      id: this.ids.next(),
      name: input.name,
      normalizedName: normalizeModelName(input.name),
      updatedAt: timestamp,
    };

    await store.saveBridgeModel(model);
    return model;
  }
}
