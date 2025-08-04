import 'dotenv/config';
import Fastify from 'fastify';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import fastifyCors from '@fastify/cors';
import { registerCreateContentRoute } from './routes/create-content/create-content.route.js';
import { registerContentImageRoute } from './routes/content-image/content-image.route.js';
import { registerGenerateIdeaRoute } from './routes/generate-idea/generate-idea.route.js';
import { registerPostInstagramRoute } from './routes/post-instagram/post-instagram.route.js';
import { registerV1ContentRoutes } from './routes/v1-content/v1-content.route.js';

const server = Fastify();

// Register CORS plugin to allow cross-origin requests
await server.register(fastifyCors, {
  origin: true, // Allow all origins
  credentials: true, // Allow credentials
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
});

// Global API key protection
server.addHook('preHandler', async (request, reply) => {
  // Allow public access to Swagger docs
  const url = request.raw.url || request.url;
  if (url.startsWith('/docs')) return;

  const requiredKey = process.env.API_KEY;
  if (!requiredKey) return; // Skip check if not set
  const authHeader = request.headers['authorization'];
  if (!authHeader || authHeader !== `Bearer ${requiredKey}`) {
    reply.code(401).send({ error: 'Unauthorized' });
  }
});

// Register Swagger plugins
await server.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'Peck & Strut AI Content API',
      description: 'API documentation for Peck & Strut AI Content server',
      version: '1.0.0'
    }
  }
});
await server.register(fastifySwaggerUi, {
  routePrefix: '/docs'
});

// Register all routes
console.info('[index] Registering all routes');
registerCreateContentRoute(server);
registerContentImageRoute(server);
registerGenerateIdeaRoute(server);
registerPostInstagramRoute(server);
registerV1ContentRoutes(server);

const PORT = process.env.PORT || 3000;
server.listen({ port: PORT, host: '0.0.0.0' }, err => {
  if (err) {
    console.warn('[index] Error starting server', err);
    process.exit(1);
  }
  console.info(`[index] Server listening on port ${PORT}`);
});
