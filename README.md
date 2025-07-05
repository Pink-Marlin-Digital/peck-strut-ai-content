# Peck & Strut AI Content Orchestrator

This project is a Fastify server for orchestrating AI content for Peck and Strut. It uses a Handlebars markdown template for prompt formatting and is ready for Heroku deployment.

## Features
- POST `/create-content`: Accepts `prompt`, `persona`, and `sentiment` and returns a formatted prompt using a markdown template.
- Easily modifiable prompt template via `prompt-template.md`.
- Fully tested with Vitest, mocks downstream LLM/OpenAPI requests with Nock.
- Heroku-ready (uses `PORT` env variable and includes a `Procfile`).

## Getting Started

```bash
npm install
npm start
```

### Testing

```bash
npm test
```

### Heroku Deployment

1. Commit your code to git.
2. Create a Heroku app: `heroku create`
3. Push to Heroku: `git push heroku main`

## Project Philosophy
See `memory.md` for engineering philosophy and testing strategy.
