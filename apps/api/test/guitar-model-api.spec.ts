import { afterEach, describe, expect, it } from "vitest";

import { createApplication } from "../src/application/create-application.js";
import { createHttpServer } from "../src/infrastructure/http/fastify-server.js";
import { fixedClock, fixedIds } from "./support/fixed-dependencies.js";
import { InMemoryCatalogAndModelStore } from "./support/in-memory-store.js";

const ids = [
  "00000000-0000-4000-8000-000000000001",
  "00000000-0000-4000-8000-000000000002",
  "00000000-0000-4000-8000-000000000003",
  "00000000-0000-4000-8000-000000000004",
  "00000000-0000-4000-8000-000000000005",
  "00000000-0000-4000-8000-000000000006",
  "00000000-0000-4000-8000-000000000007",
  "00000000-0000-4000-8000-000000000008",
  "00000000-0000-4000-8000-000000000009",
] as const;

const servers: ReturnType<typeof createHttpServer>[] = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => server.close()));
});

describe("the catalog and guitar-model API", () => {
  it("creates a catalog, creates a nested guitar-model composition, and retrieves it", async () => {
    const server = createServer();
    const catalogResponse = await server.inject({
      method: "POST",
      url: "/v1/catalogs",
      payload: { name: "Dream Builds" },
    });

    expect(catalogResponse.statusCode).toBe(201);
    expect(catalogResponse.json()).toMatchObject({
      id: ids[0],
      name: "Dream Builds",
      createdAt: "2026-08-30T08:00:00.000Z",
    });

    const createResponse = await server.inject({
      method: "POST",
      url: `/v1/catalogs/${ids[0]}/guitar-models`,
      payload: {
        name: "Saturday ST",
        body: { name: "Alder ST body", material: "alder", finish: "sunburst" },
        neck: { name: "Maple C neck", profile: "C" },
        bridge: { name: "Two-point tremolo", bridgeType: "two-point tremolo" },
      },
    });

    expect(createResponse.statusCode).toBe(201);
    expect(createResponse.json()).toMatchObject({
      id: ids[4],
      catalogId: ids[0],
      name: "Saturday ST",
      body: { id: ids[1], material: "alder", finish: "sunburst" },
      neck: { id: ids[2], profile: "C" },
      bridge: { id: ids[3], bridgeType: "two-point tremolo" },
    });

    const retrieveResponse = await server.inject({
      method: "GET",
      url: `/v1/guitar-models/${ids[4]}`,
    });

    expect(retrieveResponse.statusCode).toBe(200);
    expect(retrieveResponse.json()).toEqual(createResponse.json());
  });

  it("returns the documented validation problem for malformed nested input", async () => {
    const server = createServer();
    const response = await server.inject({
      method: "POST",
      url: "/v1/catalogs",
      payload: { name: "" },
    });

    expect(response.statusCode).toBe(422);
    expect(response.headers["content-type"]).toContain(
      "application/problem+json",
    );
    expect(response.json()).toMatchObject({
      type: "urn:guitars2:problem:validation",
      title: "Request validation failed",
      status: 422,
    });

    const malformedJson = await server.inject({
      headers: { "content-type": "application/json" },
      method: "POST",
      payload: "{",
      url: "/v1/catalogs",
    });

    expect(malformedJson.statusCode).toBe(400);
    expect(malformedJson.json()).toMatchObject({
      type: "about:blank",
      status: 400,
    });
  });

  it("returns the documented conflict problem for a normalized duplicate part name", async () => {
    const server = createServer();
    await createCatalog(server);
    await createGuitarModel(server, {
      body: { name: "Alder ST body" },
      bridge: { name: "Bridge one" },
      name: "Guitar one",
      neck: { name: "Neck one" },
    });

    const response = await createGuitarModel(server, {
      body: { name: "  alder st body  " },
      bridge: { name: "Bridge two" },
      name: "Guitar two",
      neck: { name: "Neck two" },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({
      type: "urn:guitars2:problem:model-name-conflict",
      status: 409,
    });
  });

  it("returns documented missing-resource and unknown-archetype problems", async () => {
    const server = createServer();
    const missingGuitar = await server.inject({
      method: "GET",
      url: "/v1/guitar-models/00000000-0000-4000-8000-000000000099",
    });

    expect(missingGuitar.statusCode).toBe(404);
    expect(missingGuitar.json()).toMatchObject({
      type: "urn:guitars2:problem:guitar-model-not-found",
      status: 404,
    });

    const missingCatalog = await server.inject({
      method: "POST",
      payload: {
        name: "Guitar",
        body: { name: "Body" },
        neck: { name: "Neck" },
        bridge: { name: "Bridge" },
      },
      url: "/v1/catalogs/00000000-0000-4000-8000-000000000098/guitar-models",
    });

    expect(missingCatalog.statusCode).toBe(404);
    expect(missingCatalog.json()).toMatchObject({
      type: "urn:guitars2:problem:catalog-not-found",
      status: 404,
    });

    await createCatalog(server);
    const unknownArchetype = await createGuitarModel(server, {
      body: {
        name: "Alder ST body",
        bodyArchetypeId: "00000000-0000-4000-8000-000000000099",
      },
      bridge: { name: "Bridge" },
      name: "Guitar",
      neck: { name: "Neck" },
    });

    expect(unknownArchetype.statusCode).toBe(422);
    expect(unknownArchetype.json()).toMatchObject({
      type: "urn:guitars2:problem:validation",
      status: 422,
    });
  });
});

function createServer() {
  const store = new InMemoryCatalogAndModelStore();
  const application = createApplication({
    clock: fixedClock(),
    ids: fixedIds(...ids),
    store,
  });
  const server = createHttpServer(
    { host: "127.0.0.1", logLevel: "fatal", port: 3000 },
    application,
  );
  servers.push(server);
  return server;
}

async function createCatalog(server: ReturnType<typeof createHttpServer>) {
  return server.inject({
    method: "POST",
    payload: { name: "Dream Builds" },
    url: "/v1/catalogs",
  });
}

async function createGuitarModel(
  server: ReturnType<typeof createHttpServer>,
  payload: Record<string, unknown>,
) {
  return server.inject({
    method: "POST",
    payload,
    url: `/v1/catalogs/${ids[0]}/guitar-models`,
  });
}
