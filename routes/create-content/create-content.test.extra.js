import { test, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
import { fileURLToPath } from 'url';
import nock from 'nock';

// These tests assume the Fastify server is running, and address/port is known.
// Adjust as needed for your test harness.
const address = { port: 3000 };

test('POST /create-content works with only prompt', async () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const TEMPLATE_PATH = path.join(__dirname, './prompt-template.md');
  const templateContent = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  const compiledTemplate = Handlebars.compile(templateContent);

  const openaiBase = process.env.OPENAI_API_BASE_URL || 'https://api.openai.com';
  const model = process.env.OPENAI_MODEL_NAME || 'gpt-3.5-turbo';
  const expectedPrompt = compiledTemplate({
    prompt: 'Just a prompt.'
  });
  const messageText = `Just a prompt.`;
  nock(openaiBase)
    .post(/\/chat\/completions/)
    .reply(200, {
      id: 'mock-id-3',
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
    .post(/\/chat\/completions/)
    .reply(200, {
      id: 'mock-id-4',
      created: Date.now(),
      model,
      usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
      choices: [
        {
          message: { role: 'assistant', content: '["#prompt"]' },
          finish_reason: 'stop',
          index: 0
        }
      ]
    });

  const res = await fetch(`http://127.0.0.1:${address.port}/create-content`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: 'Just a prompt.'
    })
  });
  const json = await res.json();
  expect(json.message).toContain('Just a prompt.');
  expect(json.message).not.toContain('Persona:');
  expect(json.message).not.toContain('Sentiment:');
  expect(Array.isArray(json.hashtags)).toBe(true);
  expect(json.hashtags[0]).toMatch(/^#/);
});

test('POST /create-content works with prompt and persona only', async () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const TEMPLATE_PATH = path.join(__dirname, './prompt-template.md');
  const templateContent = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  const compiledTemplate = Handlebars.compile(templateContent);

  const openaiBase = process.env.OPENAI_API_BASE_URL || 'https://api.openai.com';
  const model = process.env.OPENAI_MODEL_NAME || 'gpt-3.5-turbo';
  const expectedPrompt = compiledTemplate({
    prompt: 'Prompt with persona.',
    persona: 'Narrator'
  });
  const messageText = `Persona: Narrator\nPrompt with persona.`;
  nock(openaiBase)
    .post(/\/chat\/completions/)
    .reply(200, {
      id: 'mock-id-5',
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
    .post(/\/chat\/completions/)
    .reply(200, {
      id: 'mock-id-6',
      created: Date.now(),
      model,
      usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
      choices: [
        {
          message: { role: 'assistant', content: '["#personaonly"]' },
          finish_reason: 'stop',
          index: 0
        }
      ]
    });

  const res = await fetch(`http://127.0.0.1:${address.port}/create-content`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: 'Prompt with persona.',
      persona: 'Narrator'
    })
  });
  const json = await res.json();
  expect(json.message).toContain('Persona: Narrator');
  expect(json.message).toContain('Prompt with persona.');
  expect(json.message).not.toContain('Sentiment:');
  expect(Array.isArray(json.hashtags)).toBe(true);
  expect(json.hashtags[0]).toMatch(/^#/);
});

test('POST /create-content works with prompt and sentiment only', async () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const TEMPLATE_PATH = path.join(__dirname, './prompt-template.md');
  const templateContent = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  const compiledTemplate = Handlebars.compile(templateContent);

  const openaiBase = process.env.OPENAI_API_BASE_URL || 'https://api.openai.com';
  const model = process.env.OPENAI_MODEL_NAME || 'gpt-3.5-turbo';
  const expectedPrompt = compiledTemplate({
    prompt: 'Prompt with sentiment.',
    sentiment: 'Excited'
  });
  const messageText = `Sentiment: Excited\nPrompt with sentiment.`;
  nock(openaiBase)
    .post(/\/chat\/completions/)
    .reply(200, {
      id: 'mock-id-7',
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
    .post(/\/chat\/completions/)
    .reply(200, {
      id: 'mock-id-8',
      created: Date.now(),
      model,
      usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
      choices: [
        {
          message: { role: 'assistant', content: '["#sentimentonly"]' },
          finish_reason: 'stop',
          index: 0
        }
      ]
    });

  const res = await fetch(`http://127.0.0.1:${address.port}/create-content`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: 'Prompt with sentiment.',
      sentiment: 'Excited'
    })
  });
  const json = await res.json();
  expect(json.message).toContain('Sentiment: Excited');
  expect(json.message).toContain('Prompt with sentiment.');
  expect(json.message).not.toContain('Persona:');
  expect(Array.isArray(json.hashtags)).toBe(true);
  expect(json.hashtags[0]).toMatch(/^#/);
});
