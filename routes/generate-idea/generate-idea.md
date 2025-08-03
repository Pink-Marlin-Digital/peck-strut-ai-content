# Generate Idea Route Documentation

## Overview

The `/generate-idea` route is a POST endpoint that generates creative social media post ideas using AI/LLM technology. It leverages trending topics research and user-provided parameters to create engaging content suggestions for various social media platforms.

## Endpoint

```
POST /generate-idea
```

## Purpose

This route serves as an AI-powered content ideation tool that:
- Generates creative social media post ideas based on current trends
- Adapts content suggestions to specific platforms and topics
- Provides structured output with headlines and descriptions
- Supports customizable personas and sentiment preferences

## API Specification

### Request Body

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `platform` | string | No | "Instagram" | Social media platform (e.g., Twitter, Instagram, LinkedIn) |
| `topic` | string | No | "general interest" | Optional focus topic for idea generation |
| `count` | integer | No | 5 | Number of ideas to generate (1-10 recommended) |
| `persona` | string | No | Environment variable or default | Persona for the content strategist |
| `sentiment` | string | No | Environment variable or default | Desired tone/sentiment for the content |

### Response Format

#### Success Response (200)

```json
{
  "ideas": [
    {
      "headline": "Creative headline for the post",
      "description": "Brief description of the post idea"
    }
  ]
}
```

#### Error Response (500)

```json
{
  "error": "Error message",
  "details": "Additional error details"
}
```

## Usage Examples

### Basic Usage

```bash
curl -X POST http://localhost:3000/generate-idea \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "Instagram",
    "topic": "sustainable farming",
    "count": 5
  }'
```

### Advanced Usage

```bash
curl -X POST http://localhost:3000/generate-idea \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "LinkedIn",
    "topic": "remote work productivity",
    "count": 3,
    "persona": "Tech industry thought leader",
    "sentiment": "Professional and informative"
  }'
```

## Environment Variables

The route uses the following environment variables:

- `OPENAI_API_KEY`: Required API key for OpenAI/DeepSeek API access
- `OPENAI_API_BASE_URL`: Optional base URL for API calls
- `GENERATE_IDEA_MODEL`: AI model to use (default: "deepseek/deepseek-chat-v3-0324:free")
- `DEFAULT_PERSONA`: Default persona when not provided in request
- `DEFAULT_SENTIMENT`: Default sentiment when not provided in request

## Implementation Details

### Template System

The route uses a Handlebars template system located at `prompt-template.md` that:
- Supports dynamic parameter injection
- Watches for template changes and reloads automatically
- Provides structured prompts to the LLM

### AI Integration

- **Model**: Uses DeepSeek Chat model by default (configurable)
- **Temperature**: Set to 0.7 for balanced creativity and consistency
- **Response Parsing**: Handles both direct JSON and markdown code block responses
- **Fallback**: Returns raw content as headline if JSON parsing fails

### Error Handling

The route includes comprehensive error handling for:
- Missing API keys
- Network connectivity issues
- Invalid JSON responses from AI
- Template loading failures

## Testing

A Postman collection is provided at `generate-idea.postman_collection.json` with example requests for testing the endpoint.

### Test Example

```javascript
// Example test request
const response = await fetch('/generate-idea', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    platform: 'Instagram',
    topic: 'sustainable farming',
    count: 5,
    persona: 'Eco-conscious influencer',
    sentiment: 'Positive and inspiring'
  })
});

const data = await response.json();
console.log(data.ideas);
```

## Dependencies

- `fastify`: Web framework
- `handlebars`: Template engine
- `openai`: AI API client
- `fs`: File system operations
- `path`: Path utilities

## Security Considerations

- API keys are read from environment variables
- Input validation is handled by Fastify schema
- No sensitive data is logged in production
- Rate limiting should be implemented at the application level

## Performance Notes

- Template compilation is cached and reloaded on file changes
- AI API calls are the primary performance bottleneck
- Response parsing includes fallback mechanisms for reliability
- Consider implementing request caching for repeated queries

## Related Files

- `generate-idea.route.js`: Main route implementation
- `prompt-template.md`: Handlebars template for AI prompts
- `generate-idea.postman_collection.json`: Postman test collection 