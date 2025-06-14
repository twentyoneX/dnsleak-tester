// netlify/functions/fetch-dns-results.js (CommonJS - Full Version)
exports.handler = async (event, context) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        console.log("[Netlify fetch-dns-results] Handling OPTIONS preflight.");
        return { statusCode: 204, headers: corsHeaders, body: '' };
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
                    body: JSON.stringify({ error: `bash.ws responded with status ${responseFromBashWS.status}`, details: responseText.substring(0,500) })
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

            const results = {
                your_ip_info: null, // bash.ws 'type: "ip"' will populate this (Netlify function's IP)
                dns_servers: [],
                conclusion: null
            };

            if (Array.isArray(parsedDataFromBashWS)) {
                parsedDataFromBashWS.forEach(item => {
                    if (!item || typeof item.type === 'undefined') { 
                        console.warn("[Netlify fetch-dns-results] Skipping invalid item from bash.ws:", item);
                        return; 
                    }
                    if (item.type === "ip") {
                        results.your_ip_info = { // This is info about the Netlify function's IP from bash.ws
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
            } else {
                console.warn("[Netlify fetch-dns-results] parsedDataFromBashWS was not an array:", parsedDataFromBashWS);
            }
            
            console.log("[Netlify fetch-dns-results] Processed results:", results.dns_servers.length, "DNS servers found.");
            return {
                statusCode: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                body: JSON.stringify(results) // Send full results object
            };

        } catch (error) {
            console.error("[Netlify fetch-dns-results] Error in GET logic:", error.message, error.stack);
            return { 
                statusCode: 500, 
                headers: corsHeaders,
                body: JSON.stringify({ error: "Failed to fetch or process DNS leak results.", details: error.message }) 
            };
        }
    }
    
    console.log(`[Netlify fetch-dns-results] Method Not Allowed: ${event.httpMethod}`);
    return {
        statusCode: 405, 
        headers: corsHeaders,
        body: JSON.stringify({ error: `HTTP method ${event.httpMethod} not allowed.`})
    };
};
