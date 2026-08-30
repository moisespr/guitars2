import { Kysely, PostgresDialect, type Transaction } from "kysely";
import { Pool } from "pg";

import type { CatalogAndModelStore } from "../../application/catalog-and-model-store.js";
import type { BodyArchetype } from "../../domain/body-model/body-archetype.js";
import type { BodyModel } from "../../domain/body-model/body-model.js";
import type { BridgeModel } from "../../domain/bridge-model/bridge-model.js";
import type { Catalog } from "../../domain/catalog/catalog.js";
import type { GuitarModel } from "../../domain/guitar-model/guitar-model.js";
import type { NeckModel } from "../../domain/neck-model/neck-model.js";
import {
  ModelNameConflictError,
  type ModelType,
} from "../../domain/shared/model-name-conflict-error.js";

interface CatalogsTable {
  readonly created_at: Date;
  readonly id: string;
  readonly name: string;
  readonly updated_at: Date;
}

interface BodyArchetypesTable {
  readonly id: string;
}

interface BodyModelsTable {
  readonly body_archetype_id: string | null;
  readonly catalog_id: string;
  readonly created_at: Date;
  readonly finish: string | null;
  readonly id: string;
  readonly material: string | null;
  readonly name: string;
  readonly normalized_name: string;
  readonly updated_at: Date;
}

interface NeckModelsTable {
  readonly catalog_id: string;
  readonly created_at: Date;
  readonly id: string;
  readonly name: string;
  readonly normalized_name: string;
  readonly profile: string | null;
  readonly updated_at: Date;
}

interface BridgeModelsTable {
  readonly bridge_type: string | null;
  readonly catalog_id: string;
  readonly created_at: Date;
  readonly id: string;
  readonly name: string;
  readonly normalized_name: string;
  readonly updated_at: Date;
}

interface GuitarModelsTable {
  readonly body_model_id: string;
  readonly bridge_model_id: string;
  readonly catalog_id: string;
  readonly created_at: Date;
  readonly id: string;
  readonly name: string;
  readonly neck_model_id: string;
  readonly normalized_name: string;
  readonly updated_at: Date;
}

interface Database {
  body_archetypes: BodyArchetypesTable;
  body_models: BodyModelsTable;
  bridge_models: BridgeModelsTable;
  catalogs: CatalogsTable;
  guitar_models: GuitarModelsTable;
  neck_models: NeckModelsTable;
}

type DatabaseExecutor = Kysely<Database> | Transaction<Database>;

export class PostgresCatalogAndModelStore implements CatalogAndModelStore {
  public constructor(private readonly database: DatabaseExecutor) {}

  public async findCatalog(id: string): Promise<Catalog | undefined> {
    const row = await this.database
      .selectFrom("catalogs")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    return row === undefined ? undefined : mapCatalog(row);
  }

  public async findBodyArchetype(
    id: string,
  ): Promise<BodyArchetype | undefined> {
    const row = await this.database
      .selectFrom("body_archetypes")
      .select("id")
      .where("id", "=", id)
      .executeTakeFirst();

    return row === undefined ? undefined : { id: row.id };
  }

  public async findBodyModel(id: string): Promise<BodyModel | undefined> {
    const row = await this.database
      .selectFrom("body_models")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    return row === undefined ? undefined : mapBodyModel(row);
  }

  public async findNeckModel(id: string): Promise<NeckModel | undefined> {
    const row = await this.database
      .selectFrom("neck_models")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    return row === undefined ? undefined : mapNeckModel(row);
  }

  public async findBridgeModel(id: string): Promise<BridgeModel | undefined> {
    const row = await this.database
      .selectFrom("bridge_models")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    return row === undefined ? undefined : mapBridgeModel(row);
  }

  public async findGuitarModel(id: string): Promise<GuitarModel | undefined> {
    const row = await this.database
      .selectFrom("guitar_models")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    if (row === undefined) {
      return undefined;
    }

    const [body, neck, bridge] = await Promise.all([
      this.findBodyModel(row.body_model_id),
      this.findNeckModel(row.neck_model_id),
      this.findBridgeModel(row.bridge_model_id),
    ]);

    if (body === undefined || neck === undefined || bridge === undefined) {
      throw new Error("A GuitarModel references a missing part model.");
    }

    return {
      body,
      bridge,
      catalogId: row.catalog_id,
      createdAt: row.created_at,
      id: row.id,
      name: row.name,
      neck,
      normalizedName: row.normalized_name,
      updatedAt: row.updated_at,
    };
  }

  public async saveCatalog(catalog: Catalog): Promise<void> {
    await this.database
      .insertInto("catalogs")
      .values({
        created_at: catalog.createdAt,
        id: catalog.id,
        name: catalog.name,
        updated_at: catalog.updatedAt,
      })
      .execute();
  }

