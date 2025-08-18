import fetch from 'node-fetch';

async function testAIInspirationAPI() {
  try {
    console.log('Testing AI Inspiration API with general_default_hidden product...');
    
    // Test data using a real request ID that has answers to the product choice question
    // This request ID corresponds to a design request with general_default_hidden product
    // and has an answer to the "What product are you interested in?" question
    const testData = {
      questionId: '4bdf4d23-fa52-45df-b96c-5582dd4b442a', // AI-generated question that uses ##product_title##, ##product_subtitle##, ##description## placeholders
      requestId: '3445a140-9d9d-44f6-88ed-43441eea35c2' // Real request ID with general_default_hidden product
    };
    
    console.log('Test data:', testData);
    console.log('This request should have selected "Baby Stickers" as the product choice');
    console.log('The question uses placeholders: ##product_title##, ##product_subtitle##, ##description##');
    
    const response = await fetch('http://localhost:3000/api/ai-inspiration', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));
      
      if (data.success) {
        console.log('✅ API call successful!');
        console.log('Response text length:', data.response?.text?.length || 0);
        console.log('Response placeholders count:', data.response?.placeholders?.length || 0);
        
        // Check if the response contains product information
        if (data.response?.text) {
          const text = data.response.text.toLowerCase();
          if (text.includes('baby') || text.includes('sticker')) {
            console.log('✅ Response appears to contain product-specific content');
          } else {
            console.log('⚠️ Response may not contain product-specific content');
          }
        }
      } else {
        console.log('❌ API returned success: false');
        console.log('Error:', data.error);
      }
    } else {
      const errorText = await response.text();
      console.log('Error response:', errorText);
      
      try {
        const errorData = JSON.parse(errorText);
        console.log('Parsed error data:', JSON.stringify(errorData, null, 2));
      } catch (e) {
        console.log('Could not parse error response as JSON');
      }
    }
  } catch (error) {
    console.error('Error testing API:', error.message);
    console.error('Error stack:', error.stack);
  }
}

// Test the API
testAIInspirationAPI();
