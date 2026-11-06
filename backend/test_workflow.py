"""
Test script to verify the complete workflow
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_workflow():
    print("🧪 Testing ArogyaMitra Workflow\n")
    
    # 1. Register a test user
    print("1️⃣ Registering test user...")
    register_data = {
        "email": "test@example.com",
        "username": "testuser",
        "password": "test123",
        "full_name": "Test User"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/auth/register", json=register_data)
        if response.status_code == 200:
            print("✅ Registration successful")
        else:
            print(f"⚠️ Registration response: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Registration failed: {e}")
        return
    
    # 2. Login
    print("\n2️⃣ Logging in...")
    login_data = {
        "username": register_data["username"],
        "password": register_data["password"]
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
        if response.status_code == 200:
            token = response.json()["access_token"]
            print(f"✅ Login successful, token: {token[:20]}...")
            headers = {"Authorization": f"Bearer {token}"}
        else:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return
    except Exception as e:
        print(f"❌ Login failed: {e}")
        return
    
    # 3. Submit health assessment
    print("\n3️⃣ Submitting health assessment...")
    assessment_data = {
        "age": 25,
        "gender": "Male",
        "height": 175,
        "weight": 70,
        "fitness_level": "beginner",
        "fitness_goal": "muscle_gain",
        "workout_preference": "home",
        "workout_time_preference": "Morning"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/health-assessment/assessment/submit", json=assessment_data, headers=headers)
        if response.status_code == 200:
            print(f"✅ Assessment submitted: {response.json()}")
        else:
            print(f"❌ Assessment failed: {response.status_code} - {response.text}")
            return
    except Exception as e:
        print(f"❌ Assessment failed: {e}")
        return
    
    # 4. Generate workout plan
    print("\n4️⃣ Generating workout plan...")
    try:
        response = requests.post(f"{BASE_URL}/api/workouts/generate", headers=headers)
        if response.status_code == 200:
            plan = response.json()
            print(f"✅ Workout plan generated with {len(plan.get('plan', {}).get('days', []))} days")
        else:
            print(f"❌ Workout generation failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Workout generation failed: {e}")
    
    # 5. Generate nutrition plan
    print("\n5️⃣ Generating nutrition plan...")
    nutrition_data = {
        "calorie_target": 2000,
        "diet_type": "vegetarian",
        "allergies": ""
    }
    try:
        response = requests.post(f"{BASE_URL}/api/nutrition/generate", json=nutrition_data, headers=headers)
        if response.status_code == 200:
            print(f"✅ Nutrition plan generated")
        else:
            print(f"❌ Nutrition generation failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Nutrition generation failed: {e}")
    
    # 6. Get current workout plan
    print("\n6️⃣ Fetching current workout plan...")
    try:
        response = requests.get(f"{BASE_URL}/api/workouts/current", headers=headers)
        if response.status_code == 200:
            print(f"✅ Current workout plan retrieved")
        else:
            print(f"❌ Failed to get workout plan: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Failed to get workout plan: {e}")
    
    # 7. Get current nutrition plan
    print("\n7️⃣ Fetching current nutrition plan...")
    try:
        response = requests.get(f"{BASE_URL}/api/nutrition/current", headers=headers)
        if response.status_code == 200 or response.status_code == 404:
            print(f"✅ Nutrition endpoint working (status: {response.status_code})")
        else:
            print(f"❌ Failed to get nutrition plan: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Failed to get nutrition plan: {e}")
    
    print("\n✅ Workflow test complete!")

if __name__ == "__main__":
    test_workflow()
