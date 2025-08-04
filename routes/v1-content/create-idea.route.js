// Route handler for /v1/content/:id/create-idea
// JSDoc included per project standards
import { OpenAI } from "openai";
import { checkIpExists, renderPromptFromTemplate } from "./utils.js";

/**
 * Registers the /v1/content/:id/create-idea route on the provided Fastify instance.
 * @param {import('fastify').FastifyInstance} server - The Fastify server instance.
 */
export function registerV1CreateIdeaRoute(server) {
  console.info(
    "[registerV1CreateIdeaRoute] Registering /v1/content/:id/create-idea route"
  );

  server.post("/v1/content/:id/create-idea", {
    schema: {
      summary:
        "Generate social media post ideas for specific intellectual property",
      description:
        "Returns a list of creative, trending social media post ideas based on IP-specific templates.",
      tags: ["V1 Content", "Ideas"],
      params: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "Intellectual property identifier",
          },
        },
        required: ["id"],
      },
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
          sentiment: {
            type: "string",
            description: "Desired sentiment/tone",
          },
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
        404: {
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
      const { id } = request.params;

      // Check if IP exists
      if (!checkIpExists(id)) {
        console.warn(`[POST /v1/content/${id}/create-idea] IP not found`, {
          id,
        });
        return reply
          .code(404)
          .send({ error: `Intellectual property '${id}' not found` });
      }

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

      try {
        const prompt =
          renderPromptFromTemplate(id, "create-idea.md", {
            platform,
            topic,
            count,
            persona,
            sentiment,
            current_date,
          }) +
          `\n\nReturn the response as a JSON array with this structure:\n` +
          " ```[{\n" +
          '        "headline": "Compelling hook or title",\n' +
          '        "description": "Brief description of the content concept and execution"\n' +
          "    }]\n" +
          " ```";

        console.log("Prompt:", prompt);

        console.info(
          `[POST /v1/content/${id}/create-idea] Compiled prompt for LLM`,
          {
            id,
            platform,
            topic,
            count,
            persona,
            sentiment,
          }
        );

        const apiKey = process.env.OPENAI_API_KEY;
        const baseURL = process.env.OPENAI_API_BASE_URL;
        const model =
          process.env.GENERATE_IDEA_MODEL ||
          "deepseek/deepseek-chat-v3-0324:free";

        if (!apiKey) {
          console.warn(
            `[POST /v1/content/${id}/create-idea] OPENAI_API_KEY not set in environment`
          );
          return reply
            .code(500)
            .send({ error: "OPENAI_API_KEY not set in environment." });
        }

        const openai = new OpenAI({ apiKey, baseURL });
        const completion = await openai.chat.completions.create({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        });

        console.info(
          `[POST /v1/content/${id}/create-idea] OpenAI response metadata`,
          completion
        );

        const content = completion.choices?.[0]?.message?.content || "";
        console.debug("Content:", content);
        let ideas = [];
        try {
          ideas = JSON.parse(content);
          if (!Array.isArray(ideas)) {
            ideas = [ideas];
          }
        } catch (e) {
          console.warn(
            `[POST /v1/content/${id}/create-idea] Failed to parse ideas JSON`,
            {
              error: e.message,
            }
          );

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
              console.warn(
                `[POST /v1/content/${id}/create-idea] Failed to parse extracted JSON block... this is typical because the llm responds with a string and not a json object.`
              );
            }
          }

          // Fallback: return the raw string as a headline
          return reply.send({ ideas: [{ headline: content }] });
        }
        return reply.send({ ideas });
      } catch (err) {
        console.warn(`[POST /v1/content/${id}/create-idea] Error`, {
          error: err.message,
        });
        return reply.code(500).send({
          error: "Failed to generate ideas",
          details: err.message,
        });
      }
    },
  });
}
