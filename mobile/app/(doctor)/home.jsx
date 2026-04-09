// app/(doctor)/home.jsx
// Premium Doctor Dashboard

import { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

function statusColor(status) {
  switch (status?.toLowerCase()) {
    case 'accepted':
    case 'confirmed': return COLORS.success;
    case 'pending': return COLORS.warning;
    case 'cancelled': return COLORS.error;
    case 'completed': return COLORS.info;
    default: return COLORS.textSecondary;
  }
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DoctorHomeScreen() {
  const { user, clearUser } = useAuthStore();
  const router = useRouter();
  const [analytics, setAnalytics] = useState(null);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchData = async () => {
    try {
      const [analyticsRes, aptsRes] = await Promise.all([
        api.get('/doctors/analytics'),
        api.get('/doctors/appointments'),
      ]);
      setAnalytics(analyticsRes.data);
      const today = new Date().toDateString();
      setTodayAppointments(
        (aptsRes.data || []).filter((a) =>
          new Date(a.appointmentDate).toDateString() === today,
        ).slice(0, 5),
      );
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    } catch { console.error('Failed to fetch doctor dashboard'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchData(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const statCards = [
    { label: "Today", value: todayAppointments.length, icon: 'today-outline', color: COLORS.doctorPrimary },
    { label: 'Total', value: analytics?.totalAppointments ?? 0, icon: 'calendar', color: COLORS.primary },
    { label: 'Pending', value: analytics?.pendingAppointments ?? 0, icon: 'time-outline', color: COLORS.warning },
    { label: 'Patients', value: analytics?.totalPatients ?? 0, icon: 'people', color: '#9B59F5' },
  ];

  const quickActions = [
    { label: 'Appointments', icon: 'calendar', route: '/(doctor)/appointments', color: COLORS.primary },
    { label: 'My Patients', icon: 'people', route: '/(doctor)/patients', color: COLORS.doctorPrimary },
    { label: 'Journal', icon: 'book', route: '/(doctor)/journal', color: '#9B59F5' },
    { label: 'My Profile', icon: 'person', route: '/(doctor)/profile', color: COLORS.warning },
  ];

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarWrap}>
            <Text style={{ fontSize: 22 }}>👨‍⚕️</Text>
          </View>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.name}>Dr. {user?.name ?? 'Doctor'}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={async () => { await clearUser(); router.replace('/(auth)/login'); }}
        >
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.doctorPrimary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Date Banner */}
        <View style={styles.dateBanner}>
          <View>
            <Text style={styles.dateBannerLabel}>TODAY</Text>
            <Text style={styles.dateBannerDate}>{today}</Text>
          </View>
          <View style={styles.dateBannerBadge}>
            <Ionicons name="today-outline" size={14} color={COLORS.doctorPrimary} />
            <Text style={styles.dateBannerCount}>{todayAppointments.length} appts</Text>
          </View>
        </View>

        {/* Stats */}
        {loading ? (
          <View style={styles.statsGrid}>
            {[0, 1, 2, 3].map(i => <View key={i} style={[styles.statCard, styles.skeleton]} />)}
          </View>
        ) : (
          <Animated.View style={[styles.statsGrid, { opacity: fadeAnim }]}>
            {statCards.map((s) => (
              <View key={s.label} style={[styles.statCard, { borderTopColor: s.color }]}>
                <View style={[styles.statIconBox, { backgroundColor: `${s.color}18` }]}>
                  <Ionicons name={s.icon} size={20} color={s.color} />
                </View>
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Today's Appointments */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Today's Schedule</Text>
          <TouchableOpacity onPress={() => router.push('/(doctor)/appointments')}>
            <Text style={styles.seeAll}>View all</Text>
          </TouchableOpacity>
        </View>

        {todayAppointments.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="calendar-outline" size={28} color={COLORS.doctorPrimary} />
            </View>
            <Text style={styles.emptyTitle}>Clear schedule</Text>
            <Text style={styles.emptyText}>No appointments booked for today</Text>
          </View>
        ) : (
          todayAppointments.map((apt) => (
            <View key={apt._id} style={[styles.aptCard, { borderLeftColor: statusColor(apt.status) }]}>
              <View style={styles.aptAvatarWrap}>
                <Text style={{ fontSize: 18 }}>🧑</Text>
              </View>
              <View style={styles.aptInfo}>
                <Text style={styles.aptPatient}>{apt.patient?.name ?? 'Patient'}</Text>
                <Text style={styles.aptTime}>{apt.timeSlot ?? 'Scheduled'}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: statusColor(apt.status) + '22' }]}>
                <Text style={[styles.statusText, { color: statusColor(apt.status) }]}>{apt.status}</Text>
              </View>
            </View>
          ))
        )}

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { marginTop: SPACING.md, marginBottom: SPACING.sm }]}>Quick Access</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((a) => (
            <TouchableOpacity key={a.label} style={styles.actionCard} onPress={() => router.push(a.route)} activeOpacity={0.8}>
              <View style={[styles.actionIconWrap, { backgroundColor: `${a.color}18` }]}>
                <Ionicons name={a.icon} size={24} color={a.color} />
              </View>
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
    paddingHorizontal: SPACING.lg, paddingTop: 60, paddingBottom: SPACING.md,
    backgroundColor: 'rgba(17, 24, 39, 0.98)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  avatarWrap: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: `${COLORS.doctorPrimary}20`, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: `${COLORS.doctorPrimary}40`,
  },
  greeting: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  name: { fontSize: FONT_SIZES.md, fontWeight: '800', color: COLORS.textPrimary },
  logoutBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: `${COLORS.error}18`, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  content: { padding: SPACING.lg, paddingBottom: 100 },
  dateBanner: {
    backgroundColor: 'rgba(17, 24, 39, 0.9)',
    borderRadius: RADIUS.lg, padding: SPACING.md,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: SPACING.lg, borderWidth: 1,
    borderColor: `${COLORS.doctorPrimary}30`, borderLeftWidth: 4, borderLeftColor: COLORS.doctorPrimary,
    ...SHADOWS.glowGreen,
  },
  dateBannerLabel: { fontSize: 10, color: COLORS.doctorPrimary, fontWeight: '800', letterSpacing: 2, marginBottom: 2 },
  dateBannerDate: { fontSize: FONT_SIZES.base, fontWeight: '700', color: COLORS.textPrimary },
  dateBannerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: `${COLORS.doctorPrimary}18`, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: `${COLORS.doctorPrimary}33`,
  },
  dateBannerCount: { fontSize: FONT_SIZES.xs, color: COLORS.doctorPrimary, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.lg },
  statCard: {
    flex: 1, minWidth: '45%', backgroundColor: 'rgba(17, 24, 39, 0.9)',
    borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderTopWidth: 3, ...SHADOWS.md,
  },
  skeleton: { height: 100, backgroundColor: 'rgba(30, 40, 64, 0.8)' },
  statIconBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.xs },
  statValue: { fontSize: FONT_SIZES.xxl, fontWeight: '900' },
  statLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 2, fontWeight: '600', textTransform: 'uppercase' },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  sectionTitle: { fontSize: FONT_SIZES.sm, fontWeight: '800', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 },
  seeAll: { fontSize: FONT_SIZES.xs, color: COLORS.doctorPrimary, fontWeight: '700' },
  emptyBox: {
    backgroundColor: 'rgba(17, 24, 39, 0.9)', borderRadius: RADIUS.xl,
    padding: SPACING.xl, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: SPACING.lg,
  },
  emptyIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: `${COLORS.doctorPrimary}18`, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md },
  emptyTitle: { fontSize: FONT_SIZES.base, fontWeight: '700', color: COLORS.textPrimary },
  emptyText: { color: COLORS.textMuted, fontSize: FONT_SIZES.sm, marginTop: 4 },
  aptCard: {
    backgroundColor: 'rgba(17, 24, 39, 0.9)', borderRadius: RADIUS.lg, padding: SPACING.md,
    flexDirection: 'row', alignItems: 'center',
    marginBottom: SPACING.sm, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    borderLeftWidth: 4,
  },
  aptAvatarWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md,
  },
  aptInfo: { flex: 1 },
  aptPatient: { fontSize: FONT_SIZES.base, fontWeight: '700', color: COLORS.textPrimary },
  aptTime: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 2, textTransform: 'capitalize' },
  statusBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 5, borderRadius: RADIUS.full },
  statusText: { fontSize: FONT_SIZES.xs, fontWeight: '700', textTransform: 'capitalize' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  actionCard: {
    flex: 1, minWidth: '45%', backgroundColor: 'rgba(17, 24, 39, 0.9)',
    borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: 'center', gap: SPACING.sm,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', ...SHADOWS.sm,
  },
  actionIconWrap: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  actionLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, textAlign: 'center', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
});
