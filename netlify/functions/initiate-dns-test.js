// netlify/functions/initiate-dns-test.js (CommonJS - Fetches Client IP GeoData)
exports.handler = async (event, context) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers: corsHeaders, body: '' };
    }

    // --- Logic to get and enrich client IP ---
    let clientIp = event.headers['x-nf-client-connection-ip'] || 
                   (event.multiValueHeaders && event.multiValueHeaders['x-nf-client-connection-ip'] ? event.multiValueHeaders['x-nf-client-connection-ip'][0] : null);
    
    let clientIpInfo = { ip: clientIp || 'N/A', isp: 'N/A', country: 'N/A', city: 'N/A' };

    if (clientIp && clientIp !== 'N/A' && clientIp !== '127.0.0.1') {
        try {
            console.log(`[Netlify initiate-dns-test] Client connection IP from Netlify header: ${clientIp}`);
            // Using ip-api.com as it seemed to give you more accurate results for your IP previously
            const geoIpApiUrl = `http://ip-api.com/json/${clientIp}?fields=status,message,country,city,isp,org,query`;
            console.log(`[Netlify initiate-dns-test] Fetching client IP details from ip-api.com: ${geoIpApiUrl}`);
            const geoIpResponse = await fetch(geoIpApiUrl);
            
            if (geoIpResponse.ok) {
                const geoIpData = await geoIpResponse.json();
                console.log("[Netlify initiate-dns-test] Data from ip-api.com for client IP:", geoIpData);
                if (geoIpData.status === 'success') {
                    clientIpInfo = {
                        ip: geoIpData.query, 
                        isp: geoIpData.org || geoIpData.isp || 'N/A',
                        country: geoIpData.country || 'N/A',
                        city: geoIpData.city || 'N/A'
                    };
                } else {
                     console.warn(`[Netlify initiate-dns-test] ip-api.com reported failure for client IP ${clientIp}: ${geoIpData.message}`);
                     clientIpInfo.isp = `GeoIP lookup error: ${geoIpData.message || 'Failed status'}`;
                }
            } else {
                console.warn(`[Netlify initiate-dns-test] ip-api.com HTTP error for client IP ${clientIp}: ${geoIpResponse.status}`);
                clientIpInfo.isp = `GeoIP lookup HTTP error: ${geoIpResponse.status}`;
            }
        } catch (e) {
            console.error("[Netlify initiate-dns-test] Error fetching client IP GeoIP details:", e.message);
            clientIpInfo.isp = `GeoIP fetch error: ${e.message.substring(0, 50)}`;
        }
    } else {
        console.log("[Netlify initiate-dns-test] Client IP not available or is local, skipping GeoIP lookup. IP was:", clientIp);
    }
    // --- End of Client IP logic ---

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

        console.log("[Netlify initiate-dns-test] Generated leak_id: ${leak_id}, Hostnames count: ${hostnames_to_ping.length}");
        return {
            statusCode: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            body: JSON.stringify({ 
                leak_id: leak_id, 
                hostnames_to_ping,
                your_public_ip_information: clientIpInfo // Pass the determined client IP info
            })
        };
    } catch (error) {
        console.error("[Netlify initiate-dns-test] Error in main test logic:", error.message, error.stack);
        return { 
            statusCode: 500, 
            headers: corsHeaders,
            body: JSON.stringify({ error: "Failed to initiate DNS leak test.", details: error.message, your_public_ip_information: clientIpInfo }) 
        };
    }
};
