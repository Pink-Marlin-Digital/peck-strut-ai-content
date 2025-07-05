import { test, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import nock from 'nock';
import { registerCreateContentRoute } from './create-content.route.js';
import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
import { fileURLToPath } from 'url';

let server;
let address;

beforeAll(async () => {
  server = Fastify();
  registerCreateContentRoute(server);
  await server.listen({ port: 0 });
  address = server.server.address();
});

afterAll(async () => {
  await server.close();
});

test('POST /create-content returns formatted prompt and sends to LLM', async () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const TEMPLATE_PATH = path.join(__dirname, '../../prompt-template.md');
  const templateContent = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  const compiledTemplate = Handlebars.compile(templateContent);

  const res = await fetch(`http://127.0.0.1:${address.port}/create-content`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: 'Write a story about a cat.',
      persona: 'Storyteller',
      sentiment: 'Cheerful'
    })
  });
  const json = await res.json();
  expect(json.formattedPrompt).toContain('Persona: Storyteller');
  expect(json.formattedPrompt).toContain('Sentiment: Cheerful');
  expect(json.formattedPrompt).toContain('Write a story about a cat.');
});
