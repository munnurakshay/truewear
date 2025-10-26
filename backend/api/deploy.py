from solcx import compile_standard, install_solc
from web3 import Web3
import json, os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
RPC_URL = os.getenv("SEPOLIA_RPC_URL")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")

# Install Solidity compiler
install_solc("0.8.20")

# Read Solidity contract
with open("TrueWear.sol", "r") as file:
    source = file.read()

# Compile Solidity contract
compiled_sol = compile_standard({
    "language": "Solidity",
    "sources": {"TrueWear.sol": {"content": source}},
    "settings": {"outputSelection": {"*": {"*": ["abi", "evm.bytecode"]}}}
}, solc_version="0.8.20")

# Extract ABI and bytecode
bytecode = compiled_sol["contracts"]["TrueWear.sol"]["TrueWear"]["evm"]["bytecode"]["object"]
abi = compiled_sol["contracts"]["TrueWear.sol"]["TrueWear"]["abi"]

# Save ABI to file
with open("TrueWear_abi.json", "w") as f:
    json.dump(abi, f, indent=4)

# Connect to Ethereum node
w3 = Web3(Web3.HTTPProvider(RPC_URL))
assert w3.is_connected(), "❌ Connection failed"

chain_id = 11155111  # Sepolia chain ID
account = w3.eth.account.from_key(PRIVATE_KEY)
nonce = w3.eth.get_transaction_count(account.address)

# Deploy contract
TrueWear = w3.eth.contract(abi=abi, bytecode=bytecode)
transaction = TrueWear.constructor().build_transaction({
    "chainId": chain_id,
    "from": account.address,
    "nonce": nonce,
    "gasPrice": w3.eth.gas_price
})

# Sign & send transaction
signed_txn = w3.eth.account.sign_transaction(transaction, PRIVATE_KEY)
tx_hash = w3.eth.send_raw_transaction(signed_txn.raw_transaction)
print(f"Deploying contract... TX hash: {tx_hash.hex()}")

# Wait for deployment receipt
tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
print("✅ Contract deployed at address:", tx_receipt.contractAddress)
print("Update your .env CONTRACT_ADDRESS with this address")
