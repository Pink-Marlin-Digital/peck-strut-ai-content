/**
 * Registers the GET /content-image/list route to list image URLs with pagination and total count.
 * Cursor-based pagination via ?cursor=...&limit=...
 * @param {import('fastify').FastifyInstance} server - The Fastify server instance.
 */
import {
  listImageFolders,
  listImagesInFolder,
} from "../../services/s3.service.js";

export function registerContentImageListRoute(server) {
  server.get("/content-image/list", {
    schema: {
      summary: "List image URLs in S3 bucket with pagination.",
      description:
        "Returns image URLs, supports cursor-based pagination, and includes total count.",
      tags: ["Content"],
      querystring: {
        type: "object",
        properties: {
          cursor: {
            type: "string",
            description: "Continuation token for pagination",
          },
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 1000,
            default: 20,
            description: "Max results per page",
          },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            images: { 
              type: "array", 
              items: { 
                type: "object",
                properties: {
                  originalUrl: { type: "string" },
                  thumbnailUrl: { type: "string" },
                  folder: { type: "string" },
                  },
              },
            },
            nextCursor: { type: ["string", "null"] },
            total: { type: "integer" },
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
      console.info("[GET /content-image/list] Request received");
      const hasS3Creds =
        process.env.AWS_ACCESS_KEY_ID &&
        process.env.AWS_SECRET_ACCESS_KEY &&
        process.env.AWS_REGION &&
        process.env.S3_BUCKET;
      if (!hasS3Creds) {
        return reply
          .code(500)
          .send({ error: "S3 credentials missing in environment." });
      }
      console.info("[GET /content-image/list] Validating credentials");
      const { cursor, limit = 20 } = request.query;
      try {
        const bucket = process.env.S3_BUCKET;
        // List folders (each folder = one image+thumbnail pair)
        const { folders, nextCursor, total } = await listImageFolders({
          bucket,
          limit,
          cursor,
        });
        const images = [];
        for (const folder of folders) {
          const files = await listImagesInFolder({ bucket, folder });
          const original = files.find((f) => f.key.endsWith("original.png"));
          const thumbnail = files.find((f) => f.key.endsWith("thumbnail.png"));
          if (original && thumbnail) {
            images.push({
              originalUrl: original.url,
              thumbnailUrl: thumbnail.url,
              folder: folder.replace(/\/$/, ""),
            });
          }
        }
        return reply.send({
          images,
          nextCursor,
          total,
        });
      } catch (err) {
        console.warn("[GET /content-image/list] Error listing S3 objects", {
          error: err.message,
        });
        return reply
          .code(500)
          .send({ error: "Failed to list S3 images", details: err.message });
      }
    },
  });
}