  public async saveBodyModel(model: BodyModel): Promise<void> {
    await this.saveModel("BodyModel", model.name, async () => {
      await this.database
        .insertInto("body_models")
        .values({
          body_archetype_id: model.bodyArchetypeId ?? null,
          catalog_id: model.catalogId,
          created_at: model.createdAt,
          finish: model.finish ?? null,
          id: model.id,
          material: model.material ?? null,
          name: model.name,
          normalized_name: model.normalizedName,
          updated_at: model.updatedAt,
        })
        .execute();
    });
  }

  public async saveNeckModel(model: NeckModel): Promise<void> {
    await this.saveModel("NeckModel", model.name, async () => {
      await this.database
        .insertInto("neck_models")
        .values({
          catalog_id: model.catalogId,
          created_at: model.createdAt,
          id: model.id,
          name: model.name,
          normalized_name: model.normalizedName,
          profile: model.profile ?? null,
          updated_at: model.updatedAt,
        })
        .execute();
    });
  }

  public async saveBridgeModel(model: BridgeModel): Promise<void> {
    await this.saveModel("BridgeModel", model.name, async () => {
      await this.database
        .insertInto("bridge_models")
        .values({
          bridge_type: model.bridgeType ?? null,
          catalog_id: model.catalogId,
          created_at: model.createdAt,
          id: model.id,
          name: model.name,
          normalized_name: model.normalizedName,
          updated_at: model.updatedAt,
        })
        .execute();
    });
  }

  public async saveGuitarModel(
    model: Omit<GuitarModel, "body" | "bridge" | "neck"> & {
      readonly bodyId: string;
      readonly bridgeId: string;
      readonly neckId: string;
    },
  ): Promise<void> {
    await this.saveModel("GuitarModel", model.name, async () => {
      await this.database
        .insertInto("guitar_models")
        .values({
          body_model_id: model.bodyId,
          bridge_model_id: model.bridgeId,
          catalog_id: model.catalogId,
          created_at: model.createdAt,
          id: model.id,
          name: model.name,
          neck_model_id: model.neckId,
          normalized_name: model.normalizedName,
          updated_at: model.updatedAt,
        })
        .execute();
    });
  }

  public async transaction<T>(
    work: (store: CatalogAndModelStore) => Promise<T>,
  ): Promise<T> {
    return this.database
      .transaction()
      .execute(async (transaction) =>
        work(new PostgresCatalogAndModelStore(transaction)),
      );
  }

  private async saveModel(
    modelType: ModelType,
    modelName: string,
    save: () => Promise<void>,
  ): Promise<void> {
    try {
      await save();
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ModelNameConflictError(modelName, modelType);
      }

      throw error;
    }
  }
}

export interface PostgresStore extends CatalogAndModelStore {
  destroy(): Promise<void>;
}

export function createPostgresStore(connectionString: string): PostgresStore {
  const pool = new Pool({ connectionString });
  const database = new Kysely<Database>({
    dialect: new PostgresDialect({ pool }),
  });
  const store = new PostgresCatalogAndModelStore(database);

  return Object.assign(store, {
    destroy: () => database.destroy(),
  });
}

function mapCatalog(row: CatalogsTable): Catalog {
  return {
    createdAt: row.created_at,
    id: row.id,
    name: row.name,
    updatedAt: row.updated_at,
  };
}

function mapBodyModel(row: BodyModelsTable): BodyModel {
  return {
    ...(row.body_archetype_id === null
      ? {}
      : { bodyArchetypeId: row.body_archetype_id }),
    ...(row.finish === null ? {} : { finish: row.finish }),
    ...(row.material === null ? {} : { material: row.material }),
    catalogId: row.catalog_id,
    createdAt: row.created_at,
    id: row.id,
    name: row.name,
    normalizedName: row.normalized_name,
    updatedAt: row.updated_at,
  };
}

function mapNeckModel(row: NeckModelsTable): NeckModel {
  return {
    ...(row.profile === null ? {} : { profile: row.profile }),
    catalogId: row.catalog_id,
    createdAt: row.created_at,
    id: row.id,
    name: row.name,
    normalizedName: row.normalized_name,
    updatedAt: row.updated_at,
  };
}

function mapBridgeModel(row: BridgeModelsTable): BridgeModel {
  return {
    ...(row.bridge_type === null ? {} : { bridgeType: row.bridge_type }),
    catalogId: row.catalog_id,
    createdAt: row.created_at,
    id: row.id,
    name: row.name,
    normalizedName: row.normalized_name,
    updatedAt: row.updated_at,
  };
}

function isUniqueViolation(error: unknown): error is { readonly code: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}
