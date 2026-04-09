// app/(doctor)/patients.tsx
// Doctor's patient list screen

import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  ActivityIndicator, RefreshControl, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

export default function DoctorPatientsScreen() {
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
    setFiltered(
      q ? patients.filter((p) =>
        p.name.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q) || p.phone?.includes(q),
      ) : patients,
    );
  }, [search, patients]);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={{ fontSize: 20 }}>🧑‍⚕️</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        {item.email && <Text style={styles.email}>✉️ {item.email}</Text>}
        {item.phone && <Text style={styles.contact}>📞 {item.phone}</Text>}
        {item.gender && <Text style={styles.detail}>⚧ {item.gender}</Text>}
      </View>
      {item.totalAppointments != null && (
        <View style={styles.aptCountBox}>
          <Text style={styles.aptCountVal}>{item.totalAppointments}</Text>
          <Text style={styles.aptCountLabel}>visits</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>My Patients</Text>
        <Text style={styles.subtitle}>{patients.length} total</Text>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={COLORS.textSecondary} style={{ marginRight: SPACING.sm }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email or phone..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? <ActivityIndicator color={COLORS.doctorPrimary} style={{ marginTop: 40 }} /> : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.doctorPrimary} />}
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
    flexDirection: 'row', alignItems: 'center',
    margin: SPACING.lg, backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md, height: 48,
  },
  searchInput: { flex: 1, color: COLORS.textPrimary, fontSize: FONT_SIZES.base },
  list: { paddingHorizontal: SPACING.lg, paddingBottom: 80 },
  card: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, padding: SPACING.md,
    flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm,
  },
  avatar: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.bgElevated,
    justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md,
  },
  info: { flex: 1 },
  name: { fontSize: FONT_SIZES.base, fontWeight: '700', color: COLORS.textPrimary },
  email: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  contact: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  detail: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 2 },
  aptCountBox: { alignItems: 'center' },
  aptCountVal: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.doctorPrimary },
  aptCountLabel: { fontSize: 10, color: COLORS.textMuted },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: COLORS.textMuted, marginTop: SPACING.md },
});
