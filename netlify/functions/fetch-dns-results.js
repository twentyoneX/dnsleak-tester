// netlify/functions/fetch-dns-results.js (CommonJS)
exports.handler = async (event, context) => {
    const leak_id = event.queryStringParameters.leak_id;

    if (!leak_id) { /* ... error handling ... */ }

    const bashWsResultsUrl = `https://bash.ws/dnsleak/test/${leak_id}?json`;
    console.log(`[Netlify fetch-dns-results] Querying bash.ws: ${bashWsResultsUrl}`);

    try {
        const responseFromBashWS = await fetch(bashWsResultsUrl);
        const responseText = await responseFromBashWS.text();
        if (!responseFromBashWS.ok) { /* ... error handling ... */ }
        
        let parsedDataFromBashWS;
        try { parsedDataFromBashWS = JSON.parse(responseText); } 
        catch (e) { /* ... error handling ... */ }

        console.log("[Netlify fetch-dns-results] Data from bash.ws (first 500 chars):", JSON.stringify(parsedDataFromBashWS, null, 2).substring(0, 500) + "...");

        const results = {
            // No your_ip_info from here anymore
            dns_servers: [],
            conclusion: null
        };

        if (Array.isArray(parsedDataFromBashWS)) {
            parsedDataFromBashWS.forEach(item => {
                if (!item || typeof item.type === 'undefined') { return; }
                // We are NO LONGER interested in item.type === "ip" from bash.ws here
                if (item.type === "dns") {
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
        } else { /* ... warning ... */ }
        
        console.log("[Netlify fetch-dns-results] Processed results:", results.dns_servers.length, "DNS servers found.");
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(results) // Only dns_servers and conclusion
        };
    } catch (error) { /* ... error handling ... */ }
};
