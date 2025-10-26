// ====================================================================
// FILENAME: web3_config.js
// FUNCTION: Defines contract address, ABI, and handles Web3 connection.
// ====================================================================

// --- 1. Contract Constants (PLACEHOLDERS) ---
const TRUWEAR_CONTRACT_ADDRESS = "0x4A5dFFb678c123456789C01234567890B"; 

// SIMULATED ABI - Ensure these match your Truewear.sol
const TRUWEAR_ABI = [
    {"inputs":[{"internalType":"string","name":"_productId","type":"string"},{"internalType":"string","name":"_batch","type":"string"},{"internalType":"string","name":"_factory","type":"string"}],"name":"registerProduct","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"internalType":"string","name":"_productId","type":"string"},{"internalType":"string","name":"_owner","type":"string"}],"name":"markDelivered","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"internalType":"string","name":"_productId","type":"string"}],"name":"markReplaced","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"internalType":"string","name":"_productId","type":"string"}],"name":"getProduct","outputs":[{"internalType":"string","name":"","type":"string"},{"internalType":"string","name":"","type":"string"},{"internalType":"string","name":"","type":"string"},{"internalType":"string","name":"","type":"string"},{"internalType":"bool","name":"","type":"bool"},{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"getAllProducts","outputs":[{"internalType":"string[]","name":"","type":"string[]"}],"stateMutability":"view","type":"function"}
];

let web3;
let truewearContract;
let selectedAccount;

// --- MOCK LOG DATA STORAGE (Dynamic for simulation) ---
const MOCK_LOG_DATA = {
    // Default Verification ID from user's logs
    "P20251025202605": {
        tx_hash: "0901524b0c06fa31159614d0770a04aa0062f70c606c6c9c39c7ea8a2f7f68e9",
        delivery_info: { recipient: "Varun", address: "BITS", timestamp: "2025-10-25 20:26:17 UTC" },
        replacement_info: { status: "None" },
        qr_code_file: "P20251025202605_qrcode.png",
        contractData: ["P20251025202605", "B001-ALPHA", "India-FactoryA", "BITS", true, false]
    },
    // Second entry from user's logs
    "P20251025210653": {
        tx_hash: "0986ff8db51317cc942be98dcf765e9d0d64ee82aab6ad8dda518828cb53b2ff",
        delivery_info: { recipient: "Akshay", address: "Bits", timestamp: "2025-10-25 21:07:08 UTC" },
        replacement_info: { status: "None" },
        qr_code_file: "P20251025210653_qrcode.png",
        contractData: ["P20251025210653", "B001-ALPHA", "India-FactoryA", "Bits", true, false]
    }
    // New entries added dynamically by simulateLogUpdate
};
// --- END MOCK LOG DATA ---


// --- 2. Connection Logic ---

async function connectWallet() {
    const statusElement = document.getElementById('wallet-status');
    statusElement.textContent = "Connecting...";
    statusElement.className = 'pending';

    if (window.ethereum) {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            selectedAccount = accounts[0];
            
            web3 = new Web3(window.ethereum);
            truewearContract = new web3.eth.Contract(TRUWEAR_ABI, TRUWEAR_CONTRACT_ADDRESS);

            statusElement.textContent = `Connected: ${selectedAccount.substring(0, 6)}...`;
            statusElement.className = 'connected';
            document.getElementById('connect-wallet-btn').disabled = true;

            return true;
        } catch (error) {
            console.error("Connection failed:", error);
            statusElement.textContent = "Disconnected";
            statusElement.className = 'disconnected';
            return false;
        }
    } else {
        statusElement.textContent = "No MetaMask";
        statusElement.className = 'disconnected';
        return false;
    }
}

// --- 3. Contract Interaction Functions ---

async function getProductDetails(productId) {
    if (MOCK_LOG_DATA[productId]) {
        return MOCK_LOG_DATA[productId].contractData;
    }
    
    if (!truewearContract) return null;
    
    try {
        const details = await truewearContract.methods.getProduct(productId).call();
        return details;
    } catch (error) {
        return null;
    }
}

function getTransactionLog(productId) {
    return MOCK_LOG_DATA[productId] || null;
}

async function getProductHistory(productId) {
    const details = await getProductDetails(productId); 
    const log = getTransactionLog(productId); 

    if (!details) return [];

    const [id, batch, factory, owner, delivered, replaced] = details;

    let history = [
        {location: factory, timestamp: "2025-10-24 10:00:00 UTC", action: `Product Registered (Batch: ${batch})`},
    ];

    if (delivered && log) {
        history.push({location: log.delivery_info.address, timestamp: log.delivery_info.timestamp, action: `Marked Delivered to Recipient: ${log.delivery_info.recipient}`});
    }
    
    if (replaced) {
        history.push({location: "Return Center", timestamp: "2025-10-20 15:00:00 UTC", action: "Marked Replaced/Returned"});
    }

    return history;
}

// --- 4. NEW SIMULATION FUNCTION ---

function simulateLogUpdate(productId, recipientName, recipientAddr, txHash) {
    const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, ' UTC');

    MOCK_LOG_DATA[productId] = {
        tx_hash: txHash,
        product_id: productId,
        timestamp: timestamp,
        delivery_info: { 
            recipient: recipientName, 
            address: recipientAddr, 
            timestamp: timestamp 
        },
        replacement_info: { status: "None" },
        qr_code_file: `${productId}_qrcode.png`,
        // Simulate contract data
        contractData: [productId, "B003-NEW", "DynamicFactory", recipientAddr, true, false]
    };
}

// Export functions
window.connectWallet = connectWallet;
window.getProductDetails = getProductDetails;
window.getProductHistory = getProductHistory;
window.getTransactionLog = getTransactionLog; 
window.simulateLogUpdate = simulateLogUpdate; 
window.TRUWEAR_CONTRACT_ADDRESS = TRUWEAR_CONTRACT_ADDRESS;
window.MOCK_LOG_DATA = MOCK_LOG_DATA;