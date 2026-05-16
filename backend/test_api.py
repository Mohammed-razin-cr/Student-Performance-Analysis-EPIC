"""
Test script to verify backend API is working correctly
"""
import requests
import json

API_URL = "http://localhost:5000"

def test_health():
    """Test health endpoint"""
    print("Testing /api/health endpoint...")
    try:
        response = requests.get(f"{API_URL}/api/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check passed: {data}")
            return True
        else:
            print(f"❌ Health check failed with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_prediction():
    """Test prediction endpoint"""
    print("\nTesting /api/predict endpoint...")
    
    # Sample student data
    test_data = {
        "cgpa": 8.5,
        "credits": 120,
        "extraCurricular": 3,
        "projects": 4,
        "selfStudy": 5,
        "assignment": 0.9,
        "engagement": 8,
        "contribution": 7
    }
    
    try:
        response = requests.post(
            f"{API_URL}/api/predict",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Prediction successful!")
            print(f"   Grade: {result['prediction']['grade']}")
            print(f"   Pass Probability: {result['prediction']['passProbability']}%")
            print(f"   Risk: {result['prediction']['risk']}")
            print(f"   Improvement Potential: {result['prediction']['improvementPotential']}")
            return True
        else:
            print(f"❌ Prediction failed with status {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_prediction_with_feedback():
    """Test prediction with feedback endpoint"""
    print("\nTesting /api/predict-with-feedback endpoint...")
    
    test_data = {
        "cgpa": 7.0,
        "credits": 100,
        "extraCurricular": 2,
        "projects": 2,
        "selfStudy": 3,
        "assignment": 0.75,
        "engagement": 6,
        "contribution": 6
    }
    
    try:
        response = requests.post(
            f"{API_URL}/api/predict-with-feedback",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Prediction with feedback successful!")
            print(f"   Grade: {result['prediction']['grade']}")
            print(f"   Pass Probability: {result['prediction']['passProbability']}%")
            print(f"   Risk: {result['prediction']['risk']}")
            if 'feedback' in result['prediction']:
                print(f"   Feedback: {result['prediction']['feedback'][:100]}...")
            return True
        else:
            print(f"❌ Prediction with feedback failed with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("EPIC Backend API Test Suite")
    print("=" * 60)
    print(f"Testing API at: {API_URL}")
    print("=" * 60)
    
    # Run tests
    health_ok = test_health()
    prediction_ok = test_prediction()
    feedback_ok = test_prediction_with_feedback()
    
    print("\n" + "=" * 60)
    print("Test Results Summary")
    print("=" * 60)
    print(f"Health Check: {'✅ PASS' if health_ok else '❌ FAIL'}")
    print(f"Prediction: {'✅ PASS' if prediction_ok else '❌ FAIL'}")
    print(f"Prediction with Feedback: {'✅ PASS' if feedback_ok else '❌ FAIL'}")
    print("=" * 60)
    
    if health_ok and prediction_ok and feedback_ok:
        print("\n🎉 All tests passed! Backend is working correctly.")
    else:
        print("\n⚠️ Some tests failed. Check the backend server.")
