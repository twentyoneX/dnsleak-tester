// netlify/functions/fetch-dns-results.js (CommonJS)
exports.handler = async (event, context) => {
    const leak_id = event.queryStringParameters.leak_id;

    if (!leak_id) {
        console.warn("[Netlify fetch-dns-results] leak_id missing from query parameters.");
        return { statusCode: 400, body: JSON.stringify({ error: "leak_id is missing." }) };
    }

    const bashWsResultsUrl = `https://bash.ws/dnsleak/test/${leak_id}?json`;
    console.log(`[Netlify fetch-dns-results] Querying bash.ws: ${bashWsResultsUrl}`);

    try {
        const responseFromBashWS = await fetch(bashWsResultsUrl);
        const responseText = await responseFromBashWS.text(); 

        if (!responseFromBashWS.ok) {
            console.error(`[Netlify fetch-dns-results] Error from bash.ws (Status: ${responseFromBashWS.status}): ${responseText}`);
            throw new Error(`bash.ws responded with status ${responseFromBashWS.status}`);
        }
        
        let parsedDataFromBashWS;
        try {
            parsedDataFromBashWS = JSON.parse(responseText);
        } catch (e) {
            console.error("[Netlify fetch-dns-results] Failed to parse JSON from bash.ws:", responseText, e);
            throw new Error("Invalid JSON response from bash.ws");
        }

        console.log("[Netlify fetch-dns-results] Data from bash.ws (first 500 chars):", JSON.stringify(parsedDataFromBashWS, null, 2).substring(0, 500) + "...");

        const results = {
            your_ip_info: null,
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
                    results.your_ip_info = {
                        ip: item.ip || 'N/A',
                        isp: item.asn || 'N/A', 
                        country: item.country_name || 'N/A',
                        city: item.city_name || 'N/A' 
                    };
                } else if (item.type === "dns") {
                    results.dns_servers.push({
                        ip: item.ip || 'N/A',
                        isp: item.asn || 'N/A',
                        country: item.country_name || 'N/A',
                        city: item.city_name || 'N/A' 
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
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(results)
        };

    } catch (error) {
        console.error("[Netlify fetch-dns-results] Error:", error.message, error.stack);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ error: "Failed to fetch or process DNS leak results.", details: error.message }) 
        };
    }
};
