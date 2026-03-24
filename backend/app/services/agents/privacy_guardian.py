"""Privacy Guardian Agent — strips PII from symptom data."""
import re
import logging

logger = logging.getLogger(__name__)

PII_PATTERNS = [
    re.compile(r"\b[A-Z][a-z]+\s+[A-Z][a-z]+\b"),           # Names
    re.compile(r"\b[6-9]\d{9}\b"),                             # Indian phone numbers
    re.compile(r"\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b"),        # US phone
    re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"),  # Email
    re.compile(r"\b\d{6}\b"),                                  # PIN code
    re.compile(r"\b(house|flat|plot|apartment|door)\s+no\.?\s*\d+\b", re.I),
]

MEDICAL_SAFE_WORDS = {
    "fever","headache","cough","cold","pain","rash","fatigue","nausea","vomiting",
    "diarrhoea","chills","sweating","breathlessness","joint_pain","body_aches",
    "sore_throat","runny_nose","congestion","sneezing","itching","dizziness",
    "high_fever","mild_fever","muscle_pain","back_pain","chest_pain","loss_of_appetite",
    "skin_rash","yellowish_skin","dark_urine","abdominal_pain","weakness",
}


class PrivacyGuardianAgent:
    """Removes PII from symptom lists and free text."""

    def clean_symptoms(self, symptoms: list[str]) -> list[str]:
        cleaned = []
        for symptom in symptoms:
            s = symptom.strip().lower().replace(" ", "_")
            # Keep only known medical terms; unknown ones are sanitised
            if s in MEDICAL_SAFE_WORDS or self._is_safe_symptom(s):
                cleaned.append(s)
        return cleaned

    def _is_safe_symptom(self, symptom: str) -> bool:
        """Check if symptom string is safe (no PII patterns)."""
        for pattern in PII_PATTERNS:
            if pattern.search(symptom):
                return False
        # Must be alphanumeric with underscores only
        return bool(re.match(r"^[a-z0-9_]+$", symptom))

    def clean_text(self, text: str) -> str:
        """Strip PII from any free text."""
        for pattern in PII_PATTERNS:
            text = pattern.sub("[REDACTED]", text)
        return text
