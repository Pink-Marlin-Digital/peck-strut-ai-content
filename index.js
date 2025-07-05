import 'dotenv/config';
import Fastify from 'fastify';
import { registerCreateContentRoute } from './routes/create-content/create-content.route.js';

const server = Fastify();

// Register all routes
console.info('[index] Registering all routes');
registerCreateContentRoute(server);

const PORT = process.env.PORT || 3000;
server.listen({ port: PORT, host: '0.0.0.0' }, err => {
  if (err) {
    console.warn('[index] Error starting server', err);
    process.exit(1);
  }
  console.info(`[index] Server listening on port ${PORT}`);
});
