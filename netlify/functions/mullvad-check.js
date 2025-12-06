exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Get the client's real IP address
    const clientIP = event.headers['x-forwarded-for'] || 
                     event.headers['x-real-ip'] || 
                     event.headers['client-ip'] ||
                     'unknown';
    
    console.log('Client IP:', clientIP);
    
    // Fetch from Mullvad API with client's IP in headers
    const response = await fetch('https://am.i.mullvad.net/json', {
      headers: {
        'X-Forwarded-For': clientIP,
        'X-Real-IP': clientIP
      }
    });
    
    if (!response.ok) {
      throw new Error('Mullvad API returned status ' + response.status);
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
