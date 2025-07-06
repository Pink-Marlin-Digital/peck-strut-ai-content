// Route handler for /create-content
// JSDoc included per project standards
import fs from "fs";
import path from "path";
import Handlebars from "handlebars";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATE_PATH = path.join(__dirname, "./prompt-template.md");

/**
 * Registers the /create-content route on the provided Fastify instance.
 * @param {import('fastify').FastifyInstance} server - The Fastify server instance.
 */
export function registerCreateContentRoute(server) {
  console.info(
    "[registerCreateContentRoute] Registering /create-content route"
  );
  function loadTemplate() {
    console.info("[loadTemplate] Loading and compiling prompt template");
    const templateContent = fs.readFileSync(TEMPLATE_PATH, "utf8");
    return Handlebars.compile(templateContent);
  }

  let compiledTemplate = loadTemplate();

  fs.watchFile(TEMPLATE_PATH, () => {
    console.info(
      "[registerCreateContentRoute] Detected change in prompt-template.md, reloading template"
    );
    compiledTemplate = loadTemplate();
  });

  server.post("/create-content", {
    schema: {
      summary: "Create formatted prompt and hashtags using LLM",
      description:
        "Accepts prompt, persona, and sentiment, returns formatted content and related hashtags using LLM.",
      tags: ["Content"],
      body: {
        type: "object",
        required: ["prompt"],
        properties: {
          prompt: {
            type: "string",
            description: "Prompt for content generation",
          },
          persona: { type: "string", description: "Persona for the content" },
          sentiment: {
            type: "string",
            description: "Sentiment for the content",
          },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "Generated content for social media post",
            },
            hashtags: {
              type: "array",
              items: { type: "string" },
              description: "Relevant hashtags for the content",
            },
          },
        },
        400: {
          type: "object",
          properties: {
            error: { type: "string" },
          },
        },
        500: {
          type: "object",
          properties: {
            error: { type: "string" },
            details: { type: "string" },
          },
        },
      },
    },
    handler: async (request, reply) => {
      let { prompt, persona, sentiment } = request.body;
      console.info("[POST /create-content] Received request", {
        prompt,
        persona,
        sentiment,
      });
      if (!persona) {
        persona =
          process.env.DEFAULT_PERSONA ||
          "A budding chicken farmer who is excited to leave their suburban life to start a farm";
      }
      if (!sentiment) {
        sentiment =
          process.env.DEFAULT_SENTIMENT || "Cheerful, warm and inviting";
      }
      // Validate required fields
      if (!prompt) {
        console.warn("[POST /create-content] Missing required field: prompt", request.body);
        return reply.code(400).send({
          error: "Missing required field: prompt",
          received: request.body
        });
      }
      const formattedPrompt = compiledTemplate({ prompt, persona, sentiment });
      console.info("[POST /create-content] Formatted prompt generated");

      // Use openai npm package for LLM call
      const apiKey = process.env.OPENAI_API_KEY;
      const baseURL = process.env.OPENAI_API_BASE_URL;
      const model = process.env.OPENAI_MODEL_NAME || "gpt-3.5-turbo";
      if (!apiKey) {
        console.warn(
          "[POST /create-content] OPENAI_API_KEY not set in environment"
        );
        return reply
          .code(500)
          .send({ error: "OPENAI_API_KEY not set in environment." });
      }
      try {
        console.info("[POST /create-content] Sending prompt to OpenAI", {
          model,
          baseURL,
        });
        const { OpenAI } = await import("openai");
        const openai = new OpenAI({
          apiKey,
          baseURL,
        });
        const completion = await openai.chat.completions.create({
          model,
          messages: [{ role: "user", content: formattedPrompt }],
          temperature: 0.7,
        });
        const meta = {
          id: completion.id,
          created: completion.created,
          model: completion.model,
          usage: completion.usage,
          choices: completion.choices?.length,
        };
        console.info("[POST /create-content] OpenAI response metadata", meta);
        const message = completion.choices?.[0]?.message?.content || "";

        // Second LLM call for hashtags
        const hashtagPrompt = `Given the following social media post content, generate a JSON array of 5-10 relevant and popular hashtags. Only return the array, no explanation.\n\nContent:\n${message}`;
        console.info(
          "[POST /create-content] Sending second LLM call for hashtags"
        );
        const hashtagCompletion = await openai.chat.completions.create({
          model,
          messages: [{ role: "user", content: hashtagPrompt }],
          temperature: 0.7,
        });
        const hashtagMeta = {
          id: hashtagCompletion.id,
          created: hashtagCompletion.created,
          model: hashtagCompletion.model,
          usage: hashtagCompletion.usage,
          choices: hashtagCompletion.choices?.length,
        };
        console.info(
          "[POST /create-content] OpenAI hashtag response metadata",
          hashtagMeta
        );
        let hashtags = [];
        try {
          hashtags = JSON.parse(
            hashtagCompletion.choices?.[0]?.message?.content || "[]"
          );
        } catch (e) {
          console.warn("[POST /create-content] Failed to parse hashtags JSON", {
            error: e.message,
          });
        }
        return reply.send({ message, hashtags });
      } catch (err) {
        console.warn("[POST /create-content] Error contacting OpenAI", {
          error: err.message,
        });
        return reply
          .code(500)
          .send({ error: "Failed to contact OpenAI", details: err.message });
      }
    },
  });
}
