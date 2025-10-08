import requests
import json

def test_authenticated_api():
    """Test the dashboard API with proper authentication"""
    
    # Try admin login first
    admin_login_url = "http://localhost:8000/auth/admin-login"
    login_data = {
        "email": "anirudh200503@gmail.com",
        "password": "Anirudh123@" 
    }
    
    try:
        print("🔐 Trying admin login...")
        admin_response = requests.post(admin_login_url, json=login_data)
        print(f"Admin Login Status: {admin_response.status_code}")
        print(f"Admin Response: {admin_response.text}")
        
        if admin_response.status_code == 200:
            admin_result = admin_response.json()
            token = admin_result.get('access_token')
            print(f"✅ Admin login successful")
        else:
            # Try regular login
            print("\n🔐 Trying regular login...")
            login_url = "http://localhost:8000/auth/login-json"
            login_response = requests.post(login_url, json=login_data)
            print(f"Login Status: {login_response.status_code}")
            print(f"Login Response: {login_response.text}")
            
            if login_response.status_code == 200:
                login_result = login_response.json()
                token = login_result.get('access_token')
                print(f"✅ Regular login successful")
            else:
                print("❌ Both login methods failed")
                return
        
        # Now test dashboard stats with different time periods
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        time_periods = ['today', 'week', 'month', 'year']
        
        for period in time_periods:
            dashboard_url = f"http://localhost:8000/admin/dashboard-stats?period={period}"
            
            print(f"\n📊 Testing dashboard stats API for period: {period}")
            dashboard_response = requests.get(dashboard_url, headers=headers)
            print(f"Dashboard Status: {dashboard_response.status_code}")
            
            if dashboard_response.status_code == 200:
                data = dashboard_response.json()
                print(f"✅ Dashboard API working for {period}!")
                print(f"🔍 Key counts for {period}:")
                print(f"  Total Complaints: {data.get('totalComplaints', 'NOT_FOUND')}")
                print(f"  Total Users: {data.get('totalUsers', 'NOT_FOUND')}")
                print(f"  Pending: {data.get('pendingComplaints', 'NOT_FOUND')}")
                print(f"  High Priority: {data.get('highPriorityComplaints', 'NOT_FOUND')}")
                print(f"  Recent Complaints: {len(data.get('recentComplaints', []))}")
                
                if data.get('totalComplaints', 0) > 0:
                    print(f"🎯 Found data with {period} period!")
                    
                    # Show recent complaints details
                    recent = data.get('recentComplaints', [])
                    if recent:
                        print(f"\n📝 Recent complaints details:")
                        for i, complaint in enumerate(recent[:3], 1):
                            title = complaint.get('title') or complaint.get('message', 'No title')
                            status = complaint.get('status', 'unknown')
                            priority = complaint.get('priority', 'unknown')
                            created = complaint.get('created_at') or complaint.get('submitted_date', 'unknown')
                            print(f"  {i}. {title[:50]}...")
                            print(f"     Status: {status}, Priority: {priority}")
                            print(f"     Created: {created}")
                    break
                
            else:
                print(f"❌ Dashboard API failed for {period}: {dashboard_response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_authenticated_api()