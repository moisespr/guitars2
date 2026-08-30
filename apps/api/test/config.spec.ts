import { describe, expect, it } from "vitest";

import {
  ConfigurationError,
  loadConfig,
  loadDatabaseConfig,
} from "../src/config.js";

describe("application configuration", () => {
  it("uses documented defaults when optional environment variables are absent", () => {
    expect(loadConfig({})).toEqual({
      host: "127.0.0.1",
      port: 3000,
      logLevel: "info",
    });
  });

  it("rejects an invalid port before the server starts", () => {
    expect(() => loadConfig({ PORT: "not-a-port" })).toThrow(
      ConfigurationError,
    );
  });

  it("rejects an unknown log level before the server starts", () => {
    expect(() => loadConfig({ LOG_LEVEL: "verbose" })).toThrow(
      ConfigurationError,
    );
  });
});

describe("database configuration", () => {
  it("accepts a PostgreSQL connection URL", () => {
    expect(
      loadDatabaseConfig({
        DATABASE_URL: "postgresql://guitars2:password@127.0.0.1:5432/guitars2",
      }),
    ).toEqual({
      databaseUrl: "postgresql://guitars2:password@127.0.0.1:5432/guitars2",
    });
  });

  it("rejects a missing database connection URL", () => {
    expect(() => loadDatabaseConfig({})).toThrow(
      "DATABASE_URL must be configured.",
    );
  });

  it("rejects a non-PostgreSQL database connection URL", () => {
    expect(() =>
      loadDatabaseConfig({ DATABASE_URL: "https://example.test/database" }),
    ).toThrow("DATABASE_URL must be a valid PostgreSQL connection URL.");
  });
});
