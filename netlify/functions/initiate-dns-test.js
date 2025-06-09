// netlify/functions/initiate-dns-test.js (CommonJS - Returns client IP from header)
exports.handler = async (event, context) => {
    const corsHeaders = { /* ... CORS headers ... */ };
    if (event.httpMethod === 'OPTIONS') { /* ... OPTIONS handling ... */ }

    // Get client IP from Netlify headers
    const clientIp = event.headers['x-nf-client-connection-ip'] || 
                     (event.multiValueHeaders && event.multiValueHeaders['x-nf-client-connection-ip'] ? event.multiValueHeaders['x-nf-client-connection-ip'][0] : null) ||
                     'Client IP N/A'; 
    let clientIpInfo = { ip: clientIp, isp: 'N/A', country: 'N/A', city: 'N/A' };

    try {
        // Optionally, enrich this clientIp with a GeoIP API call here if you want
        // For now, just use the IP directly
        if (clientIp !== 'Client IP N/A' && clientIp !== '127.0.0.1') {
            // Example: Call Mullvad API for THIS clientIp
            const mullvadResponse = await fetch(`https://am.i.mullvad.net/json?ip=${clientIp}`);
            if (mullvadResponse.ok) {
                const mullvadData = await mullvadResponse.json();
                clientIpInfo = {
                    ip: clientIp, // Use the IP from Netlify header
                    isp: mullvadData.organization || 'N/A',
                    country: mullvadData.country || 'N/A',
                    city: mullvadData.city || 'N/A'
                };
            }
        }
    } catch(e) {
        console.error("Error fetching GeoIP for client IP in initiate-dns-test:", e.message);
    }

    // ... (rest of the leak_id and hostnames_to_ping generation remains the same) ...
    const leak_id = "id" + Date.now().toString().slice(-6) + Math.random().toString(36).slice(2, 8);
    const baseTestDomain = "bash.ws";
    const hostnames_to_ping = [];
    for (let i = 0; i < 10; i++) { hostnames_to_ping.push(`${i}.${leak_id}.${baseTestDomain}`); }
    try {
        const registerUrl = `https://bash.ws/dnsleak/test/${leak_id}?json&delete=1`; 
        await fetch(registerUrl); 
    } catch (e) { /* ... */ }

    return {
        statusCode: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ 
            leak_id: leak_id, 
            hostnames_to_ping,
            your_public_ip_information: clientIpInfo // Key name changed for clarity
        })
    };
};
