# V1 Content API - Postman Collection

This directory contains the Postman collection for testing the V1 Content API endpoints.

## Files

- `v1-content.postman_collection.json` - Complete Postman collection with all test cases
- Individual route files:
  - `create-idea.route.js` - POST `/v1/content/:id/create-idea`
  - `post-content.route.js` - POST `/v1/content/:id/post-content`
  - `content-image.route.js` - POST `/v1/content/:id/content-image`
- `utils.js` - Shared utilities for IP validation and template rendering
- `v1-content.route.js` - Main route coordinator

## Importing the Postman Collection

1. Open Postman
2. Click "Import" in the top left
3. Select "Upload Files" 
4. Choose `v1-content.postman_collection.json`
5. Click "Import"

## Setting Up Environment Variables

The collection uses two environment variables that you need to configure:

### Required Variables:
- `BASE_URL` - Your API server URL (default: `http://localhost:3000`)
- `API_KEY` - Your API authentication key

### To set up variables:
1. In Postman, click the gear icon (⚙️) in the top right
2. Select "Manage Environments"
3. Click "Add" to create a new environment
4. Add the variables:
   ```
   BASE_URL: http://localhost:3001  (or your server URL)
   API_KEY: your-actual-api-key-here
   ```
5. Save the environment
6. Select it from the environment dropdown

## Test Cases Included

### 1. Create Idea Endpoints
- **Create Idea - Peck Strut**: Full request with all optional parameters
- **Create Idea - Minimal Request**: Empty body to test defaults
- **Dad Burbs - Create Idea**: Test with different IP to verify template loading

### 2. Post Content Endpoints
- **Post Content - Peck Strut**: Complete social media content generation
- **Post Content - Missing Prompt**: Validation test (should return 400)

### 3. Content Image Endpoints
- **Content Image - Peck Strut**: Full image generation with all parameters
- **Content Image - Portrait Size**: Test different image sizes

### 4. Error Handling
- **Invalid IP - 404 Error**: Test with non-existent intellectual property

## Automated Tests

Each request includes automated tests that verify:

- ✅ Correct HTTP status codes
- ✅ Response structure validation
- ✅ Required fields presence
- ✅ Data type validation
- ✅ Error message content

## Running the Collection

### Individual Requests:
1. Select any request from the collection
2. Ensure your environment is selected
3. Click "Send"
4. View results in the "Test Results" tab

### Batch Testing:
1. Right-click on the "V1 Content API" collection
2. Select "Run collection"
3. Choose which requests to run
4. Click "Run V1 Content API"
5. View the test runner results

## Expected Responses

### Successful Create Idea Response:
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

### Successful Post Content Response:
```json
{
  "message": "🐔 Want happy chickens? Here are my top 3 tips...",
  "hashtags": ["#chickens", "#backyardchickens", "#farming"],
  "image_prompt": "Ultra-realistic photo of three heritage breed chickens (Rhode Island Red and Buff Orpington) foraging in lush green grass near a rustic wooden chicken coop. Golden hour lighting, shallow depth of field, 50mm lens, warm natural color grading, pastoral farm setting with soft shadows."
}
```

### Successful Content Image Response:
```json
{
  "originalUrl": "https://s3.../original.png",
  "thumbnailUrl": "https://s3.../thumbnail.png", 
  "folder": "v1-content-peck-strut-1234567890-abc123"
}
```

### Error Responses:
```json
{
  "error": "Intellectual property 'invalid-ip' not found"
}
```

## Troubleshooting

### Common Issues:

1. **401 Unauthorized**: Check your `API_KEY` environment variable
2. **404 Not Found**: Verify the `BASE_URL` and ensure server is running
3. **500 Server Error**: Check server logs for API key configuration issues

### Server Requirements:
- Server must be running (default port 3000 or 3001)
- Required environment variables on server:
  - `OPENAI_API_KEY` - For text generation
  - `IMAGE_API_KEY` - For image generation  
  - `S3_BUCKET` - For image storage
  - `API_KEY` - For request authentication

### IP Template Requirements:
Each intellectual property must have a folder in `/prompt-templates/` with:
- `create-idea.md`
- `post-content.md` 
- `create-image.md`

## Adding New Test Cases

To add tests for new intellectual properties:

1. Duplicate an existing request
2. Change the IP in the URL path (e.g., `peck-strut` → `your-new-ip`)
3. Update the request body as needed
4. Modify test assertions if required
5. Ensure the IP folder exists in `/prompt-templates/`

## Collection Maintenance

When adding new endpoints or modifying existing ones:

1. Update the corresponding request in the collection
2. Add appropriate test assertions
3. Update this README with new test cases
4. Export the updated collection to replace the JSON file
