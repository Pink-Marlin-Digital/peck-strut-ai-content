# /create-content Route

## Description
Accepts `prompt`, `persona`, and `sentiment` in the request body and returns a formatted prompt using a markdown template (`prompt-template.md`).

## Endpoint
```
POST /create-content
```

### Request Body
| Field     | Type   | Required | Description                |
|-----------|--------|----------|----------------------------|
| prompt    | string | Yes      | The prompt to format       |
| persona   | string | Yes      | The persona for the prompt |
| sentiment | string | Yes      | The sentiment to use       |

### Response
```
{
  "formattedPrompt": "..."
}
```

### Errors
- 400 if any field is missing

## Template
- Uses `prompt-template.md` at the project root.

## Test
See `create-content.test.js` in this folder for usage and coverage.
