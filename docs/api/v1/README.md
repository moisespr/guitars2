# API contract: version 1

This document defines the initial public REST contract. The JSON Schema documents in [`schemas`](schemas) are the source of truth for external payloads. They use JSON Schema Draft 2020-12 and stable URN identifiers so tooling can register and resolve them without assuming a public hostname.

The API uses RFC 9457 Problem Details with media type `application/problem+json` for errors. The shared [`ProblemDetails`](schemas/problem-details.schema.json) schema defines the common fields; a validation problem also uses its `errors` extension with JSON Pointers to invalid request values.

When this contract is implemented, the Fastify adapter must use a Draft 2020-12-compatible schema registry and validator compiler. Framework defaults must not silently downgrade the external contract's dialect or duplicate it in TypeScript-only types.

## Resources and operations

| Operation             | Method and path                               | Success response                                                   |
| --------------------- | --------------------------------------------- | ------------------------------------------------------------------ |
| Create catalog        | `POST /v1/catalogs`                           | `201 Created` with [Catalog](schemas/catalog.schema.json)          |
| Create guitar model   | `POST /v1/catalogs/{catalogId}/guitar-models` | `201 Created` with [GuitarModel](schemas/guitar-model.schema.json) |
| Retrieve guitar model | `GET /v1/guitar-models/{guitarModelId}`       | `200 OK` with [GuitarModel](schemas/guitar-model.schema.json)      |

The catalog ID in the create-model path selects the target catalog. There is no implicit or default catalog. Model retrieval uses the stable guitar-model ID, which is independent of its catalog-scoped name.

## Catalog creation

The request body is `Catalog#/$defs/Create`. A successful response includes server-generated `id`, `createdAt`, and `updatedAt` fields. All timestamps are RFC 3339 `date-time` values normalized to UTC and emitted with a `Z` suffix.

```http
POST /v1/catalogs
Content-Type: application/json

{ "name": "Dream Builds" }
```

```json
{
  "id": "4e209678-5c9f-4871-972d-c1dc1f463e50",
  "name": "Dream Builds",
  "createdAt": "2026-08-29T15:00:00Z",
  "updatedAt": "2026-08-29T15:00:00Z"
}
```

## Guitar-model creation

The request body is `GuitarModel#/$defs/Create`. Each part slot uses `oneOf`:

- a reference object containing only an existing model `id`; or
- a nested, type-specific new-model object.

This is an exact choice, not a generic model payload. The server creates every nested part model and the guitar model atomically. If validation or a uniqueness check fails, none of the nested models or the guitar model are created.

Nested models are created in the target catalog. A reference may resolve to a model in another catalog, supporting composition from shared manufacturer or other accessible catalogs. Authorization is outside this version's contract.

```http
POST /v1/catalogs/4e209678-5c9f-4871-972d-c1dc1f463e50/guitar-models
Content-Type: application/json

{
  "name": "Saturday ST",
  "body": {
    "name": "Alder ST body",
    "bodyArchetypeId": "34f7ee11-7c3f-4e09-b520-d08546a6f9f0",
    "material": "alder",
    "finish": "sunburst"
  },
  "neck": {
    "name": "Maple C neck",
    "profile": "C"
  },
  "bridge": {
    "id": "0696cc11-d196-4326-b35c-4d1090f09ad0"
  }
}
```

A successful `201 Created` response is a `GuitarModel`, including the complete `BodyModel`, `NeckModel`, and `BridgeModel` representations with generated IDs and timestamps.

