"""
Integration Tests for FastAPI Endpoints using TestClient
"""
from starlette.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "HEALTHY"
    assert data["system"] == "SENTINEL AI"

def test_sensor_endpoints():
    res = client.get("/api/v1/sensors/current")
    assert res.status_code == 200
    data = res.json()
    assert data["is_simulated"] is True
    assert "temperature_celsius" in data

    # Inject
    res_inj = client.post("/api/v1/sensors/inject", json={"hazard_type": "FIRE_TEMP"})
    assert res_inj.status_code == 200
    assert res_inj.json()["temperature_celsius"] > 50.0

    # Reset
    res_rst = client.post("/api/v1/sensors/reset")
    assert res_rst.status_code == 200

def test_diagnostic_testing_endpoints():
    res = client.post("/api/v1/testing/run-test/glass")
    assert res.status_code == 200
    assert res.json()["passed"] is True

    res2 = client.post("/api/v1/testing/run-test/fire")
    assert res2.status_code == 200
    assert res2.json()["passed"] is True

def test_static_index():
    res = client.get("/")
    assert res.status_code == 200
    assert "SENTINEL AI" in res.text

if __name__ == "__main__":
    test_health_check()
    test_sensor_endpoints()
    test_diagnostic_testing_endpoints()
    test_static_index()
    print("All API integration tests passed successfully!")
