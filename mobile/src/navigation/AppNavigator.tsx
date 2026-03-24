import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import HomeScreen from "../screens/HomeScreen";
import SymptomCheckerScreen from "../screens/SymptomCheckerScreen";
import AlertsScreen from "../screens/AlertsScreen";
import PrescriptionUploadScreen from "../screens/PrescriptionUploadScreen";

const Tab = createBottomTabNavigator();

const TABS = [
  { name:"Home",        comp: HomeScreen,               icon:"home",           iconOut:"home-outline"           },
  { name:"Symptoms",    comp: SymptomCheckerScreen,      icon:"fitness",        iconOut:"fitness-outline"        },
  { name:"Alerts",      comp: AlertsScreen,              icon:"warning",        iconOut:"warning-outline"        },
  { name:"Prescription",comp: PrescriptionUploadScreen,  icon:"document-text",  iconOut:"document-text-outline"  },
];

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "rgba(238,240,245,0.95)",
            borderTopColor: "rgba(255,255,255,0.7)",
            borderTopWidth: 1,
            height: 84,
            paddingBottom: 20,
            paddingTop: 8,
            backdropFilter: "blur(20px)",
          },
          tabBarActiveTintColor: "#F59E0B",
          tabBarInactiveTintColor: "#94A3B8",
          tabBarLabelStyle: { fontSize: 11, fontWeight: "600", marginTop: 2 },
          tabBarIcon: ({ focused, color, size }) => {
            const tab = TABS.find(t => t.name === route.name)!;
            return <Ionicons name={focused ? tab.icon : tab.iconOut} size={22} color={color} />;
          },
        })}
      >
        {TABS.map(t => <Tab.Screen key={t.name} name={t.name} component={t.comp} />)}
      </Tab.Navigator>
    </NavigationContainer>
  );
}
