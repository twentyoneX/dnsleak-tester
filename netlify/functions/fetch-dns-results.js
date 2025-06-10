// netlify/functions/fetch-dns-results.js (CommonJS)
exports.handler = async (event, context) => {
    const corsHeaders = { /* ... same CORS headers as above ... */ };
    if (event.httpMethod === 'OPTIONS') { /* ... same OPTIONS handling ... */ }

    const leak_id = event.queryStringParameters.leak_id;
    if (!leak_id) { return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: "leak_id is missing." }) };}

    const bashWsResultsUrl = `https://bash.ws/dnsleak/test/${leak_id}?json`;
    try {
        const responseFromBashWS = await fetch(bashWsResultsUrl);
        const responseText = await responseFromBashWS.text(); 
        if (!responseFromBashWS.ok) {
             return { 
                 statusCode: responseFromBashWS.status, headers: corsHeaders,
                 body: JSON.stringify({ error: `bash.ws responded with status ${responseFromBashWS.status}`, details: responseText.substring(0,500) })
             };
        }
        let parsedDataFromBashWS;
        try { parsedDataFromBashWS = JSON.parse(responseText); } 
        catch (e) {
            return { 
                 statusCode: 500, headers: corsHeaders,
                 body: JSON.stringify({ error: "Invalid JSON response from bash.ws", details: responseText.substring(0,200) }) 
             };
        }
        const results = { your_ip_info: null, dns_servers: [], conclusion: null };
        if (Array.isArray(parsedDataFromBashWS)) {
            parsedDataFromBashWS.forEach(item => {
                if (!item || typeof item.type === 'undefined') { return; }
                if (item.type === "ip") {
                    results.your_ip_info = { ip: item.ip || 'N/A', isp: item.asn || 'N/A', 
                                             country: item.country_name || 'N/A', city: item.city_name || 'N/A' };
                } else if (item.type === "dns") {
                    results.dns_servers.push({ ip: item.ip || 'N/A', isp: item.asn || 'N/A',
                                               country: item.country_name || 'N/A', city: item.city_name || 'N/A' });
                } else if (item.type === "conclusion") { results.conclusion = item.ip; }
            });
        }
        return {
            statusCode: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
            body: JSON.stringify(results)
        };
    } catch (error) {
        console.error("[Netlify fetch-dns-results] Error:", error.message);
        return { 
            statusCode: 500, headers: corsHeaders,
            body: JSON.stringify({ error: "Failed to fetch/process DNS leak results.", details: error.message }) 
        };
    }
};
