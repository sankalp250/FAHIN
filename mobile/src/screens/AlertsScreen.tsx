import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const ALERTS = [
  { id:"1", disease:"Dengue",     sector:"Sector-45", prob:0.84, peak:5,  age:"2h ago",  type:"Hospital Alert",  sev:"critical" },
  { id:"2", disease:"Unknown",    sector:"Sector-17", prob:0.72, peak:3,  age:"20m ago", type:"Authority Alert", sev:"high"     },
  { id:"3", disease:"Influenza",  sector:"Sector-32", prob:0.67, peak:8,  age:"4h ago",  type:"Hospital Alert",  sev:"high"     },
  { id:"4", disease:"Malaria",    sector:"Sector-21", prob:0.51, peak:12, age:"1d ago",  type:"Public Alert",    sev:"moderate" },
  { id:"5", disease:"Dengue",     sector:"Sector-8",  prob:0.38, peak:18, age:"2d ago",  type:"Public Alert",    sev:"low"      },
];

const SEV_COLOR: Record<string,string> = { critical:"#EF4444", high:"#F97316", moderate:"#F59E0B", low:"#3B82F6" };

export default function AlertsScreen() {
  return (
    <View style={st.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEF0F5" />
      <View style={st.header}>
        <Text style={st.title}>Outbreak Alerts</Text>
        <View style={st.countBadge}><Text style={st.countText}>{ALERTS.length} active</Text></View>
      </View>
      <FlatList
        data={ALERTS}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: a }) => {
          const ac = SEV_COLOR[a.sev] ?? "#94A3B8";
          return (
            <TouchableOpacity style={[st.card, { borderColor: `${ac}25`, backgroundColor: `${ac}08` }]}>
              <View style={[st.icon, { backgroundColor: `${ac}18` }]}>
                <Ionicons name="warning" size={22} color={ac} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={st.cardRow}>
                  <Text style={st.disease}>{a.disease}</Text>
                  <Text style={[st.prob, { color: ac }]}>{Math.round(a.prob*100)}%</Text>
                </View>
                <Text style={st.sub}>{a.sector} · {a.type}</Text>
                <Text style={st.sub2}>Peak in {a.peak} days · {a.age}</Text>
                <View style={st.progBg}>
                  <View style={[st.progFill, { width: `${Math.round(a.prob*100)}%` as any, backgroundColor: ac }]} />
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex:1, backgroundColor:"#EEF0F5" },
  header: { flexDirection:"row", alignItems:"center", gap:10, padding:20, paddingTop:60 },
  title: { fontSize:24, fontWeight:"800", color:"#1E293B" },
  countBadge: { backgroundColor:"#EF4444", borderRadius:20, paddingHorizontal:10, paddingVertical:4 },
  countText: { color:"#fff", fontSize:11, fontWeight:"800" },
  card: { borderRadius:20, borderWidth:1, padding:16, flexDirection:"row", gap:14 },
  icon: { width:44, height:44, borderRadius:14, justifyContent:"center", alignItems:"center" },
  cardRow: { flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:2 },
  disease: { fontSize:16, fontWeight:"700", color:"#1E293B" },
  prob: { fontSize:22, fontWeight:"800" },
  sub: { fontSize:12, color:"#64748B", marginBottom:1 },
  sub2: { fontSize:11, color:"#94A3B8", marginBottom:10 },
  progBg: { height:4, backgroundColor:"rgba(0,0,0,0.08)", borderRadius:2, overflow:"hidden" },
  progFill: { height:"100%", borderRadius:2 },
});
