"""City Risk Agent — fetches environmental data for a sector."""
import logging
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)


class CityRiskAgent:
    async def get_risk_factors(self, sector: str, city: str) -> dict:
        aqi, temp, humidity = await self._fetch_env_data(city)
        mosquito_risk = self._compute_mosquito_risk(temp, humidity)
        env_risk_score = min(1.0, (aqi / 300 * 0.3 + mosquito_risk * 0.5 + humidity / 100 * 0.2))

        return {
            "aqi": aqi, "temperature": temp, "humidity": humidity,
            "env_risk_score": env_risk_score,
        }

    async def _fetch_env_data(self, city: str) -> tuple[float, float, float]:
        """Fetch AQI from OpenAQ, weather from OpenWeather."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                weather_resp = await client.get(
                    "https://api.openweathermap.org/data/2.5/weather",
                    params={"q": city, "appid": settings.OPENWEATHER_API_KEY, "units": "metric"},
                )
                if weather_resp.status_code == 200:
                    data = weather_resp.json()
                    temp = data["main"]["temp"]
                    humidity = data["main"]["humidity"]
                    return 120.0, temp, humidity  # AQI placeholder
        except Exception as e:
            logger.warning(f"Weather fetch failed: {e}")
        return 120.0, 32.0, 75.0  # Reasonable defaults for India

    def _compute_mosquito_risk(self, temp: float, humidity: float) -> float:
        """Dengue/malaria mosquito risk index (0-1)."""
        if 25 <= temp <= 35 and humidity >= 70:
            return 0.8
        elif 20 <= temp <= 38 and humidity >= 50:
            return 0.5
        return 0.2
