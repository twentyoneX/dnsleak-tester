// netlify/functions/fetch-dns-results.js (CommonJS)
exports.handler = async (event, context) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers: corsHeaders,
            body: ''
        };
    }

    if (event.httpMethod === 'GET') {
        const leak_id = event.queryStringParameters.leak_id;

        if (!leak_id) {
            console.warn("[Netlify fetch-dns-results] leak_id missing from query parameters.");
            return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: "leak_id is missing." }) };
        }

        const bashWsResultsUrl = `https://bash.ws/dnsleak/test/${leak_id}?json`;
        console.log(`[Netlify fetch-dns-results] Querying bash.ws: ${bashWsResultsUrl}`);

        try {
            const responseFromBashWS = await fetch(bashWsResultsUrl);
            const responseText = await responseFromBashWS.text(); 

            if (!responseFromBashWS.ok) {
                console.error(`[Netlify fetch-dns-results] Error from bash.ws (Status: ${responseFromBashWS.status}): ${responseText}`);
                return { 
                    statusCode: responseFromBashWS.status, 
                    headers: corsHeaders,
                    body: JSON.stringify({ error: `bash.ws respondedYou with status ${responseFromBashWS.status}`, details: responseText.substring(0,500) })
                };
            }
            
            let parsedDataFromBashWS;
            try {
                parsedDataFromBashWS = JSON.parse(responseText);
            } catch (e) {
                console.error("[Netlify fetch-dns-results] Failed to parse JSON from bash.ws:", responseText, e);
                return { 
                    statusCode: 500, 
                    headers: corsHeaders,
                    body: JSON.stringify({ error: "Invalid JSON response from bash.ws", details: responseText.substring(0,200) }) 
                };
            }

            console.log("[Netlify fetch-dns-results] Data from bash.ws (first 500 chars):", JSON.stringify(parsedDataFromBashWS, null, 2).substring(0, 500) + "...");

            const results = { /* ... same results processing logic as before ... */ };
             if (Array.isArray(parsedDataFromBashWS)) {
                 parsedDataFromBashWS.forEach(item => {
                     if (!item || typeof item.type === 'undefined') { return; }
                     if (item.type === "ip") {
                         results.your_ip_info = {
                             ip: item.ip || 'N/A', isp: item.asn || 'N/A', 
                             country: item.country_name || 'N/A', city: item.city_name || 'N/A' 
                         };
                     } else if (item.type === "dns") {
                         results.dns_servers.push({
                             ip: item.ip || 'N/A', isp: item.asn || 'N/A',
                             country: item.country_name || 'N/A', city: item.city_name || 'N/A' 
                         });
                     } else if (item.type === "conclusion") {
                         results.conclusion = item.ip; 
                     }
                 });
             }
            
            console are absolutely right to point out the "CORS Missing Allow Origin" in the Network tab for the `initiate-dns-test` call to your Netlify function! I apologize for missing that in the initial glance at the UI error.

This **CORS error** is the root cause of the "NetworkError when attempting to fetch resource" shown in your UI.

**Why it's happening:**

*   Your Blogspot page (`peekmyip.com`) is trying to make a `fetch` request to your Netlify Functions URL (`https://leaking-dns.netlify.app/.netlify/functions/initiate-dns-test`).
*   Because these are **different domains** (`peekmyip.com` vs. `netlify.app`), the browser's security policy (CORS) prevents the JavaScript on `peekmyip.com` from reading the response from `netlify.app` *unless* the server at `netlify.app` explicitly allows it by sending back specific CORS headers.
*   The error "CORS Missing Allow Origin" means your Netlify Function did not include the `Access-Control-Allow-Origin` header in its response.

**The Fix: Ensure CORS Headers are Correctly Implemented in ALL Netlify Functions**

We added CORS headers to the Netlify functions in the previous step, but let's be absolutely meticulous and ensure they are correct and handle the `OPTIONS` preflight request properly.

**Updated Netlify Function Code (ensure these are the versions in your `dnsleak-tester` GitHub repo in the `netlify/functions/` directory):**

**1. `netlify/functions/initiate-dns-test.js` (CommonJS - WITH CORS)**
.log("[Netlify fetch-dns-results] Processed results:", results.dns_servers.length, "DNS servers found.");
            return {
                statusCode: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                body: JSON.stringify(results)
            };

        } catch (error) {
            console.error("[Netlify fetch-dns-results] Error:", error.message, error.stack);
            return { 
                statusCode: 500, 
                headers: corsHeaders,
                body: JSON.stringify({ error: "Failed to fetch or process DNS leak results.", details: error.message }) 
            };
        }
    }
    
    return {
        statusCode: 405,
        headers: corsHeaders,
        body: JSON.stringify({ error: `HTTP method ${event.httpMethod} not allowed.`})
    };
};
