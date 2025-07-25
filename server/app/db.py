from pymongo import MongoClient
from .config import MONGO_URI, DB_NAME

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
complaints_collection = db["complaints"]
users_collection = db["users"] 