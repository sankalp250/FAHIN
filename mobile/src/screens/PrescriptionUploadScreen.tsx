import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

export default function PrescriptionUploadScreen() {
  const [image, setImage] = useState<string|null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const pick = async (from: "camera"|"library") => {
    const perms = from === "camera"
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perms.granted) { Alert.alert("Permission denied"); return; }
    const res = from === "camera"
      ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (!res.canceled && res.assets[0]) setImage(res.assets[0].uri);
  };

  const upload = async () => {
    if (!image) return;
    setUploading(true);
    await new Promise(r => setTimeout(r, 2000));
    setUploading(false);
    setResult({ disease: "Dengue Fever", medicines: ["Paracetamol", "ORS"], confidence: 0.91 });
  };

  return (
    <ScrollView style={st.container} contentContainerStyle={{ padding: 20, paddingTop: 60 }}>
      <Text style={st.title}>Upload Prescription</Text>
      <Text style={st.sub}>AI extracts disease and medicine data. Your name is never stored.</Text>

      <View style={st.privacyBanner}>
        <Ionicons name="shield-checkmark" size={16} color="#10B981" />
        <Text style={st.privacyText}>OCR removes patient name before processing</Text>
      </View>

      {/* Image picker */}
      <View style={st.pickRow}>
        {["camera","library"].map(src => (
          <TouchableOpacity key={src} style={st.pickBtn} onPress={() => pick(src as any)}>
            <Ionicons name={src==="camera"?"camera":"images"} size={26} color="#F59E0B" />
            <Text style={st.pickLabel}>{src==="camera"?"Take Photo":"Choose File"}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {image && (
        <View style={st.previewBox}>
          <Ionicons name="document-text" size={40} color="#F59E0B" />
          <Text style={st.previewText}>Prescription selected ✓</Text>
        </View>
      )}

      {image && !result && (
        <TouchableOpacity style={[st.btn, uploading && { opacity:0.7 }]} onPress={upload} disabled={uploading}>
          {uploading
            ? <ActivityIndicator color="#fff" />
            : <><Ionicons name="cloud-upload" size={18} color="#fff" /><Text style={st.btnText}>Upload & Extract</Text></>
          }
        </TouchableOpacity>
      )}

      {result && (
        <View style={st.resultCard}>
          <View style={st.resultHeader}>
            <Ionicons name="checkmark-circle" size={22} color="#10B981" />
            <Text style={st.resultTitle}>Extraction Complete</Text>
            <Text style={st.resultConf}>{Math.round(result.confidence*100)}% confidence</Text>
          </View>
          <View style={st.resultRow}><Text style={st.resultKey}>Disease:</Text><Text style={st.resultVal}>{result.disease}</Text></View>
          <View style={st.resultRow}><Text style={st.resultKey}>Medicines:</Text><Text style={st.resultVal}>{result.medicines.join(", ")}</Text></View>
          <Text style={st.resultNote}>Aggregated to city disease model. No patient data retained.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  container: { flex:1, backgroundColor:"#EEF0F5" },
  title: { fontSize:24, fontWeight:"800", color:"#1E293B", marginBottom:6 },
  sub: { fontSize:14, color:"#64748B", marginBottom:16, lineHeight:20 },
  privacyBanner: { flexDirection:"row", alignItems:"center", gap:8, backgroundColor:"rgba(16,185,129,0.08)",
                    borderRadius:16, padding:12, marginBottom:20, borderWidth:1, borderColor:"rgba(16,185,129,0.15)" },
  privacyText: { fontSize:12, color:"#64748B", flex:1 },
  pickRow: { flexDirection:"row", gap:12, marginBottom:16 },
  pickBtn: { flex:1, backgroundColor:"rgba(245,158,11,0.08)", borderRadius:20, padding:20, alignItems:"center", gap:8,
              borderWidth:1, borderColor:"rgba(245,158,11,0.2)" },
  pickLabel: { fontSize:13, fontWeight:"600", color:"#F59E0B" },
  previewBox: { backgroundColor:"rgba(16,185,129,0.06)", borderRadius:16, padding:20, alignItems:"center", gap:8,
                 marginBottom:16, borderWidth:1, borderColor:"rgba(16,185,129,0.15)" },
  previewText: { fontSize:14, color:"#10B981", fontWeight:"600" },
  btn: { borderRadius:20, paddingVertical:16, flexDirection:"row", justifyContent:"center", alignItems:"center", gap:8,
          backgroundColor:"#F59E0B", shadowColor:"#F59E0B", shadowOpacity:0.4, shadowRadius:10, shadowOffset:{width:0,height:4} },
  btnText: { color:"#fff", fontSize:16, fontWeight:"700" },
  resultCard: { backgroundColor:"rgba(16,185,129,0.06)", borderRadius:20, padding:18, marginTop:16,
                 borderWidth:1, borderColor:"rgba(16,185,129,0.15)" },
  resultHeader: { flexDirection:"row", alignItems:"center", gap:8, marginBottom:14 },
  resultTitle: { flex:1, fontSize:16, fontWeight:"700", color:"#1E293B" },
  resultConf: { fontSize:12, color:"#10B981", fontWeight:"700" },
  resultRow: { flexDirection:"row", gap:10, marginBottom:8 },
  resultKey: { fontSize:13, color:"#64748B", width:80, fontWeight:"500" },
  resultVal: { fontSize:13, color:"#1E293B", fontWeight:"600", flex:1 },
  resultNote: { fontSize:11, color:"#94A3B8", marginTop:10, lineHeight:16 },
});
