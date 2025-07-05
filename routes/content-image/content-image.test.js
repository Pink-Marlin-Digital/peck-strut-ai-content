import { test, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import nock from 'nock';
import { registerContentImageRoute } from './content-image.route.js';

let server;
let address;

beforeAll(async () => {
  server = Fastify();
  registerContentImageRoute(server);
  await server.listen({ port: 0 });
  address = server.server.address();
});

afterAll(async () => {
  await server.close();
});

test.skip('POST /content-image returns an image URL', async () => {
  const openaiBase = process.env.OPENAI_API_BASE_URL || 'https://api.openai.com';
  nock(openaiBase)
    .post(/\/images\/generations/)
    .reply(200, {
      data: [ { url: 'https://mock-image-url.com/image.png' } ]
    });

  const res = await fetch(`http://127.0.0.1:${address.port}/content-image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'A chicken riding a skateboard' })
  });
  const json = await res.json();
  expect(json.imageUrl).toBe('https://mock-image-url.com/image.png');
});
