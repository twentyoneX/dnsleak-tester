// netlify/functions/fetch-dns-results.js (CommonJS)
exports.handler = async (event, context) => {
    const corsHeaders = { /* ... same CORS headers ... */ };
    if (event.httpMethod === 'OPTIONS') { /* ... same OPTIONS handling ... */ }

    if (event.httpMethod === 'GET') {
        const leak_id = event.queryStringParameters.leak_id;
        if (!leak_id) { return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: "leak_id is missing." }) };}

        const bashWsResultsUrl = `https://bash.ws/dnsleak/test/${leak_id}?json`;
        console.log(`[Netlify fetch-dns-results] Querying bash.ws: ${bashWsResultsUrl}`);
        try {
            const responseFromBashWS = await fetch(bashWsResultsUrl);
            const responseText = await responseFromBashWS.text(); 
            if (!responseFromBashWS.ok) { /* ... error handling ... */ }
            let parsedDataFromBashWS;
            try { parsedDataFromBashWS = JSON.parse(responseText); } 
            catch (e) { /* ... error handling ... */ }

            const results = {
                // REMOVED your_ip_info from here
                dns_servers: [],
                conclusion: null
            };

            if (Array.isArray(parsedDataFromBashWS)) {
                parsedDataFromBashWS.forEach(item => {
                    if (!item || typeof item.type === 'undefined') { return; }
                    // We IGNORE item.type === "ip" here, as client IP info comes from initiate-dns-test
                    if (item.type === "dns") {
                        results.dns_servers.push({ ip: item.ip || 'N/A', isp: item.asn || 'N/A', 
                                                 country: item.country_name || 'N/A', city: item.city_name || 'N/A' });
                    } else if (item.type === "conclusion") {
                        results.conclusion = item.ip; 
                    }
                });
            }
            return {
                statusCode: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                body: JSON.stringify(results) // Only dns_servers and conclusion
            };
        } catch (error) { /* ... error handling ... */ }
    }
    return { /* ... 405 Method Not Allowed with CORS ... */ };
};
