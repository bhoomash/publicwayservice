#!/usr/bin/env python3
"""
Test script for reports API endpoints
"""
import asyncio
import aiohttp
import json
from datetime import datetime

async def test_reports_api():
    """Test the reports API endpoints"""
    base_url = "http://localhost:8000"
    
    # First, let's try to login as admin to get a token
    async with aiohttp.ClientSession() as session:
        # Login first
        login_data = {
            "email": "anirudh200503@gmail.com",
            "password": "admin123"
        }
        
        try:
            print("🔐 Testing admin login...")
            async with session.post(f"{base_url}/auth/admin/login", json=login_data) as response:
                if response.status == 200:
                    login_result = await response.json()
                    token = login_result.get('access_token')
                    print(f"✅ Login successful! Token: {token[:20]}...")
                    
                    # Set up headers with token
                    headers = {"Authorization": f"Bearer {token}"}
                    
                    # Test dashboard stats
                    print("\n📊 Testing dashboard stats...")
                    async with session.get(f"{base_url}/admin/dashboard/stats", headers=headers) as response:
                        if response.status == 200:
                            stats = await response.json()
                            print(f"✅ Dashboard stats: {json.dumps(stats, indent=2)}")
                        else:
                            print(f"❌ Dashboard stats failed: {response.status}")
                    
                    # Test reports endpoint
                    current_year = datetime.now().year
                    print(f"\n📈 Testing reports endpoint for year {current_year}...")
                    async with session.get(f"{base_url}/admin/reports?year={current_year}&period=month", headers=headers) as response:
                        if response.status == 200:
                            reports = await response.json()
                            print(f"✅ Reports data: {json.dumps(reports, indent=2)}")
                        else:
                            print(f"❌ Reports failed: {response.status}")
                            error_text = await response.text()
                            print(f"Error details: {error_text}")
                    
                    # Test export report
                    print(f"\n📋 Testing export report...")
                    async with session.get(f"{base_url}/admin/reports/export?year={current_year}&period=month", headers=headers) as response:
                        if response.status == 200:
                            print(f"✅ Export successful! Content-Type: {response.headers.get('content-type')}")
                        else:
                            print(f"❌ Export failed: {response.status}")
                            error_text = await response.text()
                            print(f"Error details: {error_text}")
                            
                else:
                    print(f"❌ Login failed: {response.status}")
                    error_text = await response.text()
                    print(f"Error details: {error_text}")
                    
        except Exception as e:
            print(f"❌ Error during API test: {str(e)}")

if __name__ == "__main__":
    print("🧪 Testing Reports API Endpoints")
    print("=" * 50)
    asyncio.run(test_reports_api())