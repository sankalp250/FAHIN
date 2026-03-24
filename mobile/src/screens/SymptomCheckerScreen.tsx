/**
 * FAHIN Mobile App — Symptom Checker Screen
 * Citizens report symptoms here. Sent to FastAPI backend.
 * React Native + Expo
 */

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// ── All trackable symptoms ─────────────────────────────────────────────────────
const SYMPTOM_GROUPS = {
  "Fever & Temperature": ["fever", "high_fever", "mild_fever", "chills", "shivering"],
  "Head & Neurological": ["headache", "dizziness", "migraine", "loss_of_smell", "altered_sensorium"],
  "Respiratory": ["cough", "breathlessness", "phlegm", "throat_irritation", "runny_nose", "congestion"],
  "Body & Muscles": ["fatigue", "muscle_pain", "joint_pain", "body_aches", "weakness_in_limbs", "back_pain"],
  "Skin": ["skin_rash", "itching", "yellowish_skin", "red_spots_over_body", "bruising"],
  "Digestive": ["nausea", "vomiting", "diarrhoea", "abdominal_pain", "loss_of_appetite", "indigestion"],
  "Eyes": ["redness_of_eyes", "pain_behind_the_eyes", "blurred_vision", "yellowing_of_eyes"],
  "Other": ["chest_pain", "fast_heart_rate", "sweating", "dehydration", "swollen_lymph_nodes"],
};

const SEVERITY_LABELS = ["", "Minimal", "Very Mild", "Mild", "Moderate", "Moderate+",
  "Significant", "Severe", "Very Severe", "Critical", "Emergency"];

// ── Component ──────────────────────────────────────────────────────────────────

