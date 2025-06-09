// netlify/functions/initiate-dns-test.js (CommonJS - Try with ip-api.com)
exports.handler = async (event, context) => {
    let clientIp = event.headers['x-nf-client-connection-ip'] || 'N/A';
    let clientIpInfo = { ip: clientIp, isp: 'N/A', country: 'N/A', city: 'N/A' };

    try {
        console.log(`[Netlify initiate-dns-test] Client connection IP from Netlify header: ${clientIp}`);
        if (clientIp !== 'N/A' && clientIp !== '127.0.0.1') { // Avoid local/undefined IPs
            const ipApiUrl = `http://ip-api.com/json/${clientIp}?fields=status,message,country,city,isp,org,query`;
            console.log(`[Netlify initiate-dns-test] Fetching client IP details from ip-api.com: ${ipApiUrl}`);
            const ipApiResponse = await fetch(ipApiUrl);
            
            if (ipApiResponse.ok) {
                const ipApiData = await ipApiResponse.json();
                console.log("[Netlify initiate-dns-test] Data from ip-api.com:", ipApiData);
                if (ipApiData.status === 'success') {
                    clientIpInfo = {
                        ip: ipApiData.query, // Use the IP confirmed by ip-api.com
                        isp: ipApiData.org || ipApiData.isp || 'N/A',
                        country: ipApiData.country || 'N/A',
                        city: ipApiData.city || 'N/A'
                    };
                } else {
                     console.warn(`[Netlify initiate-dns-test] ip-api.com reported failure for IP ${clientIp}: ${ipApiData.message}`);
                     clientIpInfo.isp = `ip-api.com error: ${ipApiData.message || 'Failed status'}`;
                }
            } else {
                console.warn(`[Netlify initiate-dns-test] ip-api.com HTTP error for client IP ${clientIp}: ${ipApiResponse.status}`);
                clientIpInfo.isp = `ip-api.com HTTP error: ${ipApiResponse.status}`;
            }
        } else {
            console.log("[Netlify initiate-dns-test] Skipping GeoIP lookup for client IP:", clientIp);
        }
    } catch (e) {
        console.error("[Netlify initiate-dns-test] Error fetching client IP details:", e.message);
        clientIpInfo.isp = `Error fetching GeoIP: ${e.message.substring(0, 50)}`; // Add error to output
    }

    // --- Rest of the function (leak_id generation, hostnames_to_ping) remains the same ---
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
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                leak_id: leak_id, 
                hostnames_to_ping,
                client_ip_info: clientIpInfo 
            })
        };
    } catch (error) {
        console.error("[Netlify initiate-dns-test] Error in main test logic:", error.message, error.stack);
        // Still return clientIpInfo even if main logic fails, so user sees something
        return { 
            statusCode: 500, 
            body: JSON.stringify({ error: "Failed to initiate DNS leak test.", details: error.message, client_ip_info: clientIpInfo }) 
        };
    }
};
