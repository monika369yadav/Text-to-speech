import requests

BASE_URL = "https://text-to-speech-wcii.onrender.com"

def test_health_endpoint_status_code():
    response = requests.get(f"{BASE_URL}/api/health", timeout=30)
    assert response.status_code == 200

def test_health_endpoint_response_structure():
    response = requests.get(f"{BASE_URL}/api/health", timeout=30)
    data = response.json()
    assert "status" in data
    assert data["status"] == "ok"

def test_health_endpoint_api_key_configured():
    response = requests.get(f"{BASE_URL}/api/health", timeout=30)
    data = response.json()
    assert data["apiKeyConfigured"] == True