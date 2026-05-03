// app/(patient)/_layout.jsx
// Premium Patient tab navigation layout – theme aware

import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../../hooks/useTheme';

export default function PatientLayout() {
  const { C } = useTheme();
  return (
    <Tabs
      sceneContainerStyle={{ backgroundColor: C.bg }}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: C.tabBar,
          borderTopColor: C.tabBarBorder,
          borderTopWidth: 1,
          height: 70,
          paddingBottom: 16,
          paddingTop: 10,
          position: 'absolute',
          elevation: 0,
        },
        tabBarActiveTintColor: C.patientPrimary,
        tabBarInactiveTintColor: C.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginTop: 4 },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="book"
        options={{
          title: 'Book',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Visits',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: 'Payments',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="card" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      {/* Hidden Screens */}
      <Tabs.Screen 
        name="medical-history" 
        options={{ href: null, title: 'Medical History' }} 
      />
      <Tabs.Screen 
        name="journal" 
        options={{ href: null, title: 'Health Journal' }} 
      />
    </Tabs>
  );
}
