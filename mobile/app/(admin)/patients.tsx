// app/(admin)/patients.tsx
// Admin Patient Management screen

import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  ActivityIndicator, Alert, RefreshControl, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

interface Patient {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  gender?: string;
  nic?: string;
  isActive?: boolean;
  createdAt?: string;
}

export default function AdminPatientsScreen() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filtered, setFiltered] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchPatients = useCallback(async () => {
    try {
      const res = await api.get('/admin/patients');
      setPatients(res.data || []);
      setFiltered(res.data || []);
    } catch { Alert.alert('Error', 'Failed to load patients'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchPatients(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchPatients(); };

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      q ? patients.filter((p) =>
        p.name.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q) || p.nic?.includes(q),
      ) : patients,
    );
  }, [search, patients]);

  const toggleActive = async (id: string, currentState: boolean) => {
    setTogglingId(id);
    try {
      await api.patch(`/admin/users/${id}/toggle-active`);
      setPatients((prev) =>
        prev.map((p) => p._id === id ? { ...p, isActive: !currentState } : p),
      );
    } catch { Alert.alert('Error', 'Failed to toggle status'); }
    finally { setTogglingId(null); }
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Manage Patients</Text>
        <Text style={styles.subtitle}>{patients.length} total</Text>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={COLORS.textSecondary} style={{ marginRight: SPACING.sm }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email or NIC..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? <ActivityIndicator color={COLORS.adminPrimary} style={{ marginTop: 40 }} /> : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.adminPrimary} />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.avatar}><Text style={{ fontSize: 20 }}>🧑</Text></View>
                <View style={styles.info}>
                  <Text style={styles.name}>{item.name}</Text>
                  {item.email && <Text style={styles.detail}>✉️ {item.email}</Text>}
                  {item.nic && <Text style={styles.detail}>🪪 {item.nic}</Text>}
                  {item.phone && <Text style={styles.detail}>📞 {item.phone}</Text>}
                </View>
                <View style={[styles.activeBadge, { backgroundColor: item.isActive !== false ? COLORS.success + '22' : COLORS.error + '22' }]}>
                  <Text style={{ color: item.isActive !== false ? COLORS.success : COLORS.error, fontSize: 10, fontWeight: '700' }}>
                    {item.isActive !== false ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.toggleBtn, { borderColor: (item.isActive !== false ? COLORS.error : COLORS.success) + '44' }]}
                onPress={() => toggleActive(item._id, item.isActive !== false)}
                disabled={togglingId === item._id}
              >
                {togglingId === item._id
                  ? <ActivityIndicator size="small" color={COLORS.adminPrimary} />
                  : <Text style={[styles.toggleText, { color: item.isActive !== false ? COLORS.error : COLORS.success }]}>
                      {item.isActive !== false ? 'Deactivate Account' : 'Activate Account'}
                    </Text>
                }
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No patients found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.md,
    backgroundColor: COLORS.bgCard, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  title: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.textPrimary },
  subtitle: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', margin: SPACING.lg,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, borderWidth: 1,
    borderColor: COLORS.border, paddingHorizontal: SPACING.md, height: 48,
  },
  searchInput: { flex: 1, color: COLORS.textPrimary, fontSize: FONT_SIZES.base },
  list: { paddingHorizontal: SPACING.lg, paddingBottom: 80 },
  card: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: SPACING.md,
    marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.sm },
  avatar: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.bgElevated,
    justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md,
  },
  info: { flex: 1 },
  name: { fontSize: FONT_SIZES.base, fontWeight: '700', color: COLORS.textPrimary },
  detail: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  activeBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full },
  toggleBtn: {
    paddingVertical: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 1,
    alignItems: 'center',
  },
  toggleText: { fontSize: FONT_SIZES.sm, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: COLORS.textMuted, marginTop: SPACING.md },
});
