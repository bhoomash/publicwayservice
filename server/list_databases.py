"""
List all MongoDB databases and collections
"""
from pymongo import MongoClient

# Connect to MongoDB
client = MongoClient("mongodb://localhost:27017/")

print("=" * 60)
print("MongoDB Databases:")
print("=" * 60)

for db_name in client.list_database_names():
    print(f"\n📁 {db_name}")
    db = client[db_name]
    collections = db.list_collection_names()
    if collections:
        for coll in collections:
            count = db[coll].count_documents({})
            print(f"   📄 {coll}: {count} documents")
    else:
        print("   (no collections)")

print("\n" + "=" * 60)
