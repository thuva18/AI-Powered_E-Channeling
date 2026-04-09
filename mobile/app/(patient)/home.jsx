// app/(patient)/home.tsx
// Patient Dashboard screen

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

// Types removed
export default function PatientHomeScreen() {
  const router = useRouter();
  const { user, clearUser } = useAuthStore();
  const [analytics, setAnalytics] = useState(null);
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [analyticsRes, appointmentsRes] = await Promise.all([
        api.get('/patients/analytics'),
        api.get('/patients/appointments'),
      ]);
      setAnalytics(analyticsRes.data);
      setRecentAppointments((appointmentsRes.data || []).slice(0, 3));
    } catch (e) {
      console.error('Failed to fetch dashboard data', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const statCards = [
    { label: 'Total', value: analytics?.totalAppointments ?? 0, icon: 'calendar', color: COLORS.primary },
    { label: 'Upcoming', value: analytics?.upcomingAppointments ?? 0, icon: 'time-outline', color: COLORS.warning },
    { label: 'Completed', value: analytics?.completedAppointments ?? 0, icon: 'checkmark-circle', color: COLORS.success },
    { label: 'Cancelled', value: analytics?.cancelledAppointments ?? 0, icon: 'close-circle', color: COLORS.error },
  ];

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good day, 👋</Text>
          <Text style={styles.userName}>{user?.name ?? 'Patient'}</Text>
        </View>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={async () => { await clearUser(); router.replace('/(auth)/login'); }}
        >
          <Ionicons name="log-out-outline" size={22} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* CTA Banner */}
        <TouchableOpacity style={styles.banner} onPress={() => router.push('/(patient)/book')} activeOpacity={0.85}>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>Book an Appointment</Text>
            <Text style={styles.bannerSub}>AI-powered doctor matching</Text>
          </View>
          <View style={styles.bannerIconContainer}>
            <Ionicons name="medical" size={32} color={COLORS.primary} />
          </View>
        </TouchableOpacity>

        {/* Stats */}
        <Text style={styles.sectionTitle}>Your Health Summary</Text>
        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
        ) : (
          <View style={styles.statsGrid}>
            {statCards.map((s) => (
              <View key={s.label} style={styles.statCard}>
                <Ionicons name={s.icon as any} size={24} color={s.color} />
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Recent Appointments */}
        <Text style={styles.sectionTitle}>Recent Appointments</Text>
        {recentAppointments.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="calendar-outline" size={32} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No appointments yet</Text>
            <TouchableOpacity onPress={() => router.push('/(patient)/book')}>
              <Text style={styles.emptyLink}>Book your first appointment →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          recentAppointments.map((apt, i) => (
            <View key={apt._id ?? i} style={styles.aptCard}>
              <View style={styles.aptLeft}>
                <Text style={styles.aptDoctor}>Dr. {apt.doctor?.name ?? 'Unknown'}</Text>
                <Text style={styles.aptSpec}>{apt.doctor?.specialization ?? ''}</Text>
                <Text style={styles.aptDate}>{apt.appointmentDate ? new Date(apt.appointmentDate).toLocaleDateString() : 'TBD'}</Text>
              </View>
              <View style={[styles.aptBadge, { backgroundColor: statusColor(apt.status) + '22' }]}>
                <Text style={[styles.aptBadgeText, { color: statusColor(apt.status) }]}>
                  {apt.status ?? 'Pending'}
                </Text>
              </View>
            </View>
          ))
        )}

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {[
            { label: 'Find Doctors', icon: 'search', route: '/(patient)/book' },
            { label: 'My Appointments', icon: 'list', route: '/(patient)/appointments' },
            { label: 'Payments', icon: 'card', route: '/(patient)/payments' },
            { label: 'My Profile', icon: 'person', route: '/(patient)/profile' },
          ].map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.actionCard}
              onPress={() => router.push(action.route as any)}
              activeOpacity={0.8}
            >
              <Ionicons name={action.icon as any} size={22} color={COLORS.primary} />
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function statusColor(status) {
  switch (status?.toLowerCase()) {
    case 'confirmed': return COLORS.success;
    case 'pending': return COLORS.warning;
    case 'cancelled': return COLORS.error;
    case 'completed': return COLORS.info;
    default: return COLORS.textSecondary;
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.md,
    backgroundColor: COLORS.bgCard, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  greeting: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  userName: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textPrimary },
  logoutBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: `${COLORS.error}1A`, justifyContent: 'center', alignItems: 'center',
  },
  scroll: { flex: 1 },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  banner: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    padding: SPACING.lg, flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.borderLight,
    borderLeftWidth: 4, borderLeftColor: COLORS.primary, ...SHADOWS.md,
  },
  bannerContent: { flex: 1 },
  bannerTitle: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textPrimary },
  bannerSub: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 4 },
  bannerIconContainer: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: `${COLORS.primary}22`, justifyContent: 'center', alignItems: 'center',
  },
  sectionTitle: {
    fontSize: FONT_SIZES.base, fontWeight: '700', color: COLORS.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SPACING.md,
    marginTop: SPACING.md,
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md },
  statCard: {
    flex: 1, minWidth: '45%', backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm,
  },
  statValue: { fontSize: FONT_SIZES.xxl, fontWeight: '800', marginTop: 4 },
  statLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  emptyBox: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    padding: SPACING.xl, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  emptyText: { color: COLORS.textMuted, fontSize: FONT_SIZES.base, marginTop: SPACING.sm },
  emptyLink: { color: COLORS.primary, fontSize: FONT_SIZES.sm, marginTop: SPACING.sm, fontWeight: '600' },
  aptCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, padding: SPACING.md,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border,
  },
  aptLeft: { flex: 1 },
  aptDoctor: { fontSize: FONT_SIZES.base, fontWeight: '600', color: COLORS.textPrimary },
  aptSpec: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  aptDate: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 4 },
  aptBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full },
  aptBadgeText: { fontSize: FONT_SIZES.xs, fontWeight: '600', textTransform: 'capitalize' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  actionCard: {
    flex: 1, minWidth: '45%', backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', gap: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm,
  },
  actionLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, textAlign: 'center', fontWeight: '600' },
});
