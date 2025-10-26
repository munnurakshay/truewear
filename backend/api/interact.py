import os
import json
import qrcode
from web3 import Web3
from dotenv import load_dotenv
from datetime import datetime, timezone

# Load environment variables
load_dotenv()

INFURA_URL = os.getenv("SEPOLIA_RPC_URL")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS")

# --- Validate Environment Variables ---
if not INFURA_URL or not PRIVATE_KEY or not CONTRACT_ADDRESS:
    print("❌ Missing one or more required .env values.")
    print("Make sure your .env has:")
    print("SEPOLIA_RPC_URL, PRIVATE_KEY, CONTRACT_ADDRESS")
    exit()

# --- Connect to Ethereum Node ---
w3 = Web3(Web3.HTTPProvider(INFURA_URL))
if not w3.is_connected():
    print(f"❌ Unable to connect to Ethereum node at {INFURA_URL}")
    exit()

print("✅ Connected to Ethereum Sepolia Testnet")

# --- Load Contract ABI ---
with open("../TrueWear_abi.json") as f:
    abi = json.load(f)

contract = w3.eth.contract(address=Web3.to_checksum_address(CONTRACT_ADDRESS), abi=abi)
account = w3.eth.account.from_key(PRIVATE_KEY)
chain_id = w3.eth.chain_id
LOG_FILE = "products_log.json"

# --- Helper functions for log management ---
def load_logs():
    if os.path.exists(LOG_FILE):
        with open(LOG_FILE, "r") as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                return []
    return []

def save_logs(logs):
    with open(LOG_FILE, "w") as f:
        json.dump(logs, f, indent=4)

# --- Main product registration ---
def register_product(product_id, delivery_info, replacement_info):
    try:
        print("\n🚀 Building transaction...")
        txn = contract.functions.registerProduct(
            product_id,
            json.dumps(delivery_info),
            json.dumps(replacement_info)
        ).build_transaction({
            "chainId": chain_id,
            "from": account.address,
            "nonce": w3.eth.get_transaction_count(account.address),
            "gasPrice": w3.eth.gas_price
        })

        # --- Sign & Send Transaction ---
        signed_txn = w3.eth.account.sign_transaction(txn, private_key=PRIVATE_KEY)
        tx_hash = w3.eth.send_raw_transaction(signed_txn.raw_transaction)
        print(f"🕒 Transaction sent! Waiting for confirmation...")

        # --- Wait for confirmation ---
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        block_number = receipt.blockNumber
        status = "Success" if receipt.status == 1 else "Failed"
        block_details = w3.eth.get_block(block_number)
        timestamp = datetime.fromtimestamp(block_details.timestamp, tz=timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

        print(f"\n✅ Product registered successfully!")
        print(f"🔗 Transaction Hash: {tx_hash.hex()}")
        print(f"📦 Confirmed in Block: {block_number}")
        print(f"🌐 View on Etherscan: https://sepolia.etherscan.io/tx/{tx_hash.hex()}")

        # --- Generate QR Code ---
        qr_data = f"Product ID: {product_id}\nTX Hash: {tx_hash.hex()}\nEtherscan: https://sepolia.etherscan.io/tx/{tx_hash.hex()}"
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(qr_data)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        qr_filename = f"{product_id}_qrcode.png"
        img.save(qr_filename)
        print(f"🧾 QR Code saved as: {qr_filename}")

        # --- Log Transaction to products_log.json ---
        logs = load_logs()
        logs.append({
            "timestamp": timestamp,
            "product_id": product_id,
            "delivery_info": delivery_info,
            "replacement_info": replacement_info,
            "tx_hash": tx_hash.hex(),
            "block_number": block_number,
            "status": status,
            "etherscan_link": f"https://sepolia.etherscan.io/tx/{tx_hash.hex()}",
            "qr_code_file": qr_filename
        })
        save_logs(logs)
        print(f"💾 Transaction logged successfully in {LOG_FILE}")

        return tx_hash.hex()

    except Exception as e:
        if "Product already exists" in str(e):
            print(f"❌ Product {product_id} already exists on the blockchain.")
        else:
            print("❌ Error registering product:", str(e))


# --- Example Usage ---
if __name__ == "__main__":
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    product_id = f"P{timestamp}"

    delivery_info = {
        "recipient": input("Enter Recipient Name: ") or "John Doe",
        "address": input("Enter Delivery Address: ") or "123 Main St, Hyderabad",
        "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    }

    replacement_info = {
        "status": "None",
        "timestamp": ""
    }

    print(f"\n📦 Registering new product ID: {product_id}")
    register_product(product_id, delivery_info, replacement_info)
