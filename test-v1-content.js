// Test script for the new V1 content API endpoints (refactored into separate files)
import axios from 'axios';

const BASE_URL = 'http://localhost:3001';
const API_KEY = process.env.API_KEY;

const headers = {
  'Content-Type': 'application/json',
  ...(API_KEY && { 'Authorization': `Bearer ${API_KEY}` })
};

async function testV1ContentAPIs() {
  console.log('Testing V1 Content APIs (refactored routes)...\n');

  // Test 1: Test with existing IP (peck-strut) - create-idea route
  console.log('1. Testing /v1/content/peck-strut/create-idea (separate route file)');
  try {
    const response = await axios.post(`${BASE_URL}/v1/content/peck-strut/create-idea`, {
      platform: 'Instagram',
      topic: 'chicken farming',
      count: 2,
      persona: 'A friendly chicken farmer',
      sentiment: 'Enthusiastic and educational'
    }, { headers });
    console.log('✅ Success:', response.data);
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }

  // Test 2: Test post-content route (now includes image_prompt)
  console.log('\n2. Testing /v1/content/peck-strut/post-content (now with image_prompt)');
  try {
    const response = await axios.post(`${BASE_URL}/v1/content/peck-strut/post-content`, {
      prompt: 'Share tips about raising happy chickens',
      persona: 'A friendly chicken farmer',
      sentiment: 'Warm and helpful'
    }, { headers });
    console.log('✅ Success:', response.data);
    if (response.data.image_prompt) {
      console.log('✅ Image prompt generated:', response.data.image_prompt.substring(0, 100) + '...');
    }
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }

  // Test 3: Test with non-existent IP (should return 404)
  console.log('\n3. Testing /v1/content/non-existent-ip/create-idea (should return 404)');
  try {
    const response = await axios.post(`${BASE_URL}/v1/content/non-existent-ip/create-idea`, {
      platform: 'Instagram',
      topic: 'test',
      count: 1
    }, { headers });
    console.log('❌ Unexpected success:', response.data);
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('✅ Expected 404 error:', error.response.data);
    } else {
      console.log('❌ Unexpected error:', error.response?.data || error.message);
    }
  }

  console.log('\nV1 Content API tests completed! All routes are now in separate files.');
}

// Run the tests
testV1ContentAPIs().catch(console.error);
