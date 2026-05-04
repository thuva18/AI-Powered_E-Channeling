// app/(doctor)/patients.jsx
// Doctor's patients list – fully theme-reactive

import { useEffect, useState, useCallback } from 'react';
import useStyles from '../../hooks/useStyles';
import useTheme from '../../hooks/useTheme';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  ActivityIndicator, RefreshControl, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import ScreenTransition from '../../components/common/ScreenTransition';
import { FONT_SIZES, SPACING, RADIUS } from '../../constants/theme';

export default function DoctorPatientsScreen() {
  const styles = useStyles(getStyles);
  const { C } = useTheme();
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
    setFiltered(q ? patients.filter((p) => p.name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q)) : patients);
  }, [search, patients]);

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ').filter(Boolean);
    return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : parts[0][0];
  };

  const AVATAR_COLORS = ['#4E9AF1', '#22C9A0', '#9B59F5', '#F5A623', '#E84545', '#38BDF8'];

  return (
    <ScreenTransition style={styles.root}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Patients</Text>
          <Text style={styles.subtitle}>{patients.length} total · {filtered.length} shown</Text>
        </View>
        <View style={styles.headerBadge}>
          <Ionicons name="people" size={18} color={C.doctorPrimary} />
        </View>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={C.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email…"
          placeholderTextColor={C.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={C.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? <ActivityIndicator color={C.doctorPrimary} style={{ marginTop: 40 }} /> : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.doctorPrimary} />}
          renderItem={({ item, index }) => {
            const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
            const initials = getInitials(item.name).toUpperCase();
            return (
              <View style={styles.card}>
                <View style={[styles.avatar, { backgroundColor: `${color}18` }]}>
                  <Text style={[styles.avatarText, { color }]}>{initials}</Text>
                </View>
                <View style={styles.info}>
                  <Text style={styles.name}>{item.name}</Text>
                  {item.email && (
                    <View style={styles.detailRow}>
                      <Ionicons name="mail-outline" size={11} color={C.textMuted} />
                      <Text style={styles.detail}>{item.email}</Text>
                    </View>
                  )}
                  {item.phone && (
                    <View style={styles.detailRow}>
                      <Ionicons name="call-outline" size={11} color={C.textMuted} />
                      <Text style={styles.detail}>{item.phone}</Text>
                    </View>
                  )}
                </View>
                {item.totalAppointments != null && (
                  <View style={styles.visitBadge}>
                    <Text style={styles.visitCount}>{item.totalAppointments}</Text>
                    <Text style={styles.visitLabel}>visits</Text>
                  </View>
                )}
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="people-outline" size={32} color={C.doctorPrimary} />
              </View>
              <Text style={styles.emptyTitle}>No patients found</Text>
              <Text style={styles.emptySubtitle}>
                {search ? 'Try a different search term' : 'Your patient list will appear here'}
              </Text>
            </View>
          }
        />
      )}
    </ScreenTransition>
  );
}

const getStyles = (C, isDark, S) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.md,
    backgroundColor: C.headerBg,
    borderBottomWidth: 1, borderBottomColor: C.headerBorder,
  },
  title: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: C.textPrimary },
  subtitle: { fontSize: FONT_SIZES.xs, color: C.textSecondary, marginTop: 2 },
  headerBadge: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: `${C.doctorPrimary}15`, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: `${C.doctorPrimary}30`,
  },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    backgroundColor: isDark ? C.bgElevated : C.bgCard,
    borderRadius: RADIUS.md, borderWidth: 1,
    borderColor: C.border, paddingHorizontal: SPACING.md, height: 48, gap: SPACING.sm,
  },
  searchInput: { flex: 1, color: C.textPrimary, fontSize: FONT_SIZES.base },
  list: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: 100 },
  card: {
    backgroundColor: isDark ? 'rgba(17, 24, 39, 0.9)' : C.bgCard,
    borderRadius: RADIUS.lg, padding: SPACING.md,
    flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.06)' : C.border,
    ...S.sm,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md,
  },
  avatarText: { fontSize: FONT_SIZES.base, fontWeight: '800' },
  info: { flex: 1 },
  name: { fontSize: FONT_SIZES.base, fontWeight: '700', color: C.textPrimary },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  detail: { fontSize: FONT_SIZES.xs, color: C.textSecondary },
  visitBadge: {
    alignItems: 'center', backgroundColor: `${C.doctorPrimary}12`,
    paddingHorizontal: SPACING.sm, paddingVertical: 6, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: `${C.doctorPrimary}22`,
  },
  visitCount: { fontSize: FONT_SIZES.lg, fontWeight: '800', color: C.doctorPrimary },
  visitLabel: { fontSize: 9, color: C.textMuted, fontWeight: '600', textTransform: 'uppercase' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: `${C.doctorPrimary}15`, justifyContent: 'center', alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: { fontSize: FONT_SIZES.base, fontWeight: '700', color: C.textPrimary },
  emptySubtitle: { fontSize: FONT_SIZES.sm, color: C.textMuted, marginTop: 4 },
});
