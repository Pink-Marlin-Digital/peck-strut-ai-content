const Fastify = require('fastify');
const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

const server = Fastify();
const TEMPLATE_PATH = path.join(__dirname, 'prompt-template.md');

function loadTemplate() {
  const templateContent = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  return Handlebars.compile(templateContent);
}

let compiledTemplate = loadTemplate();

fs.watchFile(TEMPLATE_PATH, () => {
  compiledTemplate = loadTemplate();
});

server.post('/create-content', async (request, reply) => {
  const { prompt, persona, sentiment } = request.body;
  if (!prompt || !persona || !sentiment) {
    return reply.code(400).send({ error: 'Missing required fields: prompt, persona, sentiment' });
  }
  const formattedPrompt = compiledTemplate({ prompt, persona, sentiment });
  return { formattedPrompt };
});

const PORT = process.env.PORT || 3000;
server.listen({ port: PORT, host: '0.0.0.0' }, err => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening on port ${PORT}`);
});
