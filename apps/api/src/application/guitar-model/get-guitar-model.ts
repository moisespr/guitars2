import { GuitarModelNotFoundError } from "../../domain/guitar-model/guitar-model-not-found-error.js";
import type { GuitarModel } from "../../domain/guitar-model/guitar-model.js";
import type { CatalogAndModelStore } from "../catalog-and-model-store.js";

export class GetGuitarModel {
  public constructor(private readonly store: CatalogAndModelStore) {}

  public async execute(guitarModelId: string): Promise<GuitarModel> {
    const guitarModel = await this.store.findGuitarModel(guitarModelId);

    if (guitarModel === undefined) {
      throw new GuitarModelNotFoundError(guitarModelId);
    }

    return guitarModel;
  }
}
