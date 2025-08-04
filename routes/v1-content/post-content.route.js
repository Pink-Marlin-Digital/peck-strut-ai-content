// Route handler for /v1/content/:id/post-content
// JSDoc included per project standards
import { OpenAI } from "openai";
import { checkIpExists, renderPromptFromTemplate } from "./utils.js";

/**
 * Registers the /v1/content/:id/post-content route on the provided Fastify instance.
 * @param {import('fastify').FastifyInstance} server - The Fastify server instance.
 */
export function registerV1PostContentRoute(server) {
  console.info("[registerV1PostContentRoute] Registering /v1/content/:id/post-content route");

  server.post("/v1/content/:id/post-content", {
    schema: {
      summary: "Create formatted social media content for specific intellectual property",
      description: "Accepts prompt, persona, and sentiment, returns formatted content and hashtags using IP-specific templates.",
      tags: ["V1 Content"],
      params: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "Intellectual property identifier"
          }
        },
        required: ["id"]
      },
      body: {
        type: "object",
        required: ["prompt"],
        properties: {
          prompt: {
            type: "string",
            description: "Prompt for content generation",
          },
          persona: { 
            type: "string", 
            description: "Persona for the content" 
          },
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
            image_prompt: {
              type: "string",
              description: "Generated system prompt for image creation based on the post text"
            },
          },
        },
        400: {
          type: "object",
          properties: {
            error: { type: "string" },
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
        console.warn(`[POST /v1/content/${id}/post-content] IP not found`, { id });
        return reply.code(404).send({ error: `Intellectual property '${id}' not found` });
      }

      let { prompt, persona, sentiment } = request.body;
      console.info(`[POST /v1/content/${id}/post-content] Received request`, {
        id,
        prompt,
        persona,
        sentiment,
      });

      if (!persona) {
        persona = process.env.DEFAULT_PERSONA || "A budding chicken farmer who is excited to leave their suburban life to start a farm";
      }
      if (!sentiment) {
        sentiment = process.env.DEFAULT_SENTIMENT || "Cheerful, warm and inviting";
      }

      // Validate required fields
      if (!prompt) {
        console.warn(`[POST /v1/content/${id}/post-content] Missing required field: prompt`, request.body);
        return reply.code(400).send({
          error: "Missing required field: prompt",
          received: request.body
        });
      }

      try {
        const formattedPrompt = renderPromptFromTemplate(id, "post-content.md", { 
          prompt, 
          persona, 
          sentiment 
        });
        console.info(`[POST /v1/content/${id}/post-content] Formatted prompt generated`);

        const apiKey = process.env.OPENAI_API_KEY;
        const baseURL = process.env.OPENAI_API_BASE_URL;
        const model = process.env.OPENAI_MODEL_NAME || "gpt-3.5-turbo";
        
        if (!apiKey) {
          console.warn(`[POST /v1/content/${id}/post-content] OPENAI_API_KEY not set in environment`);
          return reply.code(500).send({ error: "OPENAI_API_KEY not set in environment." });
        }

        console.info(`[POST /v1/content/${id}/post-content] Sending prompt to OpenAI`, {
          model,
          baseURL,
        });
        
        const openai = new OpenAI({ apiKey, baseURL });
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
        console.info(`[POST /v1/content/${id}/post-content] OpenAI response metadata`, meta);
        const message = completion.choices?.[0]?.message?.content || "";

        // Second LLM call for hashtags
        const hashtagPrompt = `Given the following social media post content, generate a JSON array of 5-10 relevant and popular hashtags. Only return the array, no explanation.\n\nContent:\n${message}`;
        console.info(`[POST /v1/content/${id}/post-content] Sending second LLM call for hashtags`);
        
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
        console.info(`[POST /v1/content/${id}/post-content] OpenAI hashtag response metadata`, hashtagMeta);
        
        let hashtags = [];
        try {
          hashtags = JSON.parse(hashtagCompletion.choices?.[0]?.message?.content || "[]");
        } catch (e) {
          console.warn(`[POST /v1/content/${id}/post-content] Failed to parse hashtags JSON`, {
            error: e.message,
          });
        }

        // Third LLM call for image prompt using IP-specific template
        const imagePromptTemplate = renderPromptFromTemplate(id, "post-image.md", { 
          postText: message 
        });
        console.info(`[POST /v1/content/${id}/post-content] Sending third LLM call for image prompt`);
        
        const imagePromptCompletion = await openai.chat.completions.create({
          model,
          messages: [{ role: "user", content: imagePromptTemplate }],
          temperature: 0.7,
        });

        const imagePromptMeta = {
          id: imagePromptCompletion.id,
          created: imagePromptCompletion.created,
          model: imagePromptCompletion.model,
          usage: imagePromptCompletion.usage,
          choices: imagePromptCompletion.choices?.length,
        };
        console.info(`[POST /v1/content/${id}/post-content] OpenAI image prompt response metadata`, imagePromptMeta);
        const image_prompt = imagePromptCompletion.choices?.[0]?.message?.content || "";

        return reply.send({ message, hashtags, image_prompt });
      } catch (err) {
        console.warn(`[POST /v1/content/${id}/post-content] Error`, {
          error: err.message,
        });
        return reply.code(500).send({ 
          error: "Failed to create content", 
          details: err.message 
        });
      }
    },
  });
}
