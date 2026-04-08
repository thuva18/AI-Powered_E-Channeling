// app/(admin)/home.tsx
// Admin Dashboard screen

import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

export default function AdminHomeScreen() {
  const { user, clearUser } = useAuthStore();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<any>(null);
  const [pendingDoctors, setPendingDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [analyticsRes, pendingRes] = await Promise.all([
        api.get('/admin/analytics'),
        api.get('/admin/doctors/pending'),
      ]);
      setAnalytics(analyticsRes.data);
      setPendingDoctors((pendingRes.data || []).slice(0, 5));
    } catch { console.error('Admin dashboard fetch failed'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchData(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const statCards = [
    { label: 'Total Doctors', value: analytics?.totalDoctors ?? 0, icon: 'medical', color: COLORS.adminPrimary },
    { label: 'Total Patients', value: analytics?.totalPatients ?? 0, icon: 'people', color: COLORS.primary },
    { label: 'Appointments', value: analytics?.totalAppointments ?? 0, icon: 'calendar', color: COLORS.accent },
    { label: 'Pending', value: analytics?.pendingDoctors ?? pendingDoctors.length, icon: 'time-outline', color: COLORS.warning },
  ];

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Admin Panel 👤</Text>
          <Text style={styles.name}>{user?.name ?? 'Administrator'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={async () => { await clearUser(); router.replace('/(auth)/login'); }}>
          <Ionicons name="log-out-outline" size={22} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll} contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.adminPrimary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats */}
        {loading ? <ActivityIndicator color={COLORS.adminPrimary} style={{ marginTop: 20 }} /> : (
          <View style={styles.statsGrid}>
            {statCards.map((s) => (
              <View key={s.label} style={[styles.statCard, { borderLeftColor: s.color }]}>
                <Ionicons name={s.icon as any} size={22} color={s.color} />
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Pending Doctor Approvals */}
        {pendingDoctors.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>⏳ Pending Approvals</Text>
            {pendingDoctors.map((doc) => (
              <View key={doc._id} style={styles.pendingCard}>
                <View style={styles.pendingAvatar}><Text style={{ fontSize: 20 }}>👨‍⚕️</Text></View>
                <View style={styles.pendingInfo}>
                  <Text style={styles.pendingName}>Dr. {doc.name}</Text>
                  <Text style={styles.pendingSpec}>{doc.specialization}</Text>
                </View>
                <TouchableOpacity
                  style={styles.approveBtn}
                  onPress={() => router.push('/(admin)/doctors')}
                >
                  <Text style={styles.approveBtnText}>Review</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {[
            { label: 'Manage Doctors', icon: 'medical', route: '/(admin)/doctors' },
            { label: 'Manage Patients', icon: 'people', route: '/(admin)/patients' },
          ].map((a) => (
            <TouchableOpacity key={a.label} style={styles.actionCard} onPress={() => router.push(a.route as any)} activeOpacity={0.8}>
              <Ionicons name={a.icon as any} size={26} color={COLORS.adminPrimary} />
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.md,
    backgroundColor: COLORS.bgCard, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  greeting: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  name: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textPrimary },
  logoutBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: `${COLORS.error}1A`, justifyContent: 'center', alignItems: 'center',
  },
  scroll: { flex: 1 },
  content: { padding: SPACING.lg, paddingBottom: 80 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md },
  statCard: {
    flex: 1, minWidth: '45%', backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border, borderLeftWidth: 4, ...SHADOWS.sm,
  },
  statValue: { fontSize: FONT_SIZES.xxl, fontWeight: '800', marginTop: 4 },
  statLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 2, textAlign: 'center' },
  sectionTitle: {
    fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SPACING.md, marginTop: SPACING.md,
  },
  pendingCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, padding: SPACING.md,
    flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: `${COLORS.warning}44`, ...SHADOWS.sm,
  },
  pendingAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.bgElevated,
    justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md,
  },
  pendingInfo: { flex: 1 },
  pendingName: { fontSize: FONT_SIZES.base, fontWeight: '600', color: COLORS.textPrimary },
  pendingSpec: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  approveBtn: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    backgroundColor: `${COLORS.adminPrimary}22`, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.adminPrimary,
  },
  approveBtnText: { color: COLORS.adminPrimary, fontWeight: '700', fontSize: FONT_SIZES.xs },
  actionsGrid: { flexDirection: 'row', gap: SPACING.md },
  actionCard: {
    flex: 1, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    padding: SPACING.lg, alignItems: 'center', gap: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.md,
  },
  actionLabel: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, textAlign: 'center', fontWeight: '600' },
});
