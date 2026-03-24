/**
 * FAHIN Mobile — Home Screen
 * Shows user's sector risk, active alerts, quick actions
 */
import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, StatusBar, RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const SECTOR_RISK = { sector: "Sector-45", disease: "Dengue", probability: 0.84, trend: "rising" };
const ALERTS = [
  { id: "1", disease: "Dengue",    sector: "Sector-45", probability: 0.84, peakDays: 5  },
  { id: "2", disease: "Unknown",   sector: "Sector-17", probability: 0.72, peakDays: 3  },
  { id: "3", disease: "Influenza", sector: "Sector-32", probability: 0.67, peakDays: 8  },
];
const TIPS = [
  "Use mosquito repellent and wear long sleeves in the evenings",
  "Drink only boiled or purified water this week",
  "Watch for fever above 101°F — report immediately",
];

function riskColor(p: number) {
  if (p >= 0.8) return "#EF4444";
  if (p >= 0.6) return "#F97316";
  if (p >= 0.4) return "#F59E0B";
  if (p >= 0.2) return "#3B82F6";
  return "#10B981";
}
function riskLabel(p: number) {
  if (p >= 0.8) return "Critical";
  if (p >= 0.6) return "High";
  if (p >= 0.4) return "Moderate";
  if (p >= 0.2) return "Low";
  return "Safe";
}

export default function HomeScreen({ navigation }: any) {
  const [refreshing, setRefreshing] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 1000, useNativeDriver: true }),
      ])
    ).start();
    const t = setInterval(() => setTipIndex(i => (i + 1) % TIPS.length), 5000);
    return () => clearInterval(t);
  }, []);

  const onRefresh = async () => { setRefreshing(true); await new Promise(r => setTimeout(r, 1200)); setRefreshing(false); };
  const col = riskColor(SECTOR_RISK.probability);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEF0F5" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={col} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning 👋</Text>
            <Text style={styles.location}>📍 {SECTOR_RISK.sector}, Gurugram</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn}>
            <Ionicons name="notifications-outline" size={22} color="#1E293B" />
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>{ALERTS.length}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Big risk card */}
        <Animated.View style={[styles.riskCard, { borderColor: `${col}30` }, { transform: [{ scale: pulseAnim }] }]}>
          <View style={[styles.riskCardInner, { backgroundColor: `${col}10` }]}>
            <View style={styles.riskTop}>
              <View>
                <Text style={styles.riskSectorLabel}>Your sector risk</Text>
                <Text style={styles.riskSectorName}>{SECTOR_RISK.sector}</Text>
              </View>
              <View style={[styles.riskBadge, { backgroundColor: col }]}>
                <Text style={styles.riskBadgeText}>{riskLabel(SECTOR_RISK.probability)}</Text>
              </View>
            </View>
            <Text style={[styles.riskPercent, { color: col }]}>
              {Math.round(SECTOR_RISK.probability * 100)}%
            </Text>
            <Text style={styles.riskDisease}>{SECTOR_RISK.disease} · trending ↑</Text>

            {/* Progress bar */}
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${Math.round(SECTOR_RISK.probability * 100)}%` as any, backgroundColor: col }]} />
            </View>
          </View>
        </Animated.View>

        {/* Quick action */}
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={() => navigation?.navigate("Symptoms")}
        >
          <Ionicons name="add-circle" size={20} color="#fff" />
          <Text style={styles.ctaBtnText}>Report Your Symptoms Now</Text>
        </TouchableOpacity>

        {/* Health tip */}
        <View style={styles.tipCard}>
          <View style={styles.tipIcon}><Ionicons name="bulb" size={16} color="#F59E0B" /></View>
          <Text style={styles.tipText}>{TIPS[tipIndex]}</Text>
        </View>

        {/* Alerts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Alerts</Text>
          {ALERTS.map(a => {
            const ac = riskColor(a.probability);
            return (
              <View key={a.id} style={[styles.alertCard, { backgroundColor: `${ac}08`, borderColor: `${ac}25` }]}>
                <View style={[styles.alertIcon, { backgroundColor: `${ac}18` }]}>
                  <Ionicons name="warning" size={18} color={ac} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertDisease}>{a.disease}</Text>
                  <Text style={styles.alertSub}>{a.sector} · peak in {a.peakDays} days</Text>
                </View>
                <Text style={[styles.alertProb, { color: ac }]}>{Math.round(a.probability * 100)}%</Text>
              </View>
            );
          })}
        </View>

        {/* Privacy notice */}
        <View style={styles.privacyCard}>
          <Ionicons name="shield-checkmark" size={16} color="#10B981" />
          <Text style={styles.privacyText}>
            Your data is anonymised. No name or exact location is ever stored.
          </Text>
        </View>
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF0F5" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingTop: 60 },
  greeting: { fontWeight: "700", fontSize: 22, color: "#1E293B" },
  location: { fontSize: 13, color: "#64748B", marginTop: 2 },
  notifBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#F8F9FC", justifyContent: "center", alignItems: "center",
               shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  notifBadge: { position: "absolute", top: 6, right: 6, width: 16, height: 16, borderRadius: 8, backgroundColor: "#EF4444",
                 justifyContent: "center", alignItems: "center" },
  notifBadgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },
  riskCard: { margin: 16, borderRadius: 24, borderWidth: 1.5, overflow: "hidden",
               shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 12, elevation: 4 },
  riskCardInner: { padding: 20 },
  riskTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  riskSectorLabel: { fontSize: 12, color: "#64748B", fontWeight: "500" },
  riskSectorName: { fontSize: 16, fontWeight: "700", color: "#1E293B", marginTop: 2 },
  riskBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  riskBadgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  riskPercent: { fontSize: 56, fontWeight: "800", lineHeight: 60 },
  riskDisease: { fontSize: 14, color: "#64748B", marginTop: 4, marginBottom: 14 },
  progressBg: { height: 6, backgroundColor: "rgba(0,0,0,0.08)", borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  ctaBtn: { marginHorizontal: 16, marginBottom: 12, borderRadius: 20, paddingVertical: 16, flexDirection: "row",
             justifyContent: "center", alignItems: "center", gap: 8,
             backgroundColor: "#F59E0B",
             shadowColor: "#F59E0B", shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  ctaBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  tipCard: { marginHorizontal: 16, marginBottom: 16, backgroundColor: "rgba(245,158,11,0.08)", borderRadius: 20, padding: 14,
              flexDirection: "row", alignItems: "flex-start", gap: 10, borderWidth: 1, borderColor: "rgba(245,158,11,0.2)" },
  tipIcon: { width: 30, height: 30, borderRadius: 10, backgroundColor: "rgba(245,158,11,0.15)", justifyContent: "center", alignItems: "center" },
  tipText: { flex: 1, fontSize: 13, color: "#64748B", lineHeight: 20 },
  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1E293B", marginBottom: 10 },
  alertCard: { borderRadius: 16, borderWidth: 1, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  alertIcon: { width: 38, height: 38, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  alertDisease: { fontSize: 14, fontWeight: "600", color: "#1E293B" },
  alertSub: { fontSize: 12, color: "#64748B", marginTop: 2 },
  alertProb: { fontSize: 20, fontWeight: "800" },
  privacyCard: { marginHorizontal: 16, backgroundColor: "rgba(16,185,129,0.08)", borderRadius: 16, padding: 14,
                  flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: "rgba(16,185,129,0.15)" },
  privacyText: { flex: 1, fontSize: 12, color: "#64748B" },
});