```json
{
  "id": "0eaf0bc5-f69f-4dc7-989f-bf87ca7be3de",
  "catalogId": "4e209678-5c9f-4871-972d-c1dc1f463e50",
  "name": "Saturday ST",
  "body": {
    "id": "9f5eea4a-8b07-45fb-a857-0217b7afc8db",
    "catalogId": "4e209678-5c9f-4871-972d-c1dc1f463e50",
    "name": "Alder ST body",
    "bodyArchetypeId": "34f7ee11-7c3f-4e09-b520-d08546a6f9f0",
    "material": "alder",
    "finish": "sunburst",
    "createdAt": "2026-08-29T15:01:00Z",
    "updatedAt": "2026-08-29T15:01:00Z"
  },
  "neck": {
    "id": "a3a2fadb-b4a0-4d79-844f-2f3a6d801de7",
    "catalogId": "4e209678-5c9f-4871-972d-c1dc1f463e50",
    "name": "Maple C neck",
    "profile": "C",
    "createdAt": "2026-08-29T15:01:00Z",
    "updatedAt": "2026-08-29T15:01:00Z"
  },
  "bridge": {
    "id": "0696cc11-d196-4326-b35c-4d1090f09ad0",
    "catalogId": "5ffb0d89-f0be-4a40-86ae-50f17c9e4f55",
    "name": "Two-point tremolo",
    "bridgeType": "two-point tremolo",
    "createdAt": "2026-08-29T14:00:00Z",
    "updatedAt": "2026-08-29T14:00:00Z"
  },
  "createdAt": "2026-08-29T15:01:00Z",
  "updatedAt": "2026-08-29T15:01:00Z"
}
```

```http
GET /v1/guitar-models/0eaf0bc5-f69f-4dc7-989f-bf87ca7be3de
```

The successful `200 OK` response is the same `GuitarModel` representation shown above. The initial body attributes are optional `bodyArchetypeId`, `material`, and `finish`; neck profile and bridge type are optional. No enum values are imposed for those attributes.

If `bodyArchetypeId` is supplied, it must identify a system-curated `BodyArchetype`; an unknown value is invalid. Archetypes are not catalog models, are not an enum, and have no create/retrieve endpoint in this version.

## Model names and conflict behavior

Every model has a stable generated UUID. A model name is unique only within its catalog and its model type. Therefore, a `GuitarModel` and a `BodyModel` called `Standard` may coexist in one catalog, but two `BodyModel` records called `Standard` may not.

The API compares normalized names. The exact normalization algorithm is intentionally deferred, but the same server-defined algorithm must be used consistently for creation and conflict detection.

## Errors

All listed errors use `application/problem+json` and conform to [ProblemDetails](schemas/problem-details.schema.json).

| Condition                                                                | Status                      | Problem type                                  |
| ------------------------------------------------------------------------ | --------------------------- | --------------------------------------------- |
| Malformed JSON                                                           | `400 Bad Request`           | `about:blank`                                 |
| Schema or reference validation failure, including unknown body archetype | `422 Unprocessable Content` | `urn:guitars2:problem:validation`             |
| A same-type model name already exists in the target catalog              | `409 Conflict`              | `urn:guitars2:problem:model-name-conflict`    |
| Target catalog does not exist                                            | `404 Not Found`             | `urn:guitars2:problem:catalog-not-found`      |
| Guitar model does not exist                                              | `404 Not Found`             | `urn:guitars2:problem:guitar-model-not-found` |

Example validation response:

```json
{
  "type": "urn:guitars2:problem:validation",
  "title": "Request validation failed",
  "status": 422,
  "errors": [
    {
      "pointer": "/body",
      "detail": "must match exactly one allowed body-model input"
    }
  ]
}
```

Example name-conflict response:

```json
{
  "type": "urn:guitars2:problem:model-name-conflict",
  "title": "A model with this name already exists in the catalog",
  "status": 409,
  "detail": "A BodyModel named 'Alder ST body' already exists in this catalog."
}
```

Example missing-resource response:

```json
{
  "type": "urn:guitars2:problem:guitar-model-not-found",
  "title": "Guitar model not found",
  "status": 404,
  "detail": "No GuitarModel exists with the requested identifier."
}
```

## Explicitly out of scope

This version does not define catalog retrieval, catalog ownership or visibility, physical inventory, prices, revisions, compatibility checks, guitar classification, body-archetype administration, model reconciliation, part-only CRUD endpoints, or list/search endpoints.
