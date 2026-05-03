// app/(admin)/patients.jsx
// Admin Patient Management – theme aware

import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput,
  ActivityIndicator, Alert, RefreshControl, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import useTheme from '../../hooks/useTheme';
import { FONT_SIZES, SPACING, RADIUS } from '../../constants/theme';

export default function AdminPatientsScreen() {
  const { C, S, isDark } = useTheme();
  const [patients, setPatients] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [togglingId, setTogglingId] = useState(null);

  const fetchPatients = useCallback(async () => {
    try {
      const res = await api.get('/admin/patients');
      const patientList = res.data.patients || res.data || [];
      setPatients(patientList);
      setFiltered(patientList);
    } catch { Alert.alert('Error', 'Failed to load patients'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchPatients(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchPatients(); };

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(q ? patients.filter((p) => p.name.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q) || p.nic?.includes(q)) : patients);
  }, [search, patients]);

  const toggleActive = async (id, currentState) => {
    setTogglingId(id);
    try {
      await api.patch(`/admin/users/${id}/toggle-active`);
      setPatients((prev) => prev.map((p) => p._id === id ? { ...p, isActive: !currentState } : p));
    } catch { Alert.alert('Error', 'Failed to toggle status'); }
    finally { setTogglingId(null); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.md, backgroundColor: C.bgCard, borderBottomWidth: 1, borderBottomColor: C.border }}>
        <Text style={{ fontSize: FONT_SIZES.xl, fontWeight: '700', color: C.textPrimary }}>Manage Patients</Text>
        <Text style={{ fontSize: FONT_SIZES.sm, color: C.textSecondary }}>{patients.length} total</Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', margin: SPACING.lg, backgroundColor: C.bgCard, borderRadius: RADIUS.md, borderWidth: 1, borderColor: C.border, paddingHorizontal: SPACING.md, height: 48 }}>
        <Ionicons name="search" size={18} color={C.textSecondary} style={{ marginRight: SPACING.sm }} />
        <TextInput style={{ flex: 1, color: C.textPrimary, fontSize: FONT_SIZES.base }} placeholder="Search by name, email or NIC..." placeholderTextColor={C.textMuted} value={search} onChangeText={setSearch} />
      </View>

      {loading ? <ActivityIndicator color={C.adminPrimary} style={{ marginTop: 40 }} /> : (
        <FlatList data={filtered} keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: 80 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.adminPrimary} />}
          renderItem={({ item }) => (
            <View style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: C.border, ...S.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.sm }}>
                <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: C.bgElevated, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md }}>
                  <Text style={{ fontSize: 20 }}>🧑</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: FONT_SIZES.base, fontWeight: '700', color: C.textPrimary }}>
                    {item.name || `${item.patientProfile?.firstName || ''} ${item.patientProfile?.lastName || ''}`.trim() || 'N/A'}
                  </Text>
                  {item.email && <Text style={{ fontSize: FONT_SIZES.xs, color: C.textSecondary, marginTop: 2 }}>✉️ {item.email}</Text>}
                  {item.nic && <Text style={{ fontSize: FONT_SIZES.xs, color: C.textSecondary, marginTop: 2 }}>🪪 {item.nic}</Text>}
                  {item.phone && <Text style={{ fontSize: FONT_SIZES.xs, color: C.textSecondary, marginTop: 2 }}>📞 {item.phone}</Text>}
                </View>
                <View style={{ paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full, backgroundColor: item.isActive !== false ? C.success + '22' : C.error + '22' }}>
                  <Text style={{ color: item.isActive !== false ? C.success : C.error, fontSize: 10, fontWeight: '700' }}>
                    {item.isActive !== false ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={{ paddingVertical: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 1, alignItems: 'center', borderColor: (item.isActive !== false ? C.error : C.success) + '44' }}
                onPress={() => toggleActive(item._id, item.isActive !== false)} disabled={togglingId === item._id}>
                {togglingId === item._id
                  ? <ActivityIndicator size="small" color={C.adminPrimary} />
                  : <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: item.isActive !== false ? C.error : C.success }}>
                      {item.isActive !== false ? 'Deactivate Account' : 'Activate Account'}
                    </Text>}
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Ionicons name="people-outline" size={40} color={C.textMuted} />
              <Text style={{ color: C.textMuted, marginTop: SPACING.md }}>No patients found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
