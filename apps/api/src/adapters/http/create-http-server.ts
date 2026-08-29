import Fastify from "fastify";
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { Type } from "typebox";

import type { AppConfig } from "../../config.js";

const HealthResponseSchema = Type.Object({
  status: Type.Literal("ok"),
});

export function createHttpServer(config: AppConfig) {
  const server = Fastify({
    logger: {
      level: config.logLevel,
    },
  }).withTypeProvider<TypeBoxTypeProvider>();

  server.get(
    "/health",
    {
      schema: {
        response: {
          200: HealthResponseSchema,
        },
      },
    },
    async () => ({ status: "ok" }),
  );

  return server;
}
