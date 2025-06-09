// public/script.js
// ... (keep existing const declarations for elements) ...

startButton.addEventListener('click', async () => {
    // Clear previous results
    ipDetailsContainer.innerHTML = ''; 
    dnsServersContainer.innerHTML = '';
    conclusionContainer.innerHTML = '';
    statusMessageParagraph.textContent = 'Initializing Test Sequence...'; // Updated
    startButton.disabled = true;

    try {
        console.log("[Frontend] Calling /api/initiate-dns-test");
        statusMessageParagraph.textContent = 'Requesting test parameters...'; // Update
        const initiateResponse = await fetch('/api/initiate-dns-test'); 
        if (!initiateResponse.ok) { /* ... same error handling ... */ }
        const testParams = await initiateResponse.json();
        const leak_id = testParams.leak_id;
        const hostnames_to_ping = testParams.hostnames_to_ping;
        const client_ip_info = testParams.client_ip_info;

        if (!leak_id || !hostnames_to_ping || hostnames_to_ping.length === 0) { /* ... same error ... */ }
        
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
        statusMessageParagraph.textContent = `Performing ${hostnames_to_ping.length} DNS lookups (pings to bash.ws)... This may take a few seconds.`; // Update

        const pingPromises = hostnames_to_ping.map(hostname => { /* ... same ping logic ... */ });
        await Promise.allSettled(pingPromises);

        console.log("[Frontend] All DNS lookup triggers attempted.");
        statusMessageParagraph.textContent = 'Fetching DNS leak results from bash.ws... (Please wait, this can take 10-15 seconds)'; // Update & add patience
        
        await new Promise(resolve => setTimeout(resolve, 10000)); 

        console.log(`[Frontend] Calling /api/fetch-dns-results for leak_id: ${leak_id}`);
        const resultsResponse = await fetch(`/api/fetch-dns-results?leak_id=${leak_id}`);
        if (!resultsResponse.ok) { /* ... same error handling ... */ }
        const dnsResultsData = await resultsResponse.json(); 
        console.log("[Frontend] DNS Leak Results received:", dnsResultsData);

        statusMessageParagraph.textContent = 'Test Complete!'; // Final status before showing results
        
        // IP Details already shown
        // dnsServersContainer.innerHTML = ''; // Already cleared at the top
        // conclusionContainer.innerHTML = ''; // Already cleared at the top
        
        if (dnsResultsData.dns_servers && dnsResultsData.dns_servers.length > 0) {
            const dnsHeader = document.createElement('h3');
            dnsHeader.textContent = `Your DNS requests originate from ${dnsResultsData.dns_servers.length} server(s):`;
            dnsServersContainer.appendChild(dnsHeader);

            dnsResultsData.dns_servers.forEach(server => { /* ... same DNS server display logic ... */ 
                const entryDiv = document.createElement('div');
                entryDiv.className = 'info-entry';
                entryDiv.innerHTML = `<div><strong>IP Address:</strong> <span>${server.ip || 'N/A'}</span></div>
                                     <div><strong>Provider:</strong> <span>${server.isp || 'N/A'}</span></div>
                                     <div><strong>Location:</strong> <span>${server.city || 'N/A'}, ${server.country || 'N/A'}</span></div>`;
                dnsServersContainer.appendChild(entryDiv);
            });
        } else {
             dnsServersContainer.innerHTML = '<h3>Detected DNS Servers:</h3><div class="info-entry"><span>No leaking DNS servers detected by bash.ws or an error occurred.</span></div>';
        }

        if (dnsResultsData.conclusion) {
            const conclusionDiv = document.createElement('div');
            // conclusionDiv.className = 'info-entry'; // Keep this if you want the box style
            conclusionDiv.innerHTML = `<h3>Conclusion from bash.ws:</h3><p style="font-style: italic;">${dnsResultsData.conclusion}</p>`; // Display as paragraph
            conclusionContainer.appendChild(conclusionDiv);
        } else {
            conclusionContainer.innerHTML = '<h3>Conclusion from bash.ws:</h3><p style="font-style: italic;">No specific conclusion provided.</p>';
        }

    } catch (error) { 
        console.error("[Frontend] Full Test Error:", error);
        statusMessageParagraph.textContent = `Error: ${error.message}. Check browser console.`;
        // Optionally display the error more prominently in the results area too
        ipDetailsContainer.innerHTML = `<div class="info-entry" style="border-left-color: red;"><strong>Test Failed:</strong> <span>${error.message}</span></div>`;
    } finally { 
        startButton.disabled = false; 
    }
});
