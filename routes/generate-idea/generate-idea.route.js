// Route handler for /generate-idea
// JSDoc included per project standards
import fs from "fs";
import path from "path";
import Handlebars from "handlebars";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATE_PATH = path.join(__dirname, "./prompt-template.md");

/**
 * Registers the /generate-idea route on the provided Fastify instance.
 * @param {import('fastify').FastifyInstance} server - The Fastify server instance.
 */
export function registerGenerateIdeaRoute(server) {
  console.info("[registerGenerateIdeaRoute] Registering /generate-idea route");

  function loadTemplate() {
    console.info("[generate-idea] Loading and compiling prompt template");
    const templateContent = fs.readFileSync(TEMPLATE_PATH, "utf8");
    return Handlebars.compile(templateContent);
  }

  let compiledTemplate = loadTemplate();
  fs.watchFile(TEMPLATE_PATH, () => {
    console.info(
      "[generate-idea] Detected change in prompt-template.md, reloading template"
    );
    compiledTemplate = loadTemplate();
  });

  server.post("/generate-idea", {
    schema: {
      summary:
        "Generate social media post ideas using LLM and trending topics research",
      description:
        "Returns a list of creative, trending social media post ideas based on current trends and user input.",
      tags: ["Content", "Ideas"],
      body: {
        type: "object",
        properties: {
          platform: {
            type: "string",
            description: "Social media platform (e.g. Twitter, Instagram)",
          },
          topic: {
            type: "string",
            description: "Optional focus topic for ideas",
          },
          count: {
            type: "integer",
            description: "How many ideas to generate",
            default: 5,
          },
          persona: {
            type: "string",
            description: "Persona for the strategist",
          },
          sentiment: { type: "string", description: "Desired sentiment/tone" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            ideas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  headline: { type: "string" },
                  description: { type: "string" },
                },
              },
              description: "List of post ideas",
            },
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
      let { platform, topic, count, persona, sentiment } = request.body || {};
      if (!platform) platform = "Instagram";
      if (!topic) topic = "general interest";
      if (!count) count = 5;
      if (!persona)
        persona =
          process.env.DEFAULT_PERSONA || "A creative social media strategist";
      if (!sentiment)
        sentiment = process.env.DEFAULT_SENTIMENT || "Upbeat and engaging";
      const current_date = new Date().toISOString().split("T")[0];

      const prompt = compiledTemplate({
        platform,
        topic,
        count,
        persona,
        sentiment,
        current_date,
      });
      console.info("[POST /generate-idea] Compiled prompt for LLM", {
        platform,
        topic,
        count,
        persona,
        sentiment,
      });

      const apiKey = process.env.OPENAI_API_KEY;
      const baseURL = process.env.OPENAI_API_BASE_URL;
      const model =
        process.env.GENERATE_IDEA_MODEL ||
        "deepseek/deepseek-chat-v3-0324:free";
      if (!apiKey) {
        console.warn(
          "[POST /generate-idea] OPENAI_API_KEY not set in environment"
        );
        return reply
          .code(500)
          .send({ error: "OPENAI_API_KEY not set in environment." });
      }
      try {
        const { OpenAI } = await import("openai");
        const openai = new OpenAI({ apiKey, baseURL });
        const completion = await openai.chat.completions.create({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        });

        console.info(
          "[POST /generate-idea] OpenAI response metadata",
          completion
        );

        const content = completion.choices?.[0]?.message?.content || "";

        let ideas = [];
        try {
          ideas = JSON.parse(content);
          // If it's not an array, wrap it
          if (!Array.isArray(ideas)) {
            ideas = [ideas];
          }
        } catch (e) {
          console.warn("[POST /generate-idea] Failed to parse ideas JSON", {
            error: e.message,
          });

          // Try to extract a ```json ... ``` block
          const match = content.match(/```json([\s\S]*?)```/i);
          if (match && match[1]) {
            try {
              ideas = JSON.parse(match[1].trim());
              if (!Array.isArray(ideas)) {
                ideas = [ideas];
              }
              return reply.send({ ideas });
            } catch (jsonBlockErr) {
              console.warn("[POST /generate-idea] Failed to parse extracted JSON block", {
                error: jsonBlockErr.message,
              });
            }
          }

          // Fallback: return the raw string as a headline
          return reply.send({ ideas: [{ headline: content }] });
        }
        return reply.send({ ideas });
      } catch (err) {
        console.warn("[POST /generate-idea] Error contacting OpenAI", {
          error: err.message,
        });
        return reply
          .code(500)
          .send({ error: "Failed to contact OpenAI", details: err.message });
      }
    },
  });
}
