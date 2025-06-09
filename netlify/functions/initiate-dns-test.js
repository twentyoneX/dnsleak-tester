// netlify/functions/initiate-dns-test.js (CommonJS)
exports.handler = async (event, context) => {
    let clientIp = event.headers['x-nf-client-connection-ip'] || 'N/A';
    let clientIpInfo = { ip: clientIp, isp: 'N/A', country: 'N/A', city: 'N/A' };

    try {
        console.log(`[Netlify initiate-dns-test] Client connection IP: ${clientIp}`);
        if (clientIp !== 'N/A') {
            const mullvadResponse = await fetch(`https://am.i.mullvad.net/json?ip=${clientIp}`);
            if (mullvadResponse.ok) {
                const mullvadData = await mullvadResponse.json();
                clientIpInfo = {
                    ip: clientIp,
                    isp: mullvadData.organization || 'N/A',
                    country: mullvadData.country || 'N/A',
                    city: mullvadData.city || 'N/A'
                };
                console.log("[Netlify initiate-dns-test] Fetched client IP details from Mullvad:", clientIpInfo);
            } else {
                console.warn(`[Netlify initiate-dns-test] Mullvad API error for client IP ${clientIp}: ${mullvadResponse.status}`);
            }
        }
    } catch (e) {
        console.error("[Netlify initiate-dns-test] Error fetching client IP details from Mullvad:", e.message);
    }

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
                client_ip_info: clientIpInfo // Send client IP info to frontend
            })
        };
    } catch (error) {
        console.error("[Netlify initiate-dns-test] Error in main test logic:", error.message, error.stack);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ error: "Failed to initiate DNS leak test.", details: error.message, client_ip_info: clientIpInfo }) 
        };
    }
};
