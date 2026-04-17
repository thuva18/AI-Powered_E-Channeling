// app/(doctor)/patients.tsx
// Doctor's patients list

import { useEffect, useState, useCallback } from 'react';
import useStyles from '../../hooks/useStyles';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { COLORS as C, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

// Types removed

export default function DoctorPatientsScreen() {
  const styles = useStyles(getStyles);
  const [patients, setPatients] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchPatients = useCallback(async () => {
    try {
      const res = await api.get('/doctors/patients');
      setPatients(res.data || []);
      setFiltered(res.data || []);
    } catch { console.error('Failed to load patients'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchPatients(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchPatients(); };

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(q ? patients.filter((p) => p.name.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q)) : patients);
  }, [search, patients]);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>My Patients</Text>
        <Text style={styles.subtitle}>{patients.length} total</Text>
      </View>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={C.textSecondary} style={{ marginRight: SPACING.sm }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search patients..."
          placeholderTextColor={C.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>
      {loading ? <ActivityIndicator color={C.doctorPrimary} style={{ marginTop: 40 }} /> : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.doctorPrimary} />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.avatar}><Text style={{ fontSize: 20 }}>🧑</Text></View>
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                {item.email && <Text style={styles.detail}>✉️ {item.email}</Text>}
                {item.phone && <Text style={styles.detail}>📞 {item.phone}</Text>}
              </View>
              {item.totalAppointments != null && (
                <View style={styles.badge}>
                  <Text style={styles.badgeVal}>{item.totalAppointments}</Text>
                  <Text style={styles.badgeLbl}>visits</Text>
                </View>
              )}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={40} color={C.textMuted} />
              <Text style={styles.emptyText}>No patients found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const getStyles = (C, isDark) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.md,
    backgroundColor: C.bgCard, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  title: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: C.textPrimary },
  subtitle: { fontSize: FONT_SIZES.sm, color: C.textSecondary },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', margin: SPACING.lg,
    backgroundColor: C.bgCard, borderRadius: RADIUS.md, borderWidth: 1,
    borderColor: C.border, paddingHorizontal: SPACING.md, height: 48,
  },
  searchInput: { flex: 1, color: C.textPrimary, fontSize: FONT_SIZES.base },
  list: { paddingHorizontal: SPACING.lg, paddingBottom: 80 },
  card: {
    backgroundColor: C.bgCard, borderRadius: RADIUS.md, padding: SPACING.md,
    flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: C.border, ...SHADOWS.sm,
  },
  avatar: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: C.bgElevated,
    justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md,
  },
  info: { flex: 1 },
  name: { fontSize: FONT_SIZES.base, fontWeight: '700', color: C.textPrimary },
  detail: { fontSize: FONT_SIZES.xs, color: C.textSecondary, marginTop: 2 },
  badge: { alignItems: 'center' },
  badgeVal: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: C.doctorPrimary },
  badgeLbl: { fontSize: 10, color: C.textMuted },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: C.textMuted, marginTop: SPACING.md },
});
