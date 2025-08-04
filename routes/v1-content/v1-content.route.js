// Route handler for /v1/content/:id routes
// JSDoc included per project standards
import { registerV1CreateIdeaRoute } from "./create-idea.route.js";
import { registerV1PostContentRoute } from "./post-content.route.js";
import { registerV1ContentImageRoute } from "./content-image.route.js";

/**
 * Registers the /v1/content/:id routes on the provided Fastify instance.
 * @param {import('fastify').FastifyInstance} server - The Fastify server instance.
 */
export function registerV1ContentRoutes(server) {
  console.info("[registerV1ContentRoutes] Registering /v1/content/:id routes");

  // Register individual route handlers
  registerV1CreateIdeaRoute(server);
  registerV1PostContentRoute(server);
  registerV1ContentImageRoute(server);
}
