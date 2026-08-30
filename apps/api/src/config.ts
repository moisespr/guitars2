import { Type, type Static } from "typebox";
import { Value } from "typebox/value";
import { config as loadEnvironmentFile } from "dotenv";

loadEnvironmentFile({ path: new URL("../../../.env", import.meta.url) });

export const AppConfigSchema = Type.Object({
  host: Type.String({ minLength: 1 }),
  port: Type.Integer({ minimum: 1, maximum: 65_535 }),
  logLevel: Type.Union([
    Type.Literal("fatal"),
    Type.Literal("error"),
    Type.Literal("warn"),
    Type.Literal("info"),
    Type.Literal("debug"),
    Type.Literal("trace"),
  ]),
});

export type AppConfig = Static<typeof AppConfigSchema>;

export interface DatabaseConfig {
  readonly databaseUrl: string;
}

export class ConfigurationError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "ConfigurationError";
  }
}

export function loadConfig(environment: NodeJS.ProcessEnv): AppConfig {
  const config = {
    host: environment.HOST ?? "127.0.0.1",
    port: Number(environment.PORT ?? "3000"),
    logLevel: environment.LOG_LEVEL ?? "info",
  };

  if (!Value.Check(AppConfigSchema, config)) {
    const errors = [...Value.Errors(AppConfigSchema, config)]
      .map((error) => error.message)
      .join("; ");

    throw new ConfigurationError(
      `Invalid application configuration: ${errors}`,
    );
  }

  return config;
}

export function loadDatabaseConfig(
  environment: NodeJS.ProcessEnv,
  variableName = "DATABASE_URL",
): DatabaseConfig {
  const databaseUrl = environment[variableName];

  if (databaseUrl === undefined || databaseUrl.trim().length === 0) {
    throw new ConfigurationError(`${variableName} must be configured.`);
  }

  try {
    const url = new URL(databaseUrl);

    if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
      throw new Error("unsupported protocol");
    }
  } catch {
    throw new ConfigurationError(
      `${variableName} must be a valid PostgreSQL connection URL.`,
    );
  }

  return { databaseUrl };
}
