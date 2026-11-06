#!/usr/bin/env python3
"""
Quick test script to verify all ArogyaMitra endpoints are functional.
Run this to check if backend is working correctly.
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

def test_endpoint(method, endpoint, data=None, token=None, description=""):
    """Test a single endpoint"""
    url = f"{BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=5)
        elif method == "POST":
            response = requests.post(url, json=data, headers=headers, timeout=5)
        elif method == "PUT":
            response = requests.put(url, json=data, headers=headers, timeout=5)
        
        status = "✅" if response.status_code < 400 else "❌"
        print(f"{status} {method:4} {endpoint:50} [{response.status_code}] {description}")
        return response
    except Exception as e:
        print(f"❌ {method:4} {endpoint:50} [ERROR] {str(e)}")
        return None

def main():
    print("\n" + "="*80)
    print("🧪 ArogyaMitra Backend Functionality Test")
    print("="*80 + "\n")
    
    # Test root endpoint
    print("📍 Testing Root Endpoint:")
    test_endpoint("GET", "/", description="API health check")
    
    # Test auth endpoints (no token needed)
    print("\n📍 Testing Auth Endpoints (Public):")
    test_endpoint("POST", "/api/auth/register", 
                  data={
                      "email": f"test_{datetime.now().timestamp()}@test.com",
                      "username": f"testuser_{int(datetime.now().timestamp())}",
                      "password": "testpass123",
                      "full_name": "Test User"
                  },
                  description="Register new user")
    
    # Login to get token
    print("\n📍 Getting Auth Token:")
    login_response = test_endpoint("POST", "/api/auth/login",
                                   data={"username": "test@test.com", "password": "test123"},
                                   description="Login (may fail if user doesn't exist)")
    
    token = None
    if login_response and login_response.status_code == 200:
        token = login_response.json().get("access_token")
        print(f"   🔑 Token obtained: {token[:20]}...")
    else:
        print("   ⚠️  No token - protected endpoints will fail")
    
    # Test protected endpoints
    print("\n📍 Testing Protected Endpoints:")
    test_endpoint("GET", "/api/auth/me", token=token, description="Get current user")
    
    print("\n📍 Testing Workout Endpoints:")
    test_endpoint("GET", "/api/workouts/current", token=token, description="Get current workout plan")
    test_endpoint("GET", "/api/workouts/today", token=token, description="Get today's workout")
    test_endpoint("POST", "/api/workouts/generate", token=token, description="Generate new workout plan")
    
    print("\n📍 Testing Nutrition Endpoints:")
    test_endpoint("GET", "/api/nutrition/current", token=token, description="Get current nutrition plan")
    test_endpoint("GET", "/api/nutrition/today", token=token, description="Get today's meals")
    
    print("\n📍 Testing Progress Endpoints:")
    test_endpoint("GET", "/api/progress/summary", token=token, description="Get progress summary")
    test_endpoint("GET", "/api/progress/achievements", token=token, description="Get achievements")
    
    print("\n📍 Testing AI Coach Endpoints:")
    test_endpoint("POST", "/api/aromi-chat", 
                  data={"message": "Hello AROMI!", "conversation_history": []},
                  token=token,
                  description="Chat with AROMI")
    
    print("\n📍 Testing Calendar Endpoints:")
    test_endpoint("GET", "/api/integrations/calendar/auth-url", token=token, description="Get Google Calendar auth URL")
    
    print("\n📍 Testing Health Assessment:")
    test_endpoint("GET", "/api/health-assessment/assessment/latest", token=token, description="Get latest assessment")
    
    print("\n" + "="*80)
    print("✅ Test Complete!")
    print("="*80 + "\n")
    
    print("📝 Notes:")
    print("   - Some endpoints may return 404 if no data exists yet")
    print("   - 401 errors mean authentication is required")
    print("   - 500 errors indicate server issues")
    print("   - Create a user account first to test protected endpoints")
    print("\n")

if __name__ == "__main__":
    main()
