import { CreateCatalog } from "./catalog/create-catalog.js";
import { CreateGuitarModel } from "./guitar-model/create-guitar-model.js";
import { GetGuitarModel } from "./guitar-model/get-guitar-model.js";
import type { CatalogAndModelStore } from "./catalog-and-model-store.js";
import type { Clock } from "./clock.js";
import type { IdGenerator } from "./id-generator.js";

export interface Application {
  readonly createCatalog: CreateCatalog;
  readonly createGuitarModel: CreateGuitarModel;
  readonly getGuitarModel: GetGuitarModel;
}

export function createApplication(dependencies: {
  readonly clock: Clock;
  readonly ids: IdGenerator;
  readonly store: CatalogAndModelStore;
}): Application {
  return {
    createCatalog: new CreateCatalog(
      dependencies.store,
      dependencies.clock,
      dependencies.ids,
    ),
    createGuitarModel: new CreateGuitarModel(
      dependencies.store,
      dependencies.clock,
      dependencies.ids,
    ),
    getGuitarModel: new GetGuitarModel(dependencies.store),
  };
}
