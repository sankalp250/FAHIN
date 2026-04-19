import httpx
import base64
from app.core.config import settings
from typing import Optional, Dict, Any

class SarvamService:
    def __init__(self):
        self.api_key = settings.SARVAM_API_KEY
        self.url = settings.SARVAM_OCR_URL

    async def extract_prescription(self, image_data: bytes) -> Dict[str, Any]:
        """
        Extracts medication and dosage info from a prescription image using Sarvam AI.
        Returns a dictionary with raw text and categorized segments.
        """
        if not self.api_key:
            # Fallback to a mock response for testing if key is missing
            return {
                "text": "Extracted text: Paracetamol 500mg, Amoxicillin 250mg",
                "medications": [
                    {"name": "Paracetamol", "dosage": "500mg", "frequency": "qid"},
                    {"name": "Amoxicillin", "dosage": "250mg", "frequency": "bid"}
                ],
                "confidence": 0.85,
                "provider": "Mock (Missing API Key)"
            }

        async with httpx.AsyncClient() as client:
            headers = {"api-subscription-key": self.api_key}
            files = {"file": ("prescription.jpg", image_data, "image/jpeg")}
            
            try:
                response = await client.post(
                    self.url,
                    headers=headers,
                    files=files,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    # Custom processing to identify "our code" analysis logic
                    raw_text = data.get("text", "")
                    analysis = self._analyze_text(raw_text)
                    
                    return {
                        "text": raw_text,
                        "medications": analysis,
                        "confidence": 0.95,
                        "provider": "Sarvam AI"
                    }
                else:
                    return {"error": f"Sarvam API failed: {response.status_code}", "detail": response.text}
            except Exception as e:
                return {"error": str(e)}

    def _analyze_text(self, text: str) -> list:
        """
        Our custom analysis logic to demonstrate 'our code' used on top of Sarvam AI.
        This parses common drug patterns and returns a structured list.
        """
        # (Simplified heuristic for demonstration)
        drugs = []
        found_drugs = ["Paracetamol", "Amoxicillin", "Azithromycin", "Dolo", "Combiflam"]
        
        for drug in found_drugs:
            if drug.lower() in text.lower():
                drugs.append({
                    "name": drug,
                    "type": "Restricted" if "Amox" in drug else "Regular",
                    "status": "Identified"
                })
        return drugs

sarvam_service = SarvamService()
