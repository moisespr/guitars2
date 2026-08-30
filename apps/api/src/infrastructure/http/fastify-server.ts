import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

import { Ajv2020 } from "ajv/dist/2020.js";
import Fastify, {
  type FastifyError,
  type FastifyInstance,
  type FastifyReply,
  type FastifyRequest,
} from "fastify";

import type { Application } from "../../application/create-application.js";
import type { CreateCatalogCommand } from "../../application/catalog/create-catalog.js";
import type { CreateGuitarModelCommand } from "../../application/guitar-model/create-guitar-model.js";
import type { AppConfig } from "../../config.js";
import type { BodyModel } from "../../domain/body-model/body-model.js";
import type { BridgeModel } from "../../domain/bridge-model/bridge-model.js";
import { CatalogNotFoundError } from "../../domain/catalog/catalog-not-found-error.js";
import type { Catalog } from "../../domain/catalog/catalog.js";
import { GuitarModelNotFoundError } from "../../domain/guitar-model/guitar-model-not-found-error.js";
import type { GuitarModel } from "../../domain/guitar-model/guitar-model.js";
import type { NeckModel } from "../../domain/neck-model/neck-model.js";
import { InvalidReferenceError } from "../../domain/shared/invalid-reference-error.js";
import { InvalidDomainInputError } from "../../domain/shared/model-name.js";
import { ModelNameConflictError } from "../../domain/shared/model-name-conflict-error.js";

const problemMediaType = "application/problem+json";
const require = createRequire(import.meta.url);
const addFormats = require("ajv-formats") as (validator: Ajv2020) => void;
const schemaDirectory = new URL(
  "../../../../../docs/api/v1/schemas/",
  import.meta.url,
);
const schemas = [
  loadSchema("body-model.schema.json"),
  loadSchema("bridge-model.schema.json"),
  loadSchema("catalog.schema.json"),
  loadSchema("guitar-model.schema.json"),
  loadSchema("neck-model.schema.json"),
  loadSchema("problem-details.schema.json"),
];

const schemaIds = {
  bodyModel: "urn:guitars2:schema:v1:body-model",
  bridgeModel: "urn:guitars2:schema:v1:bridge-model",
  catalog: "urn:guitars2:schema:v1:catalog",
  guitarModel: "urn:guitars2:schema:v1:guitar-model",
  neckModel: "urn:guitars2:schema:v1:neck-model",
} as const;

export function createHttpServer(
  config: AppConfig,
  application: Application,
): FastifyInstance {
  const validator = new Ajv2020({ allErrors: true, strict: true });
  addFormats(validator);

  for (const schema of schemas) {
    validator.addSchema(schema);
  }

  const server = Fastify({
    logger: {
      level: config.logLevel,
    },
  });

  for (const schema of schemas) {
    server.addSchema(schema);
  }

  server.setValidatorCompiler(({ schema }) => validator.compile(schema));
  server.setSerializerCompiler(() => JSON.stringify);
  server.setErrorHandler((error, request, reply) => {
    sendKnownError(error as FastifyError, request, reply);
  });

  server.get(
    "/health",
    {
      schema: {
        response: {
          200: {
            type: "object",
            additionalProperties: false,
            required: ["status"],
            properties: { status: { const: "ok" } },
          },
        },
      },
    },
    async () => ({ status: "ok" }),
  );

  server.post(
    "/v1/catalogs",
    {
      schema: {
        body: { $ref: `${schemaIds.catalog}#/$defs/Create` },
        response: { 201: { $ref: schemaIds.catalog } },
      },
    },
    async (request, reply) => {
      const catalog = await application.createCatalog.execute(
        toCreateCatalogCommand(request.body),
      );

      return reply.code(201).send(toCatalogResponse(catalog));
    },
  );

  server.post(
    "/v1/catalogs/:catalogId/guitar-models",
    {
      schema: {
        body: { $ref: `${schemaIds.guitarModel}#/$defs/Create` },
        params: {
          type: "object",
          additionalProperties: false,
          required: ["catalogId"],
          properties: { catalogId: { type: "string", format: "uuid" } },
        },
        response: { 201: { $ref: schemaIds.guitarModel } },
      },
    },
    async (request, reply) => {
      const command = toCreateGuitarModelCommand(
        request.params as { readonly catalogId: string },
        request.body,
      );
      const guitarModel = await application.createGuitarModel.execute(command);

      return reply.code(201).send(toGuitarModelResponse(guitarModel));
    },
  );

  server.get(
    "/v1/guitar-models/:guitarModelId",
    {
      schema: {
        params: {
          type: "object",
          additionalProperties: false,
          required: ["guitarModelId"],
          properties: { guitarModelId: { type: "string", format: "uuid" } },
        },
        response: { 200: { $ref: schemaIds.guitarModel } },
      },
    },
    async (request) => {
      const { guitarModelId } = request.params as {
        readonly guitarModelId: string;
      };
      const guitarModel =
        await application.getGuitarModel.execute(guitarModelId);

      return toGuitarModelResponse(guitarModel);
    },
  );

  return server;
}

function loadSchema(fileName: string): Record<string, unknown> {
  return JSON.parse(
    readFileSync(new URL(fileName, schemaDirectory), "utf8"),
  ) as Record<string, unknown>;
}

function toCreateCatalogCommand(body: unknown): CreateCatalogCommand {
  const value = asRecord(body);
  return { name: asString(value.name) };
}

