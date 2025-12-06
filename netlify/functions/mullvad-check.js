exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
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

**Common issues that cause this error:**
1. Missing closing braces `}`
2. Missing semicolons `;`
3. Incomplete code copy/paste

**To fix:**
1. Delete the current `mullvad-check.js` file
2. Create a new file with the exact code above
3. Make sure ALL the code is there from the first line to the last closing brace
4. Push to GitHub

After pushing, wait about 1-2 minutes for Netlify to rebuild, then test again at:
```
https://dnsleak.netlify.app/.netlify/functions/mullvad-check
