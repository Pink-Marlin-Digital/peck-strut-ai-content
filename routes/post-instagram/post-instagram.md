# Post Instagram Route Documentation

## Overview

The `/post-instagram` route is a POST endpoint that publishes content to Instagram using the provided description and image URL. The route handles authentication and posting through Instagram's API using credentials stored in environment variables.

## Endpoint

```
POST /post-instagram
```

## Purpose

This route serves as an Instagram posting service that:
- Publishes posts to Instagram with custom descriptions
- Handles image uploads from provided URLs
- Manages Instagram API authentication securely
- Provides status feedback for successful/failed posts

## API Specification

### Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `description` | string | Yes | The caption/description for the Instagram post |
| `imageUrl` | string | Yes | URL of the image to be posted to Instagram |

### Response Format

#### Success Response (200)

```json
{
  "success": true,
  "message": "Post published successfully",
  "postId": "instagram_post_id",
  "permalink": "https://www.instagram.com/p/..."
}
```

#### Error Response (400/500)

```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details"
}
```

## Usage Examples

### Basic Usage

```bash
curl -X POST http://localhost:3000/post-instagram \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Check out this amazing sunset! 🌅 #photography #nature",
    "imageUrl": "https://example.com/sunset-image.jpg"
  }'
```

### With Hashtags and Mentions

```bash
curl -X POST http://localhost:3000/post-instagram \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Amazing coffee art by @barista_pro! ☕️ #coffee #art #barista #latteart",
    "imageUrl": "https://example.com/coffee-art.jpg"
  }'
```

## Environment Variables

The route requires the following environment variables for Instagram API authentication:

### Required Variables

| Variable | Description | Where to Get It |
|----------|-------------|-----------------|
| `INSTAGRAM_ACCESS_TOKEN` | Long-lived Instagram Graph API access token | Facebook Developer Console |
| `INSTAGRAM_BUSINESS_ACCOUNT_ID` | Instagram Business Account ID | Facebook Developer Console or Instagram Graph API |

### Optional Variables

| Variable | Description | Where to Get It |
|----------|-------------|-----------------|
| `INSTAGRAM_APP_ID` | Facebook App ID (if using Facebook Graph API) | Facebook Developer Console |
| `INSTAGRAM_APP_SECRET` | Facebook App Secret (if using Facebook Graph API) | Facebook Developer Console |

### How to Obtain Environment Variables

#### Step 1: Create a Facebook App

1. Go to [Facebook Developer Console](https://developers.facebook.com/)
2. Click "Create App" and select "Business" as the app type
3. Fill in your app details and create the app
4. Note down your **App ID** and **App Secret** (you'll need these)

#### Step 2: Connect Instagram Business Account

1. In your Facebook App, go to "Add Product" and add "Instagram Basic Display" or "Instagram Graph API"
2. Navigate to "Instagram Basic Display" → "Basic Display" → "Instagram App ID"
3. Connect your Instagram Business Account to the app
4. You'll need to have an Instagram Business Account (not a personal account)

#### Step 3: Get Instagram Business Account ID

1. Go to [Facebook Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your app from the dropdown
3. Use this query to get your Instagram Business Account ID:
   ```
   GET /me/accounts
   ```
4. Look for the Instagram Business Account in the response and note the `id` field

#### Step 4: Generate Access Token

1. In Graph API Explorer, select your app and Instagram Business Account
2. Add the following permissions:
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_read_engagement`
3. Generate the access token
4. **Important**: Convert to a long-lived token (valid for 60 days) or use a page access token

#### Step 5: Configure Environment Variables

Add these to your `.env` file:

```bash
# Required
INSTAGRAM_ACCESS_TOKEN=your_long_lived_access_token_here
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_instagram_business_account_id_here

# Optional (if using Facebook Graph API)
INSTAGRAM_APP_ID=your_facebook_app_id_here
INSTAGRAM_APP_SECRET=your_facebook_app_secret_here
```

### Token Management

- **Access Token Expiry**: Long-lived tokens expire after 60 days
- **Token Refresh**: You'll need to refresh tokens periodically
- **Security**: Never commit tokens to version control
- **Permissions**: Ensure tokens have the required permissions listed below

### Required Permissions

Your Instagram Business Account needs these permissions:
- `instagram_basic`: Read basic account information
- `instagram_content_publish`: Publish content to Instagram
- `pages_read_engagement`: Read page engagement data

## Implementation Details

### Instagram API Integration

The route integrates with Instagram's Graph API to:
- Upload images from URLs to Instagram's servers
- Create posts with custom captions
- Handle authentication via access tokens
- Manage rate limits and API quotas

### Image Processing

- **URL Validation**: Validates that the provided image URL is accessible
- **Format Support**: Supports common image formats (JPEG, PNG, etc.)
- **Size Limits**: Handles Instagram's image size and format requirements
- **Download & Upload**: Downloads image from URL and uploads to Instagram

### Error Handling

The route includes comprehensive error handling for:
- Invalid or inaccessible image URLs
- Instagram API authentication failures
- Rate limiting and quota exceeded errors
- Network connectivity issues
- Invalid image formats or sizes

## Testing

A Postman collection is provided at `post-instagram.postman_collection.json` with example requests for testing the endpoint.

### Test Example

```javascript
// Example test request
const response = await fetch('/post-instagram', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    description: 'Test post from API! 📸 #test #api',
    imageUrl: 'https://picsum.photos/1080/1080'
  })
});

const data = await response.json();
console.log(data);
```

## Dependencies

- `fastify`: Web framework
- `axios`: HTTP client for image downloads and Instagram API calls
- `sharp`: Image processing library
- `fs`: File system operations for temporary image storage

## Security Considerations

- Instagram credentials are stored in environment variables
- Access tokens should have appropriate permissions (instagram_basic, instagram_content_publish)
- Input validation prevents malicious URL injection
- Temporary image files are cleaned up after upload
- Rate limiting should be implemented to prevent API abuse

## Performance Notes

- Image downloads may take time depending on URL and file size
- Instagram API has rate limits that should be respected
- Consider implementing image caching for repeated uploads
- Temporary file storage should be managed efficiently

## Troubleshooting

### Common Issues

1. **"Instagram credentials not configured"**
   - Check that all required environment variables are set
   - Verify token hasn't expired

2. **"Failed to download image"**
   - Ensure image URL is accessible
   - Check image format is supported (JPEG, PNG)

3. **"Media processing failed"**
   - Instagram may reject images that don't meet their requirements
   - Ensure image is appropriate content for Instagram

4. **"Rate limit exceeded"**
   - Instagram has strict rate limits
   - Implement delays between posts

### Debug Mode

Enable debug logging by setting:
```bash
DEBUG=post-instagram
```

## Related Files

- `post-instagram.route.js`: Main route implementation
- `post-instagram.postman_collection.json`: Postman test collection
- `post-instagram.test.js`: Unit tests 