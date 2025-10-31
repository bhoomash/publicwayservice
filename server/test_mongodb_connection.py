"""Test MongoDB connection"""
import os
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
import socket

load_dotenv()

def test_dns():
    """Test DNS resolution"""
    print("\n" + "=" * 80)
    print("1. Testing DNS Resolution")
    print("=" * 80)
    
    hostname = "ac-ypkq8hx-shard-00-01.6nn48yr.mongodb.net"
    
    try:
        ip = socket.gethostbyname(hostname)
        print(f"✅ DNS Resolution: SUCCESS")
        print(f"   Hostname: {hostname}")
        print(f"   IP Address: {ip}")
        return True
    except socket.gaierror as e:
        print(f"❌ DNS Resolution: FAILED")
        print(f"   Hostname: {hostname}")
        print(f"   Error: {e}")
        return False

def test_internet():
    """Test internet connectivity"""
    print("\n" + "=" * 80)
    print("2. Testing Internet Connectivity")
    print("=" * 80)
    
    try:
        # Try to resolve google.com
        socket.gethostbyname("google.com")
        print(f"✅ Internet: CONNECTED")
        return True
    except socket.gaierror:
        print(f"❌ Internet: DISCONNECTED")
        print(f"   Please check your internet connection")
        return False

def test_mongodb_connection():
    """Test MongoDB connection"""
    print("\n" + "=" * 80)
    print("3. Testing MongoDB Connection")
    print("=" * 80)
    
    mongo_uri = os.getenv("MONGO_URI")
    
    if not mongo_uri:
        print("❌ MONGO_URI not found in .env file")
        return False
    
    print(f"📝 Using URI: {mongo_uri[:50]}...")
    
    try:
        # Create client with shorter timeout for testing
        client = MongoClient(
            mongo_uri,
            serverSelectionTimeoutMS=10000,  # 10 seconds
            connectTimeoutMS=10000
        )
        
        # Test connection
        print("   Attempting to connect...")
        client.admin.command('ping')
        
        print(f"✅ MongoDB: CONNECTED")
        
        # List databases
        db_names = client.list_database_names()
        print(f"   Available databases: {db_names}")
        
        # Check specific database
        db_name = os.getenv("DB_NAME", "grievancebot")
        db = client[db_name]
        collections = db.list_collection_names()
        print(f"   Collections in '{db_name}': {collections}")
        
        client.close()
        return True
        
    except ServerSelectionTimeoutError as e:
        print(f"❌ MongoDB: CONNECTION TIMEOUT")
        print(f"   Error: Server selection timeout")
        print(f"   This usually means:")
        print(f"   - No internet connection")
        print(f"   - MongoDB Atlas cluster is paused")
        print(f"   - IP address not whitelisted in Atlas")
        return False
    except ConnectionFailure as e:
        print(f"❌ MongoDB: CONNECTION FAILED")
        print(f"   Error: {e}")
        return False
    except Exception as e:
        print(f"❌ MongoDB: ERROR")
        print(f"   Error: {e}")
        return False

def main():
    print("\n" + "=" * 80)
    print("🔍 MONGODB CONNECTION DIAGNOSTIC")
    print("=" * 80)
    
    # Test DNS
    dns_ok = test_dns()
    
    if not dns_ok:
        # If DNS fails, test general internet
        internet_ok = test_internet()
        
        if not internet_ok:
            print("\n" + "=" * 80)
            print("⚠️  DIAGNOSIS: NO INTERNET CONNECTION")
            print("=" * 80)
            print("\nPossible solutions:")
            print("1. Check your internet connection")
            print("2. Check if you're behind a firewall or proxy")
            print("3. Try disconnecting and reconnecting to WiFi")
            return
        else:
            print("\n" + "=" * 80)
            print("⚠️  DIAGNOSIS: DNS RESOLUTION FAILED")
            print("=" * 80)
            print("\nPossible solutions:")
            print("1. Your ISP's DNS might be blocking MongoDB Atlas")
            print("2. Try using Google DNS (8.8.8.8, 8.8.4.4)")
            print("3. Try using Cloudflare DNS (1.1.1.1)")
            print("4. Check Windows DNS cache: ipconfig /flushdns")
            return
    
    # Test MongoDB
    mongodb_ok = test_mongodb_connection()
    
    if mongodb_ok:
        print("\n" + "=" * 80)
        print("✅ DIAGNOSIS: ALL SYSTEMS OPERATIONAL")
        print("=" * 80)
        print("\nYour MongoDB connection is working!")
    else:
        print("\n" + "=" * 80)
        print("⚠️  DIAGNOSIS: MONGODB CONNECTION FAILED")
        print("=" * 80)
        print("\nPossible solutions:")
        print("1. Check MongoDB Atlas cluster status (might be paused)")
        print("2. Verify IP whitelist in MongoDB Atlas:")
        print("   - Go to Network Access in Atlas")
        print("   - Add your current IP or use 0.0.0.0/0 for testing")
        print("3. Wait a few minutes and try again")
        print("4. Check if the cluster is in the same region")

if __name__ == "__main__":
    main()
