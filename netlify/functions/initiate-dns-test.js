// Inside initiate-dns-test.js, when fetching clientIpInfo
if (clientIp !== 'N/A') {
    // const mullvadResponse = await fetch(`https://am.i.mullvad.net/json?ip=${clientIp}`);
    const ipApiResponse = await fetch(`http://ip-api.com/json/${clientIp}?fields=status,message,country,city,isp,org,query`); // Using ip-api.com
    if (ipApiResponse.ok) {
        const ipApiData = await ipApiResponse.json();
        if (ipApiData.status === 'success') {
            clientIpInfo = {
                ip: ipApiData.query,
                isp: ipApiData.org || ipApiData.isp || 'N/A', // ip-api uses 'org' or 'isp'
                country: ipApiData.country || 'N/A',
                city: ipApiData.city || 'N/A'
            };
        } else {
             console.warn(`[Netlify initiate-dns-test] ip-api.com error for client IP ${clientIp}: ${ipApiData.message}`);
        }
    } else {
        console.warn(`[Netlify initiate-dns-test] ip-api.com HTTP error for client IP ${clientIp}: ${ipApiResponse.status}`);
    }
}
