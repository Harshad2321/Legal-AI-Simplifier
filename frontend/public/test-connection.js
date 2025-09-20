console.log('=== FRONTEND TO BACKEND CONNECTION TEST ===');

// Test the exact configuration your app uses
const API_URL = 'https://legal-ai-backend-58fv.onrender.com';

console.log('Testing connection to:', API_URL);

// Test 1: Health check
fetch(`${API_URL}/health`)
  .then(response => response.json())
  .then(data => {
    console.log('✅ Health check SUCCESS:', data);
  })
  .catch(error => {
    console.error('❌ Health check FAILED:', error);
  });

// Test 2: CORS test
fetch(`${API_URL}/test-cors`)
  .then(response => response.json())
  .then(data => {
    console.log('✅ CORS test SUCCESS:', data);
  })
  .catch(error => {
    console.error('❌ CORS test FAILED:', error);
  });

// Test 3: Check environment variables
console.log('Environment check:', {
  NODE_ENV: 'production', // This is what it should be on GitHub Pages
  REACT_APP_API_BASE_URL: 'https://legal-ai-backend-58fv.onrender.com' // This is what it should be
});

console.log('=== END CONNECTION TEST ===');