// netlify/functions/fetch-dns-results.js (CommonJS - Should be correct)
exports.handler = async (event, context) => {
    const corsHeaders = { /* ... same CORS headers ... */ };
    if (event.httpMethod === 'OPTIONS') { /* ... same OPTIONS handling ... */ }

    const leak_id = event.queryStringParameters.leak_id;
    if (!leak_id) { /* ... error handling ... */ }

    const bashWsResultsUrl = `https://bash.ws/dnsleak/test/${leak_id}?json`;
    // ... (rest of the function is the same as the one that parses bash.ws response with type "ip", "dns", "conclusion")
    // Ensure it correctly populates results.your_ip_info from the item with type: "ip"
    // from the bash.ws response.
     try {
         // ... (fetch from bashWsResultsUrl) ...
         // ... (parse responseText to parsedDataFromBashWS) ...

         const results = {
             your_ip_info: null, // This will be filled by the type "ip" entry from bash.ws
             dns_servers: [],
             conclusion: null
         };

         if (Array.isArray(parsedDataFromBashWS)) {
             parsedDataFromBashWS.forEach(item => {
                 if (!item || typeof item.type === 'undefined') { return; }
                 if (item.type === "ip") { // This is the IP seen by bash.ws when the Netlify func called it
                     results.your_ip_info = {
                         ip: item.ip || 'N/A',
                         isp: item.asn || 'N/A', 
                         country: item.country_name || 'N/A',
                         city: item.city_name || 'N/A' 
                     };
                 } else if (item.type === "dns") {
                     results.dns_servers.push({ /* ... */ });
                 } else if (item.type === "conclusion") {
                     results.conclusion = item.ip; 
                 }
             });
         }
         // ... (return results) ...
     } catch (error) { /* ... error handling ... */ }
};
