import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Fastify from 'fastify';
import { registerPostInstagramRoute } from './post-instagram.route.js';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// Mock fs
vi.mock('fs');
const mockedFs = vi.mocked(fs);

// Mock sharp
vi.mock('sharp', () => ({
  default: vi.fn(() => ({
    resize: vi.fn().mockReturnThis(),
    jpeg: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('fake-image-data'))
  }))
}));

describe('/post-instagram', () => {
  let server;

  beforeEach(async () => {
    server = Fastify();
    registerPostInstagramRoute(server);
    
    // Mock environment variables
    process.env.INSTAGRAM_ACCESS_TOKEN = 'test-access-token';
    process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID = 'test-business-account-id';
    
    // Mock file system operations
    mockedFs.existsSync.mockReturnValue(false);
    mockedFs.mkdirSync.mockReturnValue(undefined);
    mockedFs.writeFileSync.mockReturnValue(undefined);
    mockedFs.unlinkSync.mockReturnValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 for missing required fields', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/post-instagram',
      headers: {
        'content-type': 'application/json'
      },
      payload: {
        description: 'Test description'
        // Missing imageUrl
      }
    });

    expect(response.statusCode).toBe(400);
  });

  it('should return 500 when Instagram credentials are missing', async () => {
    // Remove environment variables
    delete process.env.INSTAGRAM_ACCESS_TOKEN;
    delete process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

    const response = await server.inject({
      method: 'POST',
      url: '/post-instagram',
      headers: {
        'content-type': 'application/json'
      },
      payload: {
        description: 'Test description',
        imageUrl: 'https://example.com/image.jpg'
      }
    });

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.payload)).toEqual({
      success: false,
      error: 'Instagram credentials not configured',
      details: expect.stringContaining('INSTAGRAM_ACCESS_TOKEN')
    });
  });

  it('should handle image download errors', async () => {
    mockedAxios.get.mockRejectedValue(new Error('Network error'));

    const response = await server.inject({
      method: 'POST',
      url: '/post-instagram',
      headers: {
        'content-type': 'application/json'
      },
      payload: {
        description: 'Test description',
        imageUrl: 'https://example.com/image.jpg'
      }
    });

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.payload)).toEqual({
      success: false,
      error: 'Failed to post to Instagram',
      details: expect.stringContaining('Failed to download image')
    });
  });

  it('should handle Instagram API errors', async () => {
    // Mock successful image download
    mockedAxios.get.mockResolvedValue({
      data: Buffer.from('fake-image-data'),
      status: 200
    });

    // Mock Instagram API error
    mockedAxios.post.mockRejectedValue(new Error('Instagram API error'));

    const response = await server.inject({
      method: 'POST',
      url: '/post-instagram',
      headers: {
        'content-type': 'application/json'
      },
      payload: {
        description: 'Test description',
        imageUrl: 'https://example.com/image.jpg'
      }
    });

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.payload)).toEqual({
      success: false,
      error: 'Failed to post to Instagram',
      details: expect.stringContaining('Instagram API error')
    });
  });

  it('should successfully post to Instagram', async () => {
    // Mock successful image download
    mockedAxios.get.mockResolvedValue({
      data: Buffer.from('fake-image-data'),
      status: 200
    });

    // Mock successful Instagram API calls
    mockedAxios.post
      .mockResolvedValueOnce({ data: { id: 'media-container-id' } }) // Create media container
      .mockResolvedValueOnce({ data: { status_code: 'FINISHED' } }) // Media status check
      .mockResolvedValueOnce({ data: { id: 'post-id' } }); // Publish post

    const response = await server.inject({
      method: 'POST',
      url: '/post-instagram',
      headers: {
        'content-type': 'application/json'
      },
      payload: {
        description: 'Test description with #hashtag',
        imageUrl: 'https://example.com/image.jpg'
      }
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.payload)).toEqual({
      success: true,
      message: 'Post published successfully',
      postId: 'post-id',
      permalink: 'https://www.instagram.com/p/post-id/'
    });
  });

  it('should validate description length', async () => {
    const longDescription = 'a'.repeat(2201); // Exceeds Instagram's 2200 character limit

    const response = await server.inject({
      method: 'POST',
      url: '/post-instagram',
      headers: {
        'content-type': 'application/json'
      },
      payload: {
        description: longDescription,
        imageUrl: 'https://example.com/image.jpg'
      }
    });

    expect(response.statusCode).toBe(400);
  });
}); 