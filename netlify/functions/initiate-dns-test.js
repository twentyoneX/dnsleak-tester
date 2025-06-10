exports.handler = async (event, context) => {
    console.log(`[Netlify initiate-dns-test] Received ${event.httpMethod} request`);
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Headers': 'Content-Type, X-Custom-Header', // Be generous for testing
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', // Be generous
        'X-My-Custom-Header': 'TestValue' // A custom header to check
    };

    if (event.httpMethod === 'OPTIONS') {
        console.log("[Netlify initiate-dns-test] Responding to OPTIONS preflight.");
        return { statusCode: 204, headers: corsHeaders, body: '' };
    }

    console.log("[Netlify initiate-dns-test] Responding to GET request.");
    return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: "CORS test successful", receivedMethod: event.httpMethod })
    };
};
