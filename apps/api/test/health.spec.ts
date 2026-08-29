import { afterEach, describe, expect, it } from "vitest";

import { createHttpServer } from "../src/adapters/http/create-http-server.js";

const server = createHttpServer({
  host: "127.0.0.1",
  port: 3000,
  logLevel: "fatal",
});

afterEach(async () => {
  await server.close();
});

describe("GET /health", () => {
  it("reports that the API is available", async () => {
    const response = await server.inject({
      method: "GET",
      url: "/health",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });
  });
});
