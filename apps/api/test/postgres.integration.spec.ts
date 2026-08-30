import { randomUUID } from "node:crypto";

import { Client } from "pg";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import { createApplication } from "../src/application/create-application.js";
import { createHttpServer } from "../src/infrastructure/http/fastify-server.js";
import {
  createPostgresStore,
  type PostgresStore,
} from "../src/infrastructure/postgres/postgres-catalog-and-model-store.js";
import { systemClock } from "../src/infrastructure/system/system-clock.js";
import { randomUuidGenerator } from "../src/infrastructure/system/random-uuid-generator.js";
import { loadDatabaseConfig } from "../src/config.js";

const { databaseUrl } = loadDatabaseConfig(process.env, "TEST_DATABASE_URL");
const client = new Client({ connectionString: databaseUrl });

let server: ReturnType<typeof createHttpServer>;
let store: PostgresStore;

describe("the PostgreSQL catalog and guitar-model adapters", () => {
  beforeAll(async () => {
    await client.connect();
  });

  beforeEach(async () => {
    await client.query(
      "TRUNCATE TABLE guitar_models, body_models, neck_models, bridge_models, body_archetypes, catalogs",
    );
    store = createPostgresStore(databaseUrl);
    const application = createApplication({
      clock: systemClock,
      ids: randomUuidGenerator,
      store,
    });
    server = createHttpServer(
      { host: "127.0.0.1", logLevel: "fatal", port: 3000 },
      application,
    );
  });

  afterEach(async () => {
    await server.close();
    await store.destroy();
  });

  afterAll(async () => {
    await client.end();
  });

  it("records the checked-in migration history", async () => {
    await expect(
      client.query(
        "SELECT version FROM schema_migrations WHERE version IN ('0001_establish-migration-workflow', '0002_create-catalog-and-model-schema') ORDER BY version",
      ),
    ).resolves.toMatchObject({
      rows: [
        { version: "0001_establish-migration-workflow" },
        { version: "0002_create-catalog-and-model-schema" },
      ],
    });
  });

  it("persists and retrieves the complete v1 composition through PostgreSQL", async () => {
    const archetypeId = randomUUID();
    await client.query("INSERT INTO body_archetypes (id) VALUES ($1)", [
      archetypeId,
    ]);

    const catalog = await createCatalog();
    const guitarResponse = await server.inject({
      method: "POST",
      url: `/v1/catalogs/${catalog.id}/guitar-models`,
      payload: {
        name: "Saturday ST",
        body: {
          name: "Alder ST body",
          bodyArchetypeId: archetypeId,
          material: "alder",
          finish: "sunburst",
        },
        neck: { name: "Maple C neck", profile: "C" },
        bridge: { name: "Two-point tremolo", bridgeType: "two-point tremolo" },
      },
    });

    expect(guitarResponse.statusCode).toBe(201);
    const guitar = guitarResponse.json();
    expect(guitar).toMatchObject({
      catalogId: catalog.id,
      name: "Saturday ST",
      body: { bodyArchetypeId: archetypeId, material: "alder" },
      neck: { profile: "C" },
      bridge: { bridgeType: "two-point tremolo" },
    });

    const retrieved = await server.inject({
      method: "GET",
      url: `/v1/guitar-models/${guitar.id as string}`,
    });

    expect(retrieved.statusCode).toBe(200);
    expect(retrieved.json()).toEqual(guitar);
  });

  it("rolls back newly inserted parts when the database rejects a normalized guitar-model name", async () => {
    const catalog = await createCatalog();
    const first = await server.inject({
      method: "POST",
      url: `/v1/catalogs/${catalog.id}/guitar-models`,
      payload: guitarPayload("Saturday ST", "first"),
    });
    expect(first.statusCode).toBe(201);

    const duplicate = await server.inject({
      method: "POST",
      url: `/v1/catalogs/${catalog.id}/guitar-models`,
      payload: guitarPayload("  saturday st  ", "second"),
    });

    expect(duplicate.statusCode).toBe(409);
    await expect(
      client.query(`
        SELECT
          (SELECT count(*)::integer FROM body_models) AS "bodyModels",
          (SELECT count(*)::integer FROM neck_models) AS "neckModels",
          (SELECT count(*)::integer FROM bridge_models) AS "bridgeModels",
          (SELECT count(*)::integer FROM guitar_models) AS "guitarModels"
      `),
    ).resolves.toMatchObject({
      rows: [
        {
          bodyModels: 1,
          neckModels: 1,
          bridgeModels: 1,
          guitarModels: 1,
        },
      ],
    });
  });
});

async function createCatalog(): Promise<{ readonly id: string }> {
  const response = await server.inject({
    method: "POST",
    url: "/v1/catalogs",
    payload: { name: "Dream Builds" },
  });

  expect(response.statusCode).toBe(201);
  return response.json() as { readonly id: string };
}

function guitarPayload(name: string, suffix: string) {
  return {
    name,
    body: { name: `Body ${suffix}` },
    neck: { name: `Neck ${suffix}` },
    bridge: { name: `Bridge ${suffix}` },
  };
}
