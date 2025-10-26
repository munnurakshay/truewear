document.addEventListener('DOMContentLoaded', () => {
    // --- Global Verification Elements ---
    const verifyBtn = document.getElementById('verify-btn');
    const idInput = document.getElementById('product-id-input');
    const authStatus = document.getElementById('auth-status');
    const detailRecipient = document.getElementById('detail-recipient');
    const detailOwnerAddr = document.getElementById('detail-owner-addr');
    const detailTxHash = document.getElementById('detail-tx-hash');
    const qrPlaceholder = document.getElementById('qr-code-placeholder');
    const timelineContainer = document.getElementById('timeline-container');
    const contractDisplay = document.getElementById('contract-address-display');
    
    // --- Ship Product Elements (UPDATED) ---
    const shipIdInput = document.getElementById('ship-id-input');
    const recipientNameInput = document.getElementById('recipient-name');
    const locationInput = document.getElementById('location-input'); // NEW LOCATION INPUT
    const recipientAddressInput = document.getElementById('recipient-address');
    const submitShipmentBtn = document.getElementById('submit-shipment-btn');
    const shipmentStatus = document.getElementById('shipment-status');
    const transactionHashDisplay = document.getElementById('transaction-hash-display');
    
    // --- Trace Map Elements ---
    const mapProductSelect = document.getElementById('map-product-select');
    const mapTraceInfo = document.getElementById('map-trace-info');
    const mapRouteSummary = document.getElementById('map-route-summary');
    
    // --- Map Globals (NEW) ---
    let map = null; // Leaflet map object
    
    // --- Navigation Elements ---
    const connectBtn = document.getElementById('connect-wallet-btn');
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    const contentViews = document.querySelectorAll('.content-view');


    // Display contract address from config
    contractDisplay.textContent = `Contract: ${TRUWEAR_CONTRACT_ADDRESS.substring(0, 10)}...`;

    // 1. Event Listeners
    connectBtn.addEventListener('click', connectWallet);
    verifyBtn.addEventListener('click', handleVerification);
    submitShipmentBtn.addEventListener('click', handleSubmitShipment);

    navItems.forEach(item => {
        if (!item.classList.contains('wallet-btn')) {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const viewMap = {
                    'verification-link': 'view-verification',
                    'ship-product-link': 'view-ship-product',
                    'trace-journey-link': 'view-trace-journey'
                };
                const targetViewId = viewMap[item.id];
                if (targetViewId) {
                    switchView(targetViewId, item);
                    if (targetViewId === 'view-trace-journey') {
                        initMap(); // Initialize map when view is loaded
                        loadMapData();
                    }
                }
            });
        }
    });
    
    // 2. Map Selector Listener
    if (mapProductSelect) {
        mapProductSelect.addEventListener('change', (e) => {
            const productId = e.target.value;
            if (productId) {
                renderMapTrace(productId);
            } else {
                mapTraceInfo.innerHTML = '<p>Select a product above to load its journey path and view details.</p>';
                mapRouteSummary.innerHTML = '';
                // Clear map view
                if (map) map.eachLayer(layer => { if (layer instanceof L.Marker || layer instanceof L.Polyline) map.removeLayer(layer); });
                if (map) map.setView([20, 0], 2);
            }
        });
    }

    // 3. Geocoding Autocomplete Logic (NEW)
    if (locationInput) {
        let autocompleteTimeout;
        locationInput.addEventListener('input', () => {
            clearTimeout(autocompleteTimeout);
            autocompleteTimeout = setTimeout(async () => {
                const query = locationInput.value.trim();
                if (query.length > 3) {
                    await fetchLocationSuggestions(query);
                }
            }, 500); // Debounce
        });
    }
    
    async function fetchLocationSuggestions(query) {
        // Using Nominatim (OSM's service) - Requires CORS access which is often restricted
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
        try {
            const response = await fetch(url);
            const data = await response.json();

            if (data && data.length > 0) {
                const suggestion = data[0].display_name;
                // SIMULATION: Set the input's title to show the suggestion
                locationInput.title = `Suggested: ${suggestion}`;
            } else {
                locationInput.title = "No suggestions found.";
            }
        } catch (error) {
            console.error("Geocoding service access failed (CORS/Network error). Simulation needed:", error);
            // Fallback Simulation for Autocomplete Effect
             if ("london".startsWith(query.toLowerCase())) {
                 locationInput.title = "Suggested: London, UK";
             } else if ("new york".startsWith(query.toLowerCase())) {
                 locationInput.title = "Suggested: New York, USA";
             } else {
                 locationInput.title = "Type a city (e.g., London)";
             }
        }
    }

    // 4. MAP INITIALIZATION 
    function initMap() {
        if (map) {
            map.invalidateSize(); // Ensure map tiles load correctly
            return;
        }
        
        // Ensure Leaflet is loaded before initializing the map
        if (typeof L === 'undefined') {
            console.error("Leaflet not loaded. Check script links.");
            return;
        }

        map = L.map('map-container').setView([20, 0], 2); // Centered on the world

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        mapTraceInfo.innerHTML = '<p class="small-text verified">Map loaded successfully. Select a product to trace.</p>';
    }

    // 5. DATA LOADING AND RENDERING

    /**
     * Loads product IDs from the mock log data and populates the map selector.
     */
    function loadMapData() {
        mapProductSelect.innerHTML = '<option value="">--- Select a Product ID ---</option>';
        mapRouteSummary.innerHTML = '';
        if (map) map.eachLayer(layer => { if (layer instanceof L.Marker || layer instanceof L.Polyline) map.removeLayer(layer); });

        const productIds = Object.keys(window.MOCK_LOG_DATA || {});

        if (productIds.length === 0) {
             mapTraceInfo.innerHTML = '<p class="small-text fake">No traceable products found in the log data.</p>';
             return;
        }

        productIds.forEach(id => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = id;
            mapProductSelect.appendChild(option);
        });
        
        mapTraceInfo.innerHTML = `<p class="small-text verified">${productIds.length} traceable products loaded. Choose one to view the route.</p>`;
    }
    
    /**
     * Renders the simulated trace route on the map.
     */
    async function renderMapTrace(productId) {
        if (!map) return;
        
        mapTraceInfo.innerHTML = '<p class="small-text pending">Generating route visualization...</p>';
        map.eachLayer(layer => { if (layer instanceof L.Marker || layer instanceof L.Polyline) map.removeLayer(layer); }); 

        const history = await getProductHistory(productId); 

        if (history.length < 2) {
             mapRouteSummary.innerHTML = `<p class="small-text fake">Insufficient data to draw a map route (only ${history.length} events).</p>`;
             mapTraceInfo.innerHTML = `<p class="small-text fake">Product ${productId} requires more than one event to trace a journey.</p>`;
             map.setView([20, 0], 2);
             return;
        }
        
        // --- Mock Coordinates for Visualization (Pins) ---
        // This simulates geocoding the string location (BITS, FactoryA, etc.) to a coordinate.
        const mockCoordinatesMap = {
            "India-FactoryA": [28.6139, 77.2090], // Delhi, India
            "BITS": [28.3621, 73.8821], // BITS Pilani (approx)
            "Bits": [28.3621, 73.8821], 
            "DynamicFactory": [31.2304, 121.4737], // Shanghai, China
            "Return Center": [51.5074, 0.1278] // London, UK
        };

        let routePoints = [];

        history.forEach((event, index) => {
            // Use location string to get mock coordinates
            const locationKey = event.location.includes("Recipient") ? event.location.split(": ")[1] : event.location;
            const coords = mockCoordinatesMap[locationKey] || [0, 0];
            
            if (coords[0] !== 0) {
                routePoints.push(coords);

                // Add Marker to Map
                L.marker(coords)
                 .addTo(map)
                 .bindPopup(`<b>Stop ${index + 1}: ${event.action}</b><br>Location: ${event.location}<br>Time: ${event.timestamp}`)
                 .openPopup();
            }
        });
        
        // Draw Polyline (Route)
        if (routePoints.length >= 2) {
            L.polyline(routePoints, { color: 'red', weight: 4 }).addTo(map);

            // Fit map bounds to the drawn route
            map.fitBounds(routePoints, { padding: [50, 50] });
        }

        // Update Route Summary HTML
        let routeHtml = `
            <h4>Route Summary: ${history.length} Stops</h4>
            <ol>
                ${history.map((event, index) => 
                    `<li><strong>${event.action}</strong> at ${event.location} (${index === history.length - 1 ? 'Final Stop' : 'Waypoint'})</li>`
                ).join('')}
            </ol>
        `;
        
        mapRouteSummary.innerHTML = routeHtml;
        mapTraceInfo.innerHTML = `<p class="small-text verified">Route from <strong>${history[0].location}</strong> to <strong>${history[history.length - 1].location}</strong> displayed on map.</p>`;
    }


    /**
     * Handles the shipment transaction submission.
     */
    async function handleSubmitShipment() {
        if (!window.web3) {
            alert("Please connect your wallet first.");
            return;
        }

        const productId = shipIdInput.value.trim();
        const recipientName = recipientNameInput.value.trim();
        const recipientAddr = recipientAddressInput.value.trim();
        const locationDetail = locationInput.value.trim(); // NEW LOCATION DETAIL

        if (!productId || !recipientName || !recipientAddr || !locationDetail) {
            alert("All shipment fields are required.");
            return;
        }

        shipmentStatus.textContent = "Submitting transaction to testnet (check wallet)...";
        shipmentStatus.className = 'small-text pending';
        transactionHashDisplay.textContent = "";

        try {
            const mockTxHash = '0x' + Math.random().toString(16).substring(2, 64);
            
            setTimeout(() => {
                 // The locationDetail is passed to the log update simulation
                 window.simulateLogUpdate(productId, recipientName, locationDetail, mockTxHash);

                 shipmentStatus.textContent = "SUCCESS: Product Marked Delivered!";
                 shipmentStatus.className = 'small-text verified';
                 transactionHashDisplay.textContent = `Tx Hash: ${mockTxHash.substring(0, 15)}...`;

                 alert(`Transaction completed! Use ID ${productId} to verify in the Verification tab.`);
            }, 2000); 

        } catch (error) {
            console.error("Transaction Error:", error);
            shipmentStatus.textContent = "ERROR: Transaction failed. See console.";
            shipmentStatus.className = 'small-text fake';
        }
    }


    /**
     * Handles the full product verification process.
     */
    async function handleVerification() {
        const productId = idInput.value.trim();
        if (!productId) {
            alert("Please enter a valid Product ID.");
            return;
        }

        authStatus.textContent = "Verifying...";
        authStatus.className = 'status-message pending';
        timelineContainer.innerHTML = '<p class="placeholder-text">Loading...</p>';
        
        // Reset Log Details
        detailRecipient.textContent = 'N/A';
        detailOwnerAddr.textContent = 'N/A';
        detailTxHash.textContent = 'N/A';
        qrPlaceholder.innerHTML = '<i class="fas fa-qrcode"></i> QR Code Placeholder';

        try {
            const details = await getProductDetails(productId);
            const logs = getTransactionLog(productId); 

            if (details && details[0]) {
                const [id, batch, factory, owner, delivered, replaced] = details;

                // --- 1. Update Authenticity Status ---
                authStatus.textContent = `AUTHENTIC: Traced to Factory ${factory}`;
                authStatus.className = 'status-message verified';
                if (replaced) {
                    authStatus.textContent += " (WARNING: Returned)";
                }

                // --- 2. Update Transaction/Log Details ---
                if (logs) {
                    detailRecipient.textContent = logs.delivery_info.recipient;
                    detailOwnerAddr.textContent = logs.delivery_info.address.substring(0, 15) + '...';
                    detailTxHash.textContent = logs.tx_hash.substring(0, 15) + '...';
                    
                    // Display QR Code
                    const qrData = logs.qr_code_file.replace('_qrcode.png', ''); 
                    qrPlaceholder.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrData}" alt="QR Code for ${id}">`;
                }

                // --- 3. Render Timeline ---
                const history = await getProductHistory(productId);
                renderTimeline(history);

            } else {
                // Product Not Found
                authStatus.textContent = "FAKE/INVALID: No Immutable Record Found";
                authStatus.className = 'status-message fake';

                timelineContainer.innerHTML = '<p class="placeholder-text">No verifiable history exists for this ID.</p>';
            }

        } catch (error) {
            console.error("Verification error:", error);
            authStatus.textContent = "ERROR: Could not perform verification.";
            authStatus.className = 'status-message fake';
        }
    }

    /**
     * Switches the active content view and updates the sidebar navigation state.
     */
    function switchView(viewId, activeNavItem) {
        navItems.forEach(nav => nav.classList.remove('active'));
        contentViews.forEach(view => view.classList.remove('active'));
        
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }

        const targetView = document.getElementById(viewId);
        if (targetView) {
            targetView.classList.add('active');
        }
    }

    /**
     * Renders the product journey.
     */
    function renderTimeline(history) {
        timelineContainer.innerHTML = '';
        if (history.length === 0) {
             timelineContainer.innerHTML = '<p class="placeholder-text">No traceable events.</p>';
             return;
        }

        history.forEach(event => { 
            const item = document.createElement('div');
            item.className = 'timeline-item';
            
            let iconClass = 'fas fa-info-circle';
            if (event.action.includes('Registered')) iconClass = 'fas fa-factory';
            else if (event.action.includes('Delivered')) iconClass = 'fas fa-truck';
            else if (event.action.includes('Returned')) iconClass = 'fas fa-undo-alt';

            item.innerHTML = `
                <div class="timeline-item-icon"><i class="${iconClass}"></i></div>
                <div class="timeline-item-content">
                    <div class="timeline-item-date">${event.timestamp}</div>
                    <div class="timeline-item-title">${event.action}</div>
                    <p class="small-text">Location: ${event.location}</p>
                </div>
            `;
            timelineContainer.appendChild(item);
        });
    }
    
    // Initial connection attempt on load
    connectWallet();
});