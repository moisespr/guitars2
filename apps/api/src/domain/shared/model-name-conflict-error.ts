export type ModelType =
  "BodyModel" | "NeckModel" | "BridgeModel" | "GuitarModel";

export class ModelNameConflictError extends Error {
  public constructor(
    public readonly modelName: string,
    public readonly modelType: ModelType,
  ) {
    super(
      `A ${modelType} named '${modelName}' already exists in this catalog.`,
    );
    this.name = "ModelNameConflictError";
  }
}
