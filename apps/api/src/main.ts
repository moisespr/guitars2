import { loadConfig, loadDatabaseConfig } from "./config.js";
import { createHttpServer } from "./adapters/http/create-http-server.js";

const config = loadConfig(process.env);
loadDatabaseConfig(process.env);
const server = createHttpServer(config);

await server.listen({
  host: config.host,
  port: config.port,
});
