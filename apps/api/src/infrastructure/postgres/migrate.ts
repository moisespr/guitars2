import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";

import { Client } from "pg";

import { loadDatabaseConfig } from "../../config.js";

const migrationDirectory = new URL("../../../migrations/", import.meta.url);
const migrationFileName = /^\d{4}_[a-z0-9-]+\.sql$/;
const migrationLockId = 2_026_083_000;

interface Migration {
  readonly checksum: string;
  readonly sql: string;
  readonly version: string;
}

function databaseUrlEnvironmentVariable(arguments_: readonly string[]): string {
  const argumentIndex = arguments_.indexOf("--database-url-env");

  if (argumentIndex === -1) {
    return "DATABASE_URL";
  }

  const variableName = arguments_[argumentIndex + 1];

  if (variableName === undefined || variableName.trim().length === 0) {
    throw new Error(
      "--database-url-env requires an environment-variable name.",
    );
  }

  return variableName;
}

async function readMigrations(): Promise<readonly Migration[]> {
  const fileNames = (await readdir(migrationDirectory))
    .filter((fileName) => migrationFileName.test(fileName))
    .sort();

  return Promise.all(
    fileNames.map(async (fileName) => {
      const sql = await readFile(new URL(fileName, migrationDirectory), "utf8");

      return {
        checksum: createHash("sha256").update(sql).digest("hex"),
        sql,
        version: basename(fileName, extname(fileName)),
      };
    }),
  );
}

async function ensureMigrationHistory(client: Client): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version text PRIMARY KEY,
      checksum text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function applyMigrations(
  client: Client,
  migrations: readonly Migration[],
) {
  await client.query("SELECT pg_advisory_lock($1)", [migrationLockId]);

  try {
    await ensureMigrationHistory(client);
    const appliedMigrations = await client.query<{
      readonly checksum: string;
      readonly version: string;
    }>("SELECT version, checksum FROM schema_migrations");
    const appliedChecksums = new Map(
      appliedMigrations.rows.map((migration) => [
        migration.version,
        migration.checksum,
      ]),
    );

    for (const migration of migrations) {
      const appliedChecksum = appliedChecksums.get(migration.version);

      if (appliedChecksum !== undefined) {
        if (appliedChecksum !== migration.checksum) {
          throw new Error(
            `Migration ${migration.version} was changed after it was applied.`,
          );
        }

        continue;
      }

      await client.query("BEGIN");

      try {
        await client.query(migration.sql);
        await client.query(
          "INSERT INTO schema_migrations (version, checksum) VALUES ($1, $2)",
          [migration.version, migration.checksum],
        );
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
  } finally {
    await client.query("SELECT pg_advisory_unlock($1)", [migrationLockId]);
  }
}

async function main(): Promise<void> {
  const variableName = databaseUrlEnvironmentVariable(process.argv.slice(2));
  const { databaseUrl } = loadDatabaseConfig(process.env, variableName);
  const client = new Client({ connectionString: databaseUrl });

  await client.connect();

  try {
    await applyMigrations(client, await readMigrations());
  } finally {
    await client.end();
  }
}

await main();