export default function SymptomCheckerScreen() {
  const [selectedSymptoms, setSelectedSymptoms] = useState<Set<string>>(new Set());
  const [severity, setSeverity] = useState<number>(5);
  const [durationDays, setDurationDays] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>("Fever & Temperature");

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev => {
      const next = new Set(prev);
      next.has(symptom) ? next.delete(symptom) : next.add(symptom);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selectedSymptoms.size === 0) {
      Alert.alert("Select Symptoms", "Please select at least one symptom before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = ""; // retrieve from SecureStore in real app

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/symptoms/report`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            symptoms: Array.from(selectedSymptoms),
            severity,
            duration_days: durationDays,
            city_sector: "Sector-45",  // From user profile / GPS in real app
            city: "Gurugram",
          }),
        }
      );

      if (!response.ok) throw new Error("Submission failed");

      Alert.alert(
        "✅ Report Submitted",
        "Your symptoms have been anonymously reported. Our AI will analyse patterns across the city. You'll receive an alert if there's an outbreak risk in your area.",
        [{ text: "OK", onPress: () => {
          setSelectedSymptoms(new Set());
          setSeverity(5);
          setDurationDays(1);
        }}]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to submit. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Symptom Check</Text>
        <Text style={styles.headerSubtitle}>
          Select your symptoms. Your data is anonymised — no name or address stored.
        </Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Privacy notice */}
        <View style={styles.privacyBadge}>
          <Ionicons name="shield-checkmark" size={16} color="#10b981" />
          <Text style={styles.privacyText}>
            Only your city sector is recorded — never your exact location
          </Text>
        </View>

        {/* Symptom groups */}
        {Object.entries(SYMPTOM_GROUPS).map(([group, symptoms]) => (
          <View key={group} style={styles.group}>
            <TouchableOpacity
              style={styles.groupHeader}
              onPress={() => setExpandedGroup(expandedGroup === group ? null : group)}
            >
              <Text style={styles.groupTitle}>{group}</Text>
              <View style={styles.groupRight}>
                {symptoms.filter(s => selectedSymptoms.has(s)).length > 0 && (
                  <View style={styles.selectedBadge}>
                    <Text style={styles.selectedBadgeText}>
                      {symptoms.filter(s => selectedSymptoms.has(s)).length}
                    </Text>
                  </View>
                )}
                <Ionicons
                  name={expandedGroup === group ? "chevron-up" : "chevron-down"}
                  size={18}
                  color="#6b7280"
                />
              </View>
            </TouchableOpacity>

            {expandedGroup === group && (
              <View style={styles.symptomGrid}>
                {symptoms.map(symptom => {
                  const selected = selectedSymptoms.has(symptom);
                  return (
                    <TouchableOpacity
                      key={symptom}
                      style={[styles.symptomChip, selected && styles.symptomChipSelected]}
                      onPress={() => toggleSymptom(symptom)}
                    >
                      {selected && <Ionicons name="checkmark" size={12} color="#fff" />}
                      <Text style={[styles.symptomLabel, selected && styles.symptomLabelSelected]}>
                        {symptom.replace(/_/g, " ")}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        ))}

        {/* Selected symptoms summary */}
        {selectedSymptoms.size > 0 && (
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>
              {selectedSymptoms.size} symptom{selectedSymptoms.size !== 1 ? "s" : ""} selected
            </Text>
            <View style={styles.summaryChips}>
              {Array.from(selectedSymptoms).map(s => (
                <View key={s} style={styles.summaryChip}>
                  <Text style={styles.summaryChipText}>{s.replace(/_/g, " ")}</Text>
                  <TouchableOpacity onPress={() => toggleSymptom(s)}>
                    <Ionicons name="close" size={12} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Severity slider */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Severity: <Text style={styles.sectionValue}>{SEVERITY_LABELS[severity]} ({severity}/10)</Text>
          </Text>
          <View style={styles.severityRow}>
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <TouchableOpacity
                key={n}
                style={[styles.severityBtn, severity === n && styles.severityBtnActive,
                  { backgroundColor: severity >= n
                    ? n <= 3 ? "#10b981" : n <= 6 ? "#f59e0b" : "#ef4444"
                    : "#e5e7eb" }
                ]}
                onPress={() => setSeverity(n)}
              >
                <Text style={[styles.severityBtnText, severity >= n && { color: "#fff" }]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Duration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Duration: <Text style={styles.sectionValue}>
              {durationDays === 1 ? "Today" : `${durationDays} days`}
            </Text>
          </Text>
          <View style={styles.durationRow}>
            {[1,2,3,5,7,14].map(d => (
              <TouchableOpacity
                key={d}
                style={[styles.durationBtn, durationDays === d && styles.durationBtnActive]}
                onPress={() => setDurationDays(d)}
              >
                <Text style={[styles.durationBtnText, durationDays === d && styles.durationBtnTextActive]}>
                  {d === 1 ? "Today" : d === 14 ? "2 weeks" : `${d}d`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Submit button (fixed at bottom) */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, (isSubmitting || selectedSymptoms.size === 0) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting || selectedSymptoms.size === 0}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="send" size={18} color="#fff" />
              <Text style={styles.submitBtnText}>
                Submit Anonymously ({selectedSymptoms.size} symptoms)
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: { padding: 20, paddingTop: 60, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  headerTitle: { fontSize: 24, fontWeight: "700", color: "#111827" },
  headerSubtitle: { fontSize: 13, color: "#6b7280", marginTop: 4 },
  scroll: { flex: 1, padding: 16 },
  privacyBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#ecfdf5", borderRadius: 10, padding: 12, marginBottom: 16, gap: 8 },
  privacyText: { fontSize: 12, color: "#059669", flex: 1 },
  group: { backgroundColor: "#fff", borderRadius: 12, marginBottom: 10, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  groupHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 },
  groupTitle: { fontSize: 15, fontWeight: "600", color: "#374151" },
  groupRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  selectedBadge: { backgroundColor: "#6366f1", borderRadius: 10, width: 20, height: 20, alignItems: "center", justifyContent: "center" },
  selectedBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  symptomGrid: { flexDirection: "row", flexWrap: "wrap", padding: 12, paddingTop: 0, gap: 8 },
  symptomChip: { flexDirection: "row", alignItems: "center", backgroundColor: "#f3f4f6", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, gap: 4, borderWidth: 1, borderColor: "transparent" },
  symptomChipSelected: { backgroundColor: "#6366f1", borderColor: "#4f46e5" },
  symptomLabel: { fontSize: 12, color: "#4b5563" },
  symptomLabelSelected: { color: "#fff", fontWeight: "600" },
  summary: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 10 },
  summaryTitle: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 10 },
  summaryChips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  summaryChip: { flexDirection: "row", alignItems: "center", backgroundColor: "#ede9fe", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, gap: 6 },
  summaryChipText: { fontSize: 11, color: "#6366f1" },
  section: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 12 },
  sectionValue: { color: "#6366f1" },
  severityRow: { flexDirection: "row", gap: 6 },
  severityBtn: { flex: 1, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  severityBtnActive: {},
  severityBtnText: { fontSize: 12, fontWeight: "600", color: "#6b7280" },
  durationRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  durationBtn: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "#f3f4f6", borderWidth: 1, borderColor: "transparent" },
  durationBtnActive: { backgroundColor: "#ede9fe", borderColor: "#6366f1" },
  durationBtnText: { fontSize: 13, color: "#6b7280" },
  durationBtnTextActive: { color: "#6366f1", fontWeight: "600" },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 32, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#f3f4f6" },
  submitBtn: { backgroundColor: "#6366f1", borderRadius: 14, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  submitBtnDisabled: { backgroundColor: "#c7d2fe" },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
