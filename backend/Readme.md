# Blockchain Loan DApp

# 1. Install dependencies
pip install -r requirements.txt

# 2. Check Sepolia Testnet connection
python test_connection.py
# (Checks if connection to blockchain network is working)

# 3. If using a new laptop or environment
pip install -r requirements.txt
# (Reinstalls all required Python packages)

# 4. Deploy smart contract
python deploy.py
# (Deploys the loan contract to Sepolia testnet)

# 5. Send ETH transaction
python send_eth.py
# (Transfers ETH between accounts for testing)

# 6. View transaction history
python view_logs.py
# (Shows previous blockchain transactions and logs)
