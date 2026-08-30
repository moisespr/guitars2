import { createApplication } from "./application/create-application.js";
import { createHttpServer } from "./infrastructure/http/fastify-server.js";
import { createPostgresStore } from "./infrastructure/postgres/postgres-catalog-and-model-store.js";
import { systemClock } from "./infrastructure/system/system-clock.js";
import { randomUuidGenerator } from "./infrastructure/system/random-uuid-generator.js";
import { loadConfig, loadDatabaseConfig } from "./config.js";

const config = loadConfig(process.env);
const { databaseUrl } = loadDatabaseConfig(process.env);
const store = createPostgresStore(databaseUrl);
const application = createApplication({
  clock: systemClock,
  ids: randomUuidGenerator,
  store,
});
const server = createHttpServer(config, application);

server.addHook("onClose", () => store.destroy());

await server.listen({
  host: config.host,
  port: config.port,
});
