export class InvalidReferenceError extends Error {
  public constructor(
    public readonly pointer: string,
    message: string,
  ) {
    super(message);
    this.name = "InvalidReferenceError";
  }
}
