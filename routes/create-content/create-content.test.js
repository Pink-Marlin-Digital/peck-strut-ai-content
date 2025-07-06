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
  const TEMPLATE_PATH = path.join(__dirname, './prompt-template.md');
  const templateContent = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  const compiledTemplate = Handlebars.compile(templateContent);

  // Mock OpenAI API with nock
  const openaiBase = process.env.OPENAI_API_BASE_URL || 'https://api.openai.com';
  const model = process.env.OPENAI_MODEL_NAME || 'gpt-3.5-turbo';
  const expectedPrompt = compiledTemplate({
    prompt: 'Write a story about a cat.',
    persona: 'Storyteller',
    sentiment: 'Cheerful'
  });

  // First LLM call: message
  const messageText = `Persona: Storyteller\nSentiment: Cheerful\nWrite a story about a cat.`;
  nock(openaiBase)
    .post(/\/chat\/completions/)
    .reply(200, {
      id: 'mock-id-1',
      created: Date.now(),
      model,
      usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      choices: [
        {
          message: { role: 'assistant', content: messageText },
          finish_reason: 'stop',
          index: 0
        }
      ]
    })
    // Second LLM call: hashtags
    .post(/\/chat\/completions/)
    .reply(200, {
      id: 'mock-id-2',
      created: Date.now(),
      model,
      usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
      choices: [
        {
          message: { role: 'assistant', content: '["#cat", "#story", "#funny", "#cheerful", "#persona", "#prompt"]' },
          finish_reason: 'stop',
          index: 0
        }
      ]
    })
    // Third LLM call: image prompt
    .post(/\/chat\/completions/)
    .reply(200, {
      id: 'mock-id-3',
      created: Date.now(),
      model,
      usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
      choices: [
        {
          message: { role: 'assistant', content: 'A cheerful cartoon chicken running in a sunny farmyard with fireworks in the background.' },
          finish_reason: 'stop',
          index: 0
        }
      ]
    });

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

  if (json.error) {
    throw new Error(`API returned error: ${json.error} - ${json.details || ''}`);
  }

  expect(json.message).toContain('Persona: Storyteller');
  expect(json.message).toContain('Sentiment: Cheerful');
  expect(json.message).toContain('Write a story about a cat.');
  expect(Array.isArray(json.hashtags)).toBe(true);
  expect(json.hashtags.length).toBeGreaterThan(0);
  expect(json.hashtags[0]).toMatch(/^#/);
  expect(typeof json.image_prompt).toBe('string');
  expect(json.image_prompt.length).toBeGreaterThan(0);
  expect(json.image_prompt).toContain('chicken');
});
