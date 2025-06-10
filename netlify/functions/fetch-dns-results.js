// netlify/functions/fetch-dns-results.js (TEMPORARY CORS DEBUG VERSION)
exports.handler = async (event, context) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        console.log("[Netlify fetch-dns-results DEBUG] Handling OPTIONS preflight.");
        return { statusCode: 204, headers: corsHeaders, body: '' };
    }

    if (event.httpMethod === 'GET') {
        console.log("[Netlify fetch-dns-results DEBUG] Responding to GET request.");
        const leak_id = event.queryStringParameters.leak_id;
        return {
            statusCode: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            body: JSON.stringify({ 
                message: "Fetch-results CORS test successful!", 
                received_leak_id: leak_id,
                dns_servers: [], // Send empty array to satisfy frontend structure
                conclusion: "Test conclusion pending actual bash.ws call."
            })
        };
    }
    
    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: "Method not allowed" })};
};
