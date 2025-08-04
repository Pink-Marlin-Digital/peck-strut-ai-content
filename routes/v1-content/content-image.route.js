// Route handler for /v1/content/:id/content-image
// JSDoc included per project standards
import { OpenAI } from "openai";
import axios from "axios";
import sharp from "sharp";
import { uploadToS3 } from "../../services/s3.service.js";
import crypto from "crypto";
import { checkIpExists, renderPromptFromTemplate } from "./utils.js";

/**
 * Registers the /v1/content/:id/content-image route on the provided Fastify instance.
 * @param {import('fastify').FastifyInstance} server - The Fastify server instance.
 */
export function registerV1ContentImageRoute(server) {
  console.info("[registerV1ContentImageRoute] Registering /v1/content/:id/content-image route");

  server.post("/v1/content/:id/content-image", {
    schema: {
      summary: "Generate an image for specific intellectual property",
      description: "Accepts a message and returns an image generated using IP-specific templates.",
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
        required: ["message"],
        properties: {
          message: {
            type: "string",
            description: "Prompt to generate image from",
          },
          size: {
            type: "string",
            description: "Image aspect ratio: 'square' (1024x1024), 'portrait' (1024x1792), or 'landscape' (1792x1024)",
            enum: ["square", "portrait", "landscape"],
            default: "square",
          },
          subject: {
            type: "string",
            description: "Subject of the image",
          },
          style: {
            type: "string",
            description: "Style of the image",
          },
          lighting: {
            type: "string",
            description: "Lighting for the image",
          },
          mood: {
            type: "string",
            description: "Mood of the image",
          },
          resolution: {
            type: "string",
            description: "Resolution of the image",
          },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            originalUrl: {
              type: "string",
              description: "URL of the original image",
            },
            thumbnailUrl: {
              type: "string",
              description: "URL of the thumbnail image",
            },
            folder: {
              type: "string",
              description: "Folder name for the generated image",
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
        console.warn(`[POST /v1/content/${id}/content-image] IP not found`, { id });
        return reply.code(404).send({ error: `Intellectual property '${id}' not found` });
      }

      const { message, size = "square", subject, style, lighting, mood, resolution } = request.body;
      console.info(`[POST /v1/content/${id}/content-image] Received request`, { 
        id, 
        message, 
        size, 
        subject, 
        style, 
        lighting, 
        mood, 
        resolution 
      });

      if (!message) {
        console.warn(`[POST /v1/content/${id}/content-image] Missing required field: message`, { message });
        return reply.code(400).send({ error: "Missing required field: message" });
      }

      try {
        // Use message as subject if subject not provided
        const promptValues = {
          subject: subject || message,
          style: style || "Fun cartoonish",
          lighting: lighting || "natural lighting",
          mood: mood || "warm and inviting",
          resolution: resolution || "high resolution"
        };

        const prompt = renderPromptFromTemplate(id, "create-image.md", promptValues);

        const apiKey = process.env.IMAGE_API_KEY;
        const baseURL = process.env.IMAGE_API_BASE_URL;
        
        if (!apiKey) {
          console.warn(`[POST /v1/content/${id}/content-image] IMAGE_API_KEY not set in environment`);
          return reply.code(500).send({ error: "IMAGE_API_KEY not set in environment." });
        }

        // Map user-friendly size to OpenAI-supported size
        const sizeMap = {
          square: "1024x1024",
          portrait: "1024x1792",
          landscape: "1792x1024",
        };
        const openaiSize = sizeMap[size];
        if (!openaiSize) {
          console.warn(`[POST /v1/content/${id}/content-image] Invalid size parameter`, { size });
          return reply.code(400).send({
            error: "Invalid size. Supported: square, portrait, landscape.",
          });
        }

        console.info(`[POST /v1/content/${id}/content-image] Sending image generation request to OpenAI`, { 
          baseURL, 
          openaiSize 
        });
        
        const openai = new OpenAI({ apiKey });

        const response = await openai.images.generate({
          prompt,
          n: 1,
          size: openaiSize,
          quality: "hd",
          model: process.env.OPENAI_IMAGE_MODEL || "dall-e-3",
        });

        // Download the image from the URL returned by the LLM
        const url = response.data[0].url;
        const axiosResponse = await axios.get(url, {
          responseType: "arraybuffer",
        });
        const originalBuffer = Buffer.from(axiosResponse.data);

        // Generate a unique folder name for this request
        const folder = `v1-content-${id}-${Date.now()}-${crypto.randomBytes(8).toString("hex")}`;
        const s3Folder = `${folder}/`;
        const bucket = process.env.S3_BUCKET;

        // Save original image as original.png
        const originalKey = `${s3Folder}original.png`;
        const originalUrl = await uploadToS3({
          bucket,
          key: originalKey,
          body: originalBuffer,
          contentType: "image/png",
        });

        // Generate thumbnail using sharp
        const thumbnailBuffer = await sharp(originalBuffer)
          .resize(256, 256, { fit: "inside" })
          .png()
          .toBuffer();
        const thumbnailKey = `${s3Folder}thumbnail.png`;
        const thumbnailUrl = await uploadToS3({
          bucket,
          key: thumbnailKey,
          body: thumbnailBuffer,
          contentType: "image/png",
        });

        return reply.send({
          originalUrl,
          thumbnailUrl,
          folder,
        });
      } catch (err) {
        console.warn(`[POST /v1/content/${id}/content-image] Error`, {
          error: err.message,
        });
        return reply.code(500).send({ 
          error: "Failed to generate image", 
          details: err.message 
        });
      }
    },
  });
}
