exports.handler = async function(event, context) {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Fetch from Mullvad API
    const response = await fetch('https://am.i.mullvad.net/json');
    
    if (!response.ok) {
      throw new Error(`Mullvad API returned status ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('Mullvad API Error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to fetch from Mullvad API',
        message: error.message 
      })
    };
  }
};
```

## Step 2: Deploy to Netlify

1. Add this file to your repository
2. Push to your repository
3. Netlify will automatically deploy the function

## Step 3: Test the Function

Once deployed, test it directly:
```
https://dnsleak.netlify.app/.netlify/functions/mullvad-check
