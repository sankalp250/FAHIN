import google.generativeai as genai
from app.core.config import settings
import logging
import json

logger = logging.getLogger(__name__)

class VisionAgent:
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-1.5-flash')

    async def analyze_symptom_photo(self, image_bytes: bytes) -> dict:
        """
        Uses Gemini 1.5 Flash to analyze a photo of symptoms or a prescription.
        Returns a structured list of medical symptoms for the ML models.
        """
        prompt = """
        Analyze this medical photo (could be a physical symptom like a rash, or a handwritten prescription).
        Identify any visible symptoms or mentioned medications/diseases.
        
        Return ONLY a JSON object with this format:
        {
            "symptoms": ["list", "of", "symptoms"],
            "severity_estimate": 1-10,
            "visual_description": "brief medical description",
            "extracted_text": "any text seen in the photo"
        }
        """
        try:
            # Note: genai library is synchronous for the generate_content call
            response = self.model.generate_content([
                prompt,
                {"mime_type": "image/jpeg", "data": image_bytes}
            ])
            
            # Extract JSON from response
            text = response.text
            # Basic cleanup if model adds markdown backticks
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0]
            elif "```" in text:
                text = text.split("```")[1].split("```")[0]
                
            return json.loads(text.strip())
        except Exception as e:
            logger.error(f"Vision Agent Error: {e}")
            return {"symptoms": [], "severity_estimate": 0, "error": str(e)}

class PatternAgent:
    """
    Identifies 'Old' vs 'New' diseases using preserved ML models.
    """
    async def identify_pattern(self, symptom_list: list[str]) -> dict:
        # Placeholder for connection to ModelRegistry
        # We will implement this as we wire up the models
        return {
            "identified_disease": "Unknown",
            "is_anomaly": False,
            "confidence": 0.0
        }

class FAHINOrchestrator:
    def __init__(self):
        self.vision = VisionAgent()
        self.pattern = PatternAgent()

    async def process_mobile_report(self, image_bytes: bytes = None, manual_symptoms: list = None):
        """
        Coordinates the agents to process a citizen report.
        """
        extracted_data = {}
        if image_bytes:
            extracted_data = await self.vision.analyze_symptom_photo(image_bytes)
        
        combined_symptoms = list(set((manual_symptoms or []) + extracted_data.get("symptoms", [])))
        
        identification = await self.pattern.identify_pattern(combined_symptoms)
        
        return {
            "symptoms": combined_symptoms,
            "identification": identification,
            "vision_metadata": extracted_data
        }

orchestrator = FAHINOrchestrator()
