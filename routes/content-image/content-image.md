# /content-image Route

## Description
Accepts a `message` in the request body and returns an image generated by the LLM (OpenAI DALL·E or similar).

## Endpoint
```
POST /content-image
```

### Request Body
| Field   | Type   | Required | Description                  |
|---------|--------|----------|------------------------------|
| message | string | Yes      | The prompt for the image     |

### Response
```
{
  "imageUrl": "https://..."
}
```

### Errors
- 400 if the message field is missing
- 500 if the LLM image generation fails

## Test
See `content-image.test.js` in this folder for usage and coverage.
