// Route handler for /post-instagram
// JSDoc included per project standards
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Downloads an image from URL and saves it temporarily
 * @param {string} imageUrl - The URL of the image to download
 * @returns {Promise<string>} Path to the temporary image file
 */
async function downloadImage(imageUrl) {
  try {
    console.info("[post-instagram] Downloading image from URL:", imageUrl);
    
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 30000, // 30 second timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PeckStrutAI/1.0)'
      }
    });

    // Create temporary file path
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const tempFilePath = path.join(tempDir, `instagram_${Date.now()}.jpg`);
    
    // Process image with sharp to ensure it meets Instagram requirements
    const processedImageBuffer = await sharp(response.data)
      .resize(1080, 1080, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .jpeg({ quality: 90 })
      .toBuffer();
    
    fs.writeFileSync(tempFilePath, processedImageBuffer);
    console.info("[post-instagram] Image downloaded and processed:", tempFilePath);
    
    return tempFilePath;
  } catch (error) {
    console.error("[post-instagram] Error downloading image:", error.message);
    throw new Error(`Failed to download image: ${error.message}`);
  }
}

/**
 * Uploads image to Facebook/Instagram and returns the media container ID
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<string>} Media container ID
 */
async function uploadImageToInstagram(imagePath) {
  try {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const businessAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
    
    if (!accessToken || !businessAccountId) {
      throw new Error("Instagram credentials not configured");
    }

    console.info("[post-instagram] Uploading image to Instagram");
    
    // Step 1: Create media container
    const createMediaResponse = await axios.post(
      `https://graph.facebook.com/v18.0/${businessAccountId}/media`,
      {
        image_url: `file://${imagePath}`,
        caption: "Temporary caption", // Will be updated in next step
        access_token: accessToken
      }
    );

    const mediaContainerId = createMediaResponse.data.id;
    console.info("[post-instagram] Media container created:", mediaContainerId);

    // Step 2: Wait for media to be ready
    let mediaStatus = "IN_PROGRESS";
    let attempts = 0;
    const maxAttempts = 10;

    while (mediaStatus === "IN_PROGRESS" && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      
      const statusResponse = await axios.get(
        `https://graph.facebook.com/v18.0/${mediaContainerId}`,
        {
          params: {
            fields: 'status_code',
            access_token: accessToken
          }
        }
      );

      mediaStatus = statusResponse.data.status_code;
      attempts++;
      console.info(`[post-instagram] Media status (attempt ${attempts}):`, mediaStatus);
    }

    if (mediaStatus !== "FINISHED") {
      throw new Error(`Media processing failed with status: ${mediaStatus}`);
    }

    return mediaContainerId;
  } catch (error) {
    console.error("[post-instagram] Error uploading to Instagram:", error.message);
    throw new Error(`Failed to upload to Instagram: ${error.message}`);
  }
}

/**
 * Publishes the media container to Instagram
 * @param {string} mediaContainerId - The media container ID
 * @param {string} caption - The caption for the post
 * @returns {Promise<Object>} Post details including ID and permalink
 */
async function publishToInstagram(mediaContainerId, caption) {
  try {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const businessAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

    console.info("[post-instagram] Publishing to Instagram");

    // Update the media container with the final caption
    await axios.post(
      `https://graph.facebook.com/v18.0/${mediaContainerId}`,
      {
        caption: caption,
        access_token: accessToken
      }
    );

    // Publish the media container
    const publishResponse = await axios.post(
      `https://graph.facebook.com/v18.0/${businessAccountId}/media_publish`,
      {
        creation_id: mediaContainerId,
        access_token: accessToken
      }
    );

    const postId = publishResponse.data.id;
    const permalink = `https://www.instagram.com/p/${postId}/`;

    console.info("[post-instagram] Post published successfully:", { postId, permalink });

    return {
      postId,
      permalink
    };
  } catch (error) {
    console.error("[post-instagram] Error publishing to Instagram:", error.message);
    throw new Error(`Failed to publish to Instagram: ${error.message}`);
  }
}

/**
 * Registers the /post-instagram route on the provided Fastify instance.
 * @param {import('fastify').FastifyInstance} server - The Fastify server instance.
 */
export function registerPostInstagramRoute(server) {
  console.info("[registerPostInstagramRoute] Registering /post-instagram route");

  server.post("/post-instagram", {
    schema: {
      summary: "Post content to Instagram with image and description",
      description: "Publishes a post to Instagram using the provided description and image URL.",
      tags: ["Content", "Instagram"],
      body: {
        type: "object",
        required: ["description", "imageUrl"],
        properties: {
          description: {
            type: "string",
            description: "The caption/description for the Instagram post",
            minLength: 1,
            maxLength: 2200 // Instagram caption limit
          },
          imageUrl: {
            type: "string",
            description: "URL of the image to be posted to Instagram",
            format: "uri"
          }
        }
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" },
            postId: { type: "string" },
            permalink: { type: "string" }
          }
        },
        400: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            error: { type: "string" },
            details: { type: "string" }
          }
        },
        500: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            error: { type: "string" },
            details: { type: "string" }
          }
        }
      }
    },
    handler: async (request, reply) => {
      const { description, imageUrl } = request.body;

      console.info("[POST /post-instagram] Processing request", {
        descriptionLength: description.length,
        imageUrl: imageUrl
      });

      // Validate environment variables
      const requiredEnvVars = [
        'INSTAGRAM_ACCESS_TOKEN',
        'INSTAGRAM_BUSINESS_ACCOUNT_ID'
      ];

      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
      if (missingVars.length > 0) {
        console.warn("[POST /post-instagram] Missing environment variables:", missingVars);
        return reply.code(500).send({
          success: false,
          error: "Instagram credentials not configured",
          details: `Missing environment variables: ${missingVars.join(', ')}`
        });
      }

      let tempImagePath = null;
      let mediaContainerId = null;

      try {
        // Step 1: Download and process image
        tempImagePath = await downloadImage(imageUrl);

        // Step 2: Upload to Instagram
        mediaContainerId = await uploadImageToInstagram(tempImagePath);

        // Step 3: Publish to Instagram
        const postDetails = await publishToInstagram(mediaContainerId, description);

        return reply.send({
          success: true,
          message: "Post published successfully",
          ...postDetails
        });

      } catch (error) {
        console.error("[POST /post-instagram] Error:", error.message);
        return reply.code(500).send({
          success: false,
          error: "Failed to post to Instagram",
          details: error.message
        });
      } finally {
        // Clean up temporary file
        if (tempImagePath && fs.existsSync(tempImagePath)) {
          try {
            fs.unlinkSync(tempImagePath);
            console.info("[post-instagram] Temporary file cleaned up:", tempImagePath);
          } catch (cleanupError) {
            console.warn("[post-instagram] Failed to clean up temp file:", cleanupError.message);
          }
        }
      }
    }
  });
} 