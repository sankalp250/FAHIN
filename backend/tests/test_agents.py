"""Test agent pipeline components."""
import pytest
from app.services.agents.privacy_guardian import PrivacyGuardianAgent


def test_privacy_guardian_cleans_known_symptoms():
    agent = PrivacyGuardianAgent()
    result = agent.clean_symptoms(["fever", "headache", "joint_pain"])
    assert "fever"      in result
    assert "headache"   in result
    assert "joint_pain" in result


def test_privacy_guardian_rejects_phone_numbers():
    agent = PrivacyGuardianAgent()
    result = agent.clean_symptoms(["fever", "9876543210"])  # phone number
    assert "fever" in result
    assert "9876543210" not in result


def test_privacy_guardian_strips_pii_from_text():
    agent = PrivacyGuardianAgent()
    text = "Patient Rahul Sharma called on 9876543210"
    cleaned = agent.clean_text(text)
    assert "9876543210" not in cleaned
    assert "[REDACTED]" in cleaned


def test_disease_classifier_heuristic():
    from app.services.ml.disease_classifier import _heuristic_classify
    result = _heuristic_classify(["fever", "joint_pain", "headache", "rash"])
    assert len(result) > 0
    assert result[0]["disease"] == "Dengue"
    assert 0 < result[0]["probability"] <= 1.0


def test_anomaly_detector_heuristic():
    from app.services.ml.anomaly_detector import AnomalyDetector
    vec = [0.5] * 768
    result = AnomalyDetector.score(vec)
    assert "anomaly_score" in result
    assert "is_anomalous"  in result
    assert 0 <= result["anomaly_score"] <= 1.0
