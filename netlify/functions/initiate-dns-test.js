// netlify/functions/initiate-dns-test.js (CommonJS)
exports.handler = async (event, context) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*', // Allows all origins
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' // Add OPTIONS
    };

    // Handle OPTIONS preflight request for CORS
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204, // No Content
            headers: corsHeaders,
            body: ''
        };
    }

    try {
        const leak_id = "id" + Date.now().toString().slice(-6) + Math.random().toString(36).slice(2, 8);
        const baseTestDomain = "bash.ws"; 

        console.log(`[Netlify initiate-dns-test] Generated leak_id: ${leak_id}`);

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

        console.log("[Netlify initiate-dns-test] Hostnames to ping count:", hostnames_to_ping.length);
        return {
            statusCode: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" }, // Merge CORS headers
            body: JSON.stringify({ leak_id: leak_id, hostnames_to_ping })
        };
    } catch (error) {
        console.error("[Netlify initiate-dns-test] Error:", error.message, error.stack);
        return { 
            statusCode: 500, 
            headers: corsHeaders, // Add CORS headers to error responses too
            body: JSON.stringify({ error: "Failed to initiate DNS leak test.", details: error.message }) 
        };
    }
};
