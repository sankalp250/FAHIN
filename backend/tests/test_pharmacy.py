"""Test pharmacy sales endpoints."""
import pytest
from datetime import date


@pytest.mark.asyncio
async def test_get_pharmacy_spikes(client):
    resp = await client.get("/api/v1/pharmacy/spikes?city=Gurugram")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
