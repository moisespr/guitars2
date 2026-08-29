import { describe, expect, it } from "vitest";

import { ConfigurationError, loadConfig } from "../src/config.js";

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
