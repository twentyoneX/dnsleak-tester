// public/script.js
const startButton = document.getElementById('startTestButton');
const resultsDiv = document.getElementById('results');
const ipDetailsContainer = document.getElementById('ipDetailsContainer');
const dnsServersContainer = document.getElementById('dnsServersContainer');
const conclusionContainer = document.getElementById('conclusionContainer');
const statusMessageParagraph = resultsDiv.querySelector('p.status-message');

startButton.addEventListener('click', async () => {
    ipDetailsContainer.innerHTML = ''; 
    dnsServersContainer.innerHTML = '';
    conclusionContainer.innerHTML = '';
    statusMessageParagraph.textContent = 'Starting Test...';
    startButton.disabled = true;

    try {
        console.log("[Frontend] Calling /api/initiate-dns-test");
        const initiateResponse = await fetch('/api/initiate-dns-test');
        if (!initiateResponse.ok) {
            const errorText = await initiateResponse.text();
            throw new Error(`Failed to initiate test setup: ${initiateResponse.statusText} (${initiateResponse.status}). Server said: ${errorText}`);
        }
        const testParams = await initiateResponse.json();
        const leak_id = testParams.leak_id;
        const hostnames_to_ping = testParams.hostnames_to_ping;

        if (!leak_id || !hostnames_to_ping || hostnames_to_ping.length === 0) {
            throw new Error("Invalid parameters received from /api/initiate-dns-test.");
        }
        console.log("[Frontend] Received leak_id:", leak_id, "Hostnames:", hostnames_to_ping);
        statusMessageParagraph.textContent = `Performing ${hostnames_to_ping.length} DNS lookups (pings to bash.ws)...`;

        const pingPromises = hostnames_to_ping.map(hostname => {
            const img = new Image();
            img.src = `http://${hostname}/z.gif?r=${Math.random()}`; 
            console.log(`[Frontend] Triggering DNS lookup for: ${hostname}`);
            return new Promise(resolve => {
                let resolved = false;
                img.onload = img.onerror = () => {
                    if (!resolved) { resolved = true; resolve({hostname, status: 'attempted'}); }
                };
                setTimeout(() => { 
                    if (!resolved) { resolved = true; resolve({hostname, status: 'timeout_fallback'}); }
                }, 1500); 
            });
        });

        await Promise.allSettled(pingPromises);
        console.log("[Frontend] All DNS lookup triggers attempted.");
        statusMessageParagraph.textContent = 'Fetching DNS leak results from bash.ws... (may take up to 10-15s)';
        
        await new Promise(resolve => setTimeout(resolve, 10000)); 

        console.log(`[Frontend] Calling /api/fetch-dns-results for leak_id: ${leak_id}`);
        const resultsResponse = await fetch(`/api/fetch-dns-results?leak_id=${leak_id}`);
        if (!resultsResponse.ok) {
            const errorText = await resultsResponse.text();
            throw new Error(`Failed to fetch DNS results: ${resultsResponse.statusText} (${resultsResponse.status}). Server said: ${errorText}`);
        }
        const resultsData = await resultsResponse.json(); 
        console.log("[Frontend] DNS Leak Results received:", resultsData);

        statusMessageParagraph.textContent = 'Test Complete!';
        ipDetailsContainer.innerHTML = ''; 
        dnsServersContainer.innerHTML = '';
        conclusionContainer.innerHTML = '';
        
        if (resultsData.your_ip_info) {
            const ipEntry = resultsData.your_ip_info;
            const entryDiv = document.createElement('div');
            entryDiv.className = 'info-entry';
            entryDiv.innerHTML = `<h3>Your Public IP Information:</h3> 
                               <div><strong>IP Address:</strong> <span>${ipEntry.ip || 'N/A'}</span></div>
                               <div><strong>Provider:</strong> <span>${ipEntry.isp || 'N/A'}</span></div>
                               <div><strong>Location:</strong> <span>${ipEntry.city || 'N/A'}, ${ipEntry.country || 'N/A'}</span></div>`;
            ipDetailsContainer.appendChild(entryDiv);
        }

        if (resultsData.dns_servers && resultsData.dns_servers.length > 0) {
            const dnsHeader = document.createElement('h3');
            dnsHeader.textContent = `Your DNS requests originate from ${resultsData.dns_servers.length} server(s):`;
            dnsServersContainer.appendChild(dnsHeader);

            resultsData.dns_servers.forEach(server => {
                const entryDiv = document.createElement('div');
                entryDiv.className = 'info-entry';
                entryDiv.innerHTML = `<div><strong>IP Address:</strong> <span>${server.ip || 'N/A'}</span></div>
                                     <div><strong>Provider:</strong> <span>${server.isp || 'N/A'}</span></div>
                                     <div><strong>Location:</strong> <span>${server.city || 'N/A'}, ${server.country || 'N/A'}</span></div>`;
                dnsServersContainer.appendChild(entryDiv);
            });
        } else {
             dnsServersContainer.innerHTML = '<div class="info-entry"><span>No leaking DNS servers detected by bash.ws or an error occurred.</span></div>';
        }

        if (resultsData.conclusion) {
            const conclusionDiv = document.createElement('div');
            conclusionDiv.className = 'info-entry';
            conclusionDiv.innerHTML = `<h3>Conclusion from bash.ws:</h3><p>${resultsData.conclusion}</p>`;
            conclusionContainer.appendChild(conclusionDiv);
        }

    } catch (error) {
        console.error("[Frontend] Full Test Error:", error);
        statusMessageParagraph.textContent = `Error: ${error.message}. Check browser console.`;
    } finally {
        startButton.disabled = false;
    }
});
