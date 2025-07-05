import { test, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
import nock from 'nock';
import { fileURLToPath } from 'url';

let server;
let address;

beforeAll(async () => {
  // Use the same template as production
  const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATE_PATH = path.join(__dirname, '../prompt-template.md');
  const templateContent = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  const compiledTemplate = Handlebars.compile(templateContent);

  server = Fastify();
  server.post('/create-content', async (request, reply) => {
    const { prompt, persona, sentiment } = request.body;
    const formattedPrompt = compiledTemplate({ prompt, persona, sentiment });
    // Simulate downstream LLM call
    const llmScope = nock('https://fake-llm-endpoint.com')
      .post('/v1/generate', body => {
        // Assert prompt is as expected
        expect(body.prompt).toBe(formattedPrompt);
        return true;
      })
      .reply(200, { result: 'LLM response' });
    // Simulate sending prompt to LLM
    await fetch('https://fake-llm-endpoint.com/v1/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: formattedPrompt })
    });
    llmScope.done();
    return { formattedPrompt };
  });
  await server.listen({ port: 0 });
  address = server.server.address();
});

afterAll(async () => {
  await server.close();
});

test('POST /create-content returns formatted prompt and sends to LLM', async () => {
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
