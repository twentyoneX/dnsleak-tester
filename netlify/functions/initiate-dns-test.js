// netlify/functions/initiate-dns-test.js (CommonJS)
exports.handler = async (event, context) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers: corsHeaders, body: '' };
    }

    // Handle actual GET request
    if (event.httpMethod === 'GET') {
        try {
            const leak_id = "id" + Date.now().toString().slice(-6) + Math.random().toString(36).slice(2, 8);
            const baseTestDomain = "bash.ws"; 
            const hostnames_to_ping = [];
            for (let i = 0; i < 10; i++) { 
                hostnames_to_ping.push(`${i}.${leak_id}.${baseTestDomain}`);
            }
            
            try {
                const registerUrl = `https://bash.ws/dnsleak/test/${leak_id}?json&delete=1`; 
                await fetch(registerUrl); 
                console.log(`[Netlify initiate-dns-test] Initial registration call to ${registerUrl} made.`);
            } catch (e) {
                console.warn("[Netlify initiate-dns-test] Optional registration call to bash.ws failed, continuing...", e.message);
            }

            console.log(`[Netlify initiate-dns-test] Generated leak_id: ${leak_id}, Hostnames count: ${hostnames_to_ping.length}`);
            return {
                statusCode: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                // Only sending leak_id and hostnames_to_ping
                body: JSON.stringify({ leak_id: leak_id, hostnames_to_ping }) 
            };
        } catch (error) {
            console.error("[Netlify initiate-dns-test] Error in GET logic:", error.message, error.stack);
            return { 
                statusCode: 500, 
                headers: corsHeaders,
                body: JSON.stringify({ error: "Failed to initiate DNS leak test.", details: error.message }) 
            };
        }
    }

    console.log(`[Netlify initiate-dns-test] Method Not Allowed: ${event.httpMethod}`);
    return {
        statusCode: 405, 
        headers: corsHeaders,
        body: JSON.stringify({ error: `HTTP method ${event.httpMethod} not allowed.`})
    };
};
