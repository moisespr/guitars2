export class GuitarModelNotFoundError extends Error {
  public constructor(guitarModelId: string) {
    super(`No GuitarModel exists with identifier ${guitarModelId}.`);
    this.name = "GuitarModelNotFoundError";
  }
}
