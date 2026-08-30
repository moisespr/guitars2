export interface ModelReference {
  readonly id: string;
}

export function isModelReference(
  input: ModelReference | { readonly name: string },
): input is ModelReference {
  return "id" in input;
}
