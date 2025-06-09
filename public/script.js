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
        if (!initiateResponse.ok) { /* ... error handling ... */ }
        const testParams = await initiateResponse.json();
        
        const leak_id = testParams.leak_id;
        const hostnames_to_ping = testParams.hostnames_to_ping;
        const client_ip_info = testParams.client_ip_info; // Get client IP info here

        if (!leak_id || !hostnames_to_ping || hostnames_to_ping.length === 0) { /* ... error ... */ }
        
        // Display Client IP Info Immediately
        if (client_ip_info) {
            const entryDiv = document.createElement('div');
            entryDiv.className = 'info-entry';
            entryDiv.innerHTML = `<h3>Your Public IP Information:</h3> 
                               <div><strong>IP Address:</strong> <span>${client_ip_info.ip || 'N/A'}</span></div>
                               <div><strong>Provider:</strong> <span>${client_ip_info.isp || 'N/A'}</span></div>
                               <div><strong>Location:</strong> <span>${client_ip_info.city || 'N/A'}, ${client_ip_info.country || 'N/A'}</span></div>`;
            ipDetailsContainer.appendChild(entryDiv);
        }

        console.log("[Frontend] Received leak_id:", leak_id, "Hostnames:", hostnames_to_ping);
        statusMessageParagraph.textContent = `Performing ${hostnames_to_ping.length} DNS lookups (pings to bash.ws)...`;

        const pingPromises = hostnames_to_ping.map(hostname => { /* ... same ping logic ... */ 
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
        if (!resultsResponse.ok) { /* ... error handling ... */ }
        const dnsResultsData = await resultsResponse.json(); // Now contains { dns_servers: [], conclusion: "" }
        console.log("[Frontend] DNS Leak Results received:", dnsResultsData);

        statusMessageParagraph.textContent = 'Test Complete!';
        // ipDetailsContainer is already populated
        dnsServersContainer.innerHTML = ''; // Clear just in case
        conclusionContainer.innerHTML = '';
        
        if (dnsResultsData.dns_servers && dnsResultsData.dns_servers.length > 0) {
            const dnsHeader = document.createElement('h3');
            dnsHeader.textContent = `Your DNS requests originate from ${dnsResultsData.dns_servers.length} server(s):`;
            dnsServersContainer.appendChild(dnsHeader);
            dnsResultsData.dns_servers.forEach(server => { /* ... display each DNS server ... */ 
                 const entryDiv = document.createElement('div');
                 entryDiv.className = 'info-entry';
                 entryDiv.innerHTML = `<div><strong>IP Address:</strong> <span>${server.ip || 'N/A'}</span></div>
                                      <div><strong>Provider:</strong> <span>${server.isp || 'N/A'}</span></div>
                                      <div><strong>Location:</strong> <span>${server.city || 'N/A'}, ${server.country || 'N/A'}</span></div>`;
                 dnsServersContainer.appendChild(entryDiv);
            });
        } else { /* ... no DNS servers message ... */ }

        if (dnsResultsData.conclusion) { /* ... display conclusion ... */ }

    } catch (error) { /* ... error handling ... */ } 
    finally { startButton.disabled = false; }
});
