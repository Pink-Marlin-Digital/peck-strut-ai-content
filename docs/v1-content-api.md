# V1 Content API Documentation

The V1 Content API provides intellectual property-specific content generation endpoints. These APIs use customizable prompt templates stored in the `/prompt-templates/:id/` directory structure.

## Base URL Structure

```
POST /v1/content/:id/{endpoint}
```

Where `:id` is the intellectual property identifier (e.g., "peck-strut").

## Available Endpoints

### 1. Create Ideas
**Endpoint:** `POST /v1/content/:id/create-idea`

Generates creative social media post ideas using IP-specific templates.

**Request Body:**
```json
{
  "platform": "Instagram",           // Optional: Social media platform
  "topic": "chicken farming",        // Optional: Focus topic
  "count": 5,                       // Optional: Number of ideas (default: 5)
  "persona": "A friendly farmer",    // Optional: Content persona
  "sentiment": "Upbeat and engaging" // Optional: Desired tone
}
```

**Response:**
```json
{
  "ideas": [
    {
      "headline": "5 Signs Your Chickens Are Happy",
      "description": "Share visual cues that indicate healthy, content chickens"
    }
  ]
}
```

### 2. Create Post Content
**Endpoint:** `POST /v1/content/:id/post-content`

Creates formatted social media content with hashtags using IP-specific templates.

**Request Body:**
```json
{
  "prompt": "Share tips about raising happy chickens", // Required
  "persona": "A friendly chicken farmer",              // Optional
  "sentiment": "Warm and helpful"                      // Optional
}
```

**Response:**
```json
{
  "message": "🐔 Want happy chickens? Here are my top 3 tips...",
  "hashtags": ["#chickens", "#backyardchickens", "#farming"]
}
```

### 3. Create Content Image
**Endpoint:** `POST /v1/content/:id/content-image`

Generates images using IP-specific templates and uploads to S3.

**Request Body:**
```json
{
  "message": "Happy chickens in a sunny farmyard",     // Required
  "size": "square",                                    // Optional: square|portrait|landscape
  "subject": "chickens",                               // Optional
  "style": "cartoon",                                  // Optional
  "lighting": "natural lighting",                      // Optional
  "mood": "cheerful",                                  // Optional
  "resolution": "high resolution"                      // Optional
}
```

**Response:**
```json
{
  "originalUrl": "https://s3.../original.png",
  "thumbnailUrl": "https://s3.../thumbnail.png",
  "folder": "v1-content-peck-strut-1234567890-abc123"
}
```

## Error Responses

### 404 - IP Not Found
When the intellectual property folder doesn't exist:
```json
{
  "error": "Intellectual property 'invalid-ip' not found"
}
```

### 400 - Bad Request
When required fields are missing:
```json
{
  "error": "Missing required field: prompt"
}
```

### 500 - Server Error
When API keys are missing or LLM calls fail:
```json
{
  "error": "Failed to generate content",
  "details": "OPENAI_API_KEY not set in environment."
}
```

## Setting Up New Intellectual Properties

To add support for a new intellectual property:

1. Create a folder in `/prompt-templates/` with the IP name:
   ```
   /prompt-templates/my-new-ip/
   ```

2. Add the required template files:
   ```
   /prompt-templates/my-new-ip/create-idea.md
   /prompt-templates/my-new-ip/post-content.md
   /prompt-templates/my-new-ip/create-image.md
   ```

3. Use Handlebars syntax for dynamic content:
   ```markdown
   You are {{persona}}.
   Create content about {{topic}} with {{sentiment}} tone.
   ```

## Template Variables

### create-idea.md
- `{{persona}}` - Content creator persona
- `{{platform}}` - Social media platform
- `{{topic}}` - Content topic
- `{{sentiment}}` - Desired tone/sentiment
- `{{count}}` - Number of ideas to generate
- `{{current_date}}` - Current date

### post-content.md
- `{{prompt}}` - User's content prompt
- `{{persona}}` - Content creator persona
- `{{sentiment}}` - Desired tone/sentiment

### create-image.md
- `{{subject}}` - Image subject
- `{{style}}` - Visual style
- `{{lighting}}` - Lighting description
- `{{mood}}` - Image mood
- `{{resolution}}` - Image resolution

## Authentication

All endpoints require API key authentication via the `Authorization` header:
```
Authorization: Bearer YOUR_API_KEY
```

## Example Usage

```bash
# Test create-idea endpoint
curl -X POST http://localhost:3000/v1/content/peck-strut/create-idea \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "platform": "Instagram",
    "topic": "chicken care",
    "count": 3
  }'

# Test post-content endpoint
curl -X POST http://localhost:3000/v1/content/peck-strut/post-content \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "prompt": "Share chicken feeding tips"
  }'
```

## Swagger Documentation

Visit `/docs` when the server is running to see interactive API documentation with all endpoints and schemas.
