import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { loadDatabaseConfig } from "../src/config.js";

const { databaseUrl } = loadDatabaseConfig(process.env, "TEST_DATABASE_URL");
const client = new Client({ connectionString: databaseUrl });

describe("the local PostgreSQL integration database", () => {
  beforeAll(async () => {
    await client.connect();
  });

  afterAll(async () => {
    await client.end();
  });

  it("accepts a connection after explicit SQL migrations are applied", async () => {
    await expect(client.query("SELECT 1 AS ready")).resolves.toMatchObject({
      rows: [{ ready: 1 }],
    });
  });

  it("records the checked-in migration baseline", async () => {
    await expect(
      client.query(
        "SELECT version FROM schema_migrations WHERE version = '0001_establish-migration-workflow'",
      ),
    ).resolves.toMatchObject({
      rows: [{ version: "0001_establish-migration-workflow" }],
    });
  });
});
