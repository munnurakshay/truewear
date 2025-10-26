from web3 import Web3
from dotenv import load_dotenv
import os

load_dotenv()
INFURA_URL = os.getenv("INFURA_URL")

w3 = Web3(Web3.HTTPProvider(INFURA_URL))
print("Connected:", w3.is_connected())
