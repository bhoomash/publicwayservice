from pymongo import MongoClient
from .config import MONGO_URI, DB_NAME

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

# Collections
users_collection = db["users"]
otp_collection = db["otp_codes"]
complaints_collection = db["complaints"]

# Create indexes for better performance (only if they don't exist)
try:
    # Check if index exists before creating
    existing_indexes = users_collection.list_indexes()
    index_names = [index['name'] for index in existing_indexes]
    
    if 'email_1' not in index_names:
        users_collection.create_index("email", unique=True)
    
    # Create other indexes
    otp_collection.create_index("email")
    otp_collection.create_index("expires_at", expireAfterSeconds=0)
except Exception as e:
    # If there are duplicate emails, we need to clean them up
    print(f"Database index creation warning: {e}")
    print("Note: You may need to clean up duplicate emails in the database") 