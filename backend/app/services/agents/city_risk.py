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
        """Fetch AQI and weather data using OpenWeatherMap."""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # 1. Geocoding: Get Lat/Lon for the city
                geo_url = f"http://api.openweathermap.org/geo/1.0/direct?q={city}&limit=1&appid={settings.OPENWEATHER_API_KEY}"
                geo_resp = await client.get(geo_url)
                if geo_resp.status_code != 200 or not geo_resp.json():
                    logger.warning(f"Geocoding failed for {city}: {geo_resp.text}")
                    return 120.0, 30.0, 70.0
                
                geo_data = geo_resp.json()[0]
                lat, lon = geo_data["lat"], geo_data["lon"]

                # 2. Weather: Get Temp and Humidity
                weather_url = f"https://api.openweathermap.org/data/2.5/weather"
                weather_resp = await client.get(
                    weather_url,
                    params={"lat": lat, "lon": lon, "appid": settings.OPENWEATHER_API_KEY, "units": "metric"},
                )
                
                # 3. Air Pollution: Get AQI
                pollution_url = f"http://api.openweathermap.org/data/2.5/air_pollution"
                pollution_resp = await client.get(
                    pollution_url,
                    params={"lat": lat, "lon": lon, "appid": settings.OPENWEATHER_API_KEY},
                )

                temp, humidity, aqi = 30.0, 70.0, 120.0

                if weather_resp.status_code == 200:
                    w_data = weather_resp.json()
                    temp = w_data["main"]["temp"]
                    humidity = w_data["main"]["humidity"]
                
                if pollution_resp.status_code == 200:
                    p_data = pollution_resp.json()
                    # OpenWeather AQI is 1-5 (1=Good, 5=Very Poor). 
                    # We map this roughly to standard US AQI values for our model (e.g. 1->50, 5->300)
                    ow_aqi = p_data["list"][0]["main"]["aqi"]
                    aqi_mapping = {1: 30, 2: 70, 3: 130, 4: 180, 5: 300}
                    aqi = aqi_mapping.get(ow_aqi, 120.0)

                return aqi, temp, humidity

        except Exception as e:
            logger.error(f"Environmental data fetch failed: {e}")
            return 120.0, 32.0, 75.0  # Reasonable defaults for India

    def _compute_mosquito_risk(self, temp: float, humidity: float) -> float:
        """Dengue/malaria mosquito risk index (0-1)."""
        if 25 <= temp <= 35 and humidity >= 70:
            return 0.8
        elif 20 <= temp <= 38 and humidity >= 50:
            return 0.5
        return 0.2
