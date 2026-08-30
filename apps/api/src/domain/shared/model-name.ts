export class InvalidDomainInputError extends Error {
  public constructor(
    public readonly pointer: string,
    message: string,
  ) {
    super(message);
    this.name = "InvalidDomainInputError";
  }
}

export function normalizeModelName(name: string): string {
  return name.normalize("NFKC").trim().toLocaleLowerCase("en-US");
}

export function assertMeaningfulName(name: string, fieldName = "name"): void {
  if (normalizeModelName(name).length === 0) {
    throw new InvalidDomainInputError(
      `/${fieldName}`,
      `${fieldName} must contain non-whitespace characters.`,
    );
  }
}
