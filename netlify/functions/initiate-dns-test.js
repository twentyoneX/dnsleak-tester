// netlify/functions/initiate-dns-test.js (CommonJS)
exports.handler = async (event, context) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*', // Allows all origins. For production, you might restrict this to your Blogspot domain.
        'Access-Control-Allow-Headers': 'Content-Type', // Add other headers your client might send
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };

    // Handle OPTIONS preflight request for CORS
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204, // No Content, but headers are important
            headers: corsHeaders,
            body: ''
        };
    }

    // Handle actual GET request
    if (event.httpMethod === 'GET') {
        try {
            // Generate our own unique leak_id for this session
            const leak_id = "id" + Date.now().toString().slice(-6) + Math.random().toString(36).slice(2, 8);
            const baseTestDomain = "bash.ws"; // The domain whose subdomains we will query

            console.log(`[Netlify initiate-dns-test] Generated leak_id: ${leak_id}`);

            const hostnames_to_ping = [];
            // bash.ws seems to expect around 10 pings based on the python script analysis
            for (let i = 0; i < 10; i++) { 
                hostnames_to_ping.push(`${i}.${leak_id}.${baseTestDomain}`);
            }
            
            // Optional: "Warm up" or "register" the test with bash.ws by clearing old results for this ID pattern.
            // This mimics what their ip.js and python script seem to do.
            try {
                const registerUrl = `https://bash.ws/dnsleak/test/${leak_id}?json&delete=1`; 
                // We don't strictly need to await this or check its response for this particular call.
                fetch(registerUrl).catch(e => console.warn("[Netlify initiate-dns-test] Non-critical registration call to bash.ws failed, continuing...", e.message)); 
                console.log(`[Netlify initiate-dns-test] Optional registration/clear call to ${registerUrl} initiated.`);
            } catch (e) {
                // This catch is for synchronous errors in setting up the fetch, not the fetch promise itself.
                console.warn("[Netlify initiate-dns-test] Error setting up optional registration call to bash.ws, continuing...", e.message);
            }

            console.log("[Netlify initiate-dns-test] Hostnames to ping count:", hostnames_to_ping.length);
            return {
                statusCode: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" }, // Merge CORS headers
                body: JSON.stringify({ 
                    leak_id: leak_id, 
                    hostnames_to_ping: hostnames_to_ping,
                    // We will get client IP info from the bash.ws response in fetch-dns-results
                })
            };
        } catch (error) {
            console.error("[Netlify initiate-dns-test] Error in GET logic:", error.message, error.stack);
            return { 
                statusCode: 500, 
                headers: corsHeaders, // Add CORS headers to error responses too
                body: JSON.stringify({ error: "Failed to initiate DNS leak test.", details: error.message }) 
            };
        }
    }

    // Fallback for other methods if not GET or OPTIONS
    console.log(`[Netlify initiate-dns-test] Method Not Allowed: ${event.httpMethod}`);
    return {
        statusCode: 405, // Method Not Allowed
        headers: corsHeaders,
        body: JSON.stringify({ error: `HTTP method ${event.httpMethod} not allowed.`})
    };
};
