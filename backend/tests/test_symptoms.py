"""Test symptom report endpoints."""
import pytest


VALID_REPORT = {
    "symptoms": ["fever", "headache", "joint_pain"],
    "severity": 6,
    "duration_days": 2,
    "city_sector": "Sector-45",
    "city": "Gurugram",
}


@pytest.mark.asyncio
async def test_submit_symptom_report(client):
    resp = await client.post("/api/v1/symptoms/report", json=VALID_REPORT)
    assert resp.status_code == 201
    data = resp.json()
    assert data["city_sector"] == "Sector-45"
    assert data["symptoms"] == VALID_REPORT["symptoms"]
    assert data["is_processed"] is False


@pytest.mark.asyncio
async def test_submit_empty_symptoms_fails(client):
    resp = await client.post("/api/v1/symptoms/report", json={**VALID_REPORT, "symptoms": []})
    assert resp.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_submit_invalid_severity_fails(client):
    resp = await client.post("/api/v1/symptoms/report", json={**VALID_REPORT, "severity": 15})
    assert resp.status_code == 422
