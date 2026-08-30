import type { Catalog } from "../../domain/catalog/catalog.js";
import { assertMeaningfulName } from "../../domain/shared/model-name.js";
import type { CatalogAndModelStore } from "../catalog-and-model-store.js";
import type { Clock } from "../clock.js";
import type { IdGenerator } from "../id-generator.js";

export interface CreateCatalogCommand {
  readonly name: string;
}

export class CreateCatalog {
  public constructor(
    private readonly store: CatalogAndModelStore,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  public async execute(command: CreateCatalogCommand): Promise<Catalog> {
    assertMeaningfulName(command.name);
    const timestamp = this.clock.now();
    const catalog: Catalog = {
      createdAt: timestamp,
      id: this.ids.next(),
      name: command.name,
      updatedAt: timestamp,
    };

    await this.store.transaction(async (store) => {
      await store.saveCatalog(catalog);
    });

    return catalog;
  }
}
