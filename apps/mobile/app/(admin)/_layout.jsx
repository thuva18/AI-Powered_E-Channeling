// app/(admin)/_layout.jsx
// Admin tab navigation layout – theme aware

import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../../hooks/useTheme';

export default function AdminLayout() {
  const { C } = useTheme();
  return (
    <Tabs
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
        tabBarActiveTintColor: C.adminPrimary,
        tabBarInactiveTintColor: C.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginTop: 4 },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Dashboard', tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} /> }} />
      <Tabs.Screen name="doctors" options={{ title: 'Doctors', tabBarIcon: ({ color, size }) => <Ionicons name="medical" size={size} color={color} /> }} />
      <Tabs.Screen name="patients" options={{ title: 'Patients', tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} /> }} />
      <Tabs.Screen name="users" options={{ title: 'Users', tabBarIcon: ({ color, size }) => <Ionicons name="person-add" size={size} color={color} /> }} />
      <Tabs.Screen name="payments" options={{ title: 'Payments', tabBarIcon: ({ color, size }) => <Ionicons name="card" size={size} color={color} /> }} />
      <Tabs.Screen name="reports" options={{ title: 'Reports', tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart" size={size} color={color} /> }} />
    </Tabs>
  );
}