function toCreateGuitarModelCommand(
  params: { readonly catalogId: string },
  body: unknown,
): CreateGuitarModelCommand {
  const value = asRecord(body);

  return {
    body: toBodyInput(asRecord(value.body)),
    bridge: toBridgeInput(asRecord(value.bridge)),
    catalogId: params.catalogId,
    name: asString(value.name),
    neck: toNeckInput(asRecord(value.neck)),
  };
}

function toBodyInput(value: Record<string, unknown>) {
  if ("id" in value) {
    return { id: asString(value.id) };
  }

  return {
    ...(value.bodyArchetypeId === undefined
      ? {}
      : { bodyArchetypeId: asString(value.bodyArchetypeId) }),
    ...(value.finish === undefined ? {} : { finish: asString(value.finish) }),
    ...(value.material === undefined
      ? {}
      : { material: asString(value.material) }),
    name: asString(value.name),
  };
}

function toNeckInput(value: Record<string, unknown>) {
  if ("id" in value) {
    return { id: asString(value.id) };
  }

  return {
    name: asString(value.name),
    ...(value.profile === undefined
      ? {}
      : { profile: asString(value.profile) }),
  };
}

function toBridgeInput(value: Record<string, unknown>) {
  if ("id" in value) {
    return { id: asString(value.id) };
  }

  return {
    ...(value.bridgeType === undefined
      ? {}
      : { bridgeType: asString(value.bridgeType) }),
    name: asString(value.name),
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(
      "The validated request body was unexpectedly not an object.",
    );
  }

  return value as Record<string, unknown>;
}

function asString(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error(
      "The validated request value was unexpectedly not a string.",
    );
  }

  return value;
}

function toCatalogResponse(catalog: Catalog) {
  return {
    createdAt: catalog.createdAt.toISOString(),
    id: catalog.id,
    name: catalog.name,
    updatedAt: catalog.updatedAt.toISOString(),
  };
}

function toBodyModelResponse(model: BodyModel) {
  return {
    ...(model.bodyArchetypeId === undefined
      ? {}
      : { bodyArchetypeId: model.bodyArchetypeId }),
    ...(model.finish === undefined ? {} : { finish: model.finish }),
    ...(model.material === undefined ? {} : { material: model.material }),
    catalogId: model.catalogId,
    createdAt: model.createdAt.toISOString(),
    id: model.id,
    name: model.name,
    updatedAt: model.updatedAt.toISOString(),
  };
}

function toNeckModelResponse(model: NeckModel) {
  return {
    catalogId: model.catalogId,
    createdAt: model.createdAt.toISOString(),
    id: model.id,
    name: model.name,
    ...(model.profile === undefined ? {} : { profile: model.profile }),
    updatedAt: model.updatedAt.toISOString(),
  };
}

function toBridgeModelResponse(model: BridgeModel) {
  return {
    ...(model.bridgeType === undefined ? {} : { bridgeType: model.bridgeType }),
    catalogId: model.catalogId,
    createdAt: model.createdAt.toISOString(),
    id: model.id,
    name: model.name,
    updatedAt: model.updatedAt.toISOString(),
  };
}

function toGuitarModelResponse(model: GuitarModel) {
  return {
    body: toBodyModelResponse(model.body),
    bridge: toBridgeModelResponse(model.bridge),
    catalogId: model.catalogId,
    createdAt: model.createdAt.toISOString(),
    id: model.id,
    name: model.name,
    neck: toNeckModelResponse(model.neck),
    updatedAt: model.updatedAt.toISOString(),
  };
}

function sendKnownError(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  if (error.validation !== undefined) {
    sendProblem(reply, {
      errors: error.validation.map((validationError) => ({
        detail: validationError.message ?? "is invalid",
        pointer:
          validationError.instancePath === ""
            ? "/"
            : validationError.instancePath,
      })),
      status: 422,
      title: "Request validation failed",
      type: "urn:guitars2:problem:validation",
    });
    return;
  }

  if (error.code === "FST_ERR_CTP_INVALID_JSON_BODY") {
    sendProblem(reply, {
      status: 400,
      title: "Bad Request",
      type: "about:blank",
    });
    return;
  }

  if (error instanceof CatalogNotFoundError) {
    sendProblem(reply, {
      detail: error.message,
      status: 404,
      title: "Catalog not found",
      type: "urn:guitars2:problem:catalog-not-found",
    });
    return;
  }

  if (error instanceof GuitarModelNotFoundError) {
    sendProblem(reply, {
      detail: "No GuitarModel exists with the requested identifier.",
      status: 404,
      title: "Guitar model not found",
      type: "urn:guitars2:problem:guitar-model-not-found",
    });
    return;
  }

  if (error instanceof ModelNameConflictError) {
    sendProblem(reply, {
      detail: error.message,
      status: 409,
      title: "A model with this name already exists in the catalog",
      type: "urn:guitars2:problem:model-name-conflict",
    });
    return;
  }

  if (
    error instanceof InvalidDomainInputError ||
    error instanceof InvalidReferenceError
  ) {
    sendProblem(reply, {
      errors: [{ detail: error.message, pointer: error.pointer }],
      status: 422,
      title: "Request validation failed",
      type: "urn:guitars2:problem:validation",
    });
    return;
  }

  request.log.error(error);
  sendProblem(reply, {
    status: 500,
    title: "Internal Server Error",
    type: "about:blank",
  });
}

function sendProblem(
  reply: FastifyReply,
  problem: {
    readonly detail?: string;
    readonly errors?: readonly {
      readonly detail: string;
      readonly pointer: string;
    }[];
    readonly status: number;
    readonly title: string;
    readonly type: string;
  },
): void {
  reply.code(problem.status).type(problemMediaType).send(problem);
}
