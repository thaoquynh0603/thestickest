const fetch = require('node-fetch');

async function testCustomQuestionsAPI() {
  try {
    console.log('Testing custom-questions API...');
    
    const response = await fetch('http://localhost:3000/api/custom-questions?templateId=1', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('Error response:', errorText);
    }
  } catch (error) {
    console.error('Error testing API:', error.message);
  }
}

testCustomQuestionsAPI();
