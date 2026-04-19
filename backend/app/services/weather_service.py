import httpx
from app.core.config import settings
from typing import Dict, Any, Optional

class WeatherService:
    def __init__(self):
        self.api_key = settings.OPENWEATHER_API_KEY
        self.base_url = "https://api.openweathermap.org/data/2.5/weather"

    async def get_weather_for_city(self, city: str) -> Optional[Dict[str, Any]]:
        if not self.api_key:
            return None
            
        async with httpx.AsyncClient() as client:
            try:
                params = {
                    "q": city,
                    "appid": self.api_key,
                    "units": "metric"
                }
                response = await client.get(self.base_url, params=params)
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "city": data.get("name"),
                        "temp": data["main"].get("temp"),
                        "humidity": data["main"].get("humidity"),
                        "description": data["weather"][0].get("description"),
                        "risk_factor": self._calculate_weather_risk(data["main"].get("temp"), data["main"].get("humidity"))
                    }
                return None
            except Exception as e:
                print(f"Weather API Error: {e}")
                return None

    def _calculate_weather_risk(self, temp: float, humidity: int) -> float:
        # Simple heuristic: High humidity and moderate temp (15-25C) increases flu/viral spread risk
        risk = 1.0
        if humidity > 70:
            risk += 0.2
        if 15 <= temp <= 25:
            risk += 0.1
        return round(risk, 2)

weather_service = WeatherService()
