export class CatalogNotFoundError extends Error {
  public constructor(catalogId: string) {
    super(`No Catalog exists with identifier ${catalogId}.`);
    this.name = "CatalogNotFoundError";
  }
}
