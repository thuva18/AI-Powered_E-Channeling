// app/(patient)/home.jsx
// Premium Patient Dashboard

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
    case 'confirmed': return COLORS.success;
    case 'accepted': return COLORS.success;
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

export default function PatientHomeScreen() {
  const router = useRouter();
  const { user, clearUser } = useAuthStore();
  const [analytics, setAnalytics] = useState(null);
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchData = async () => {
    try {
      const [analyticsRes, appointmentsRes] = await Promise.all([
        api.get('/patients/analytics'),
        api.get('/patients/appointments'),
      ]);
      setAnalytics(analyticsRes.data);
      setRecentAppointments((appointmentsRes.data || []).slice(0, 3));
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
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

  const quickActions = [
    { label: 'Find Doctors', icon: 'search', route: '/(patient)/book', color: COLORS.primary },
    { label: 'Appointments', icon: 'list', route: '/(patient)/appointments', color: COLORS.accent },
    { label: 'Payments', icon: 'card', route: '/(patient)/payments', color: COLORS.warning },
    { label: 'My Profile', icon: 'person', route: '/(patient)/profile', color: '#9B59F5' },
  ];

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarWrap}>
            <Text style={{ fontSize: 20 }}>🧑‍💼</Text>
          </View>
          <View>
            <Text style={styles.greeting}>{getGreeting()} 👋</Text>
            <Text style={styles.userName}>{user?.name ?? 'Patient'}</Text>
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* CTA Banner */}
        <TouchableOpacity style={styles.banner} onPress={() => router.push('/(patient)/book')} activeOpacity={0.85}>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerEyebrow}>AI POWERED</Text>
            <Text style={styles.bannerTitle}>Book an Appointment</Text>
            <Text style={styles.bannerSub}>Smart doctor matching via AI</Text>
          </View>
          <View style={styles.bannerIconContainer}>
            <Ionicons name="medical" size={36} color={COLORS.primary} />
          </View>
        </TouchableOpacity>

        {/* Stats */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Health Summary</Text>
        </View>
        {loading ? (
          <View style={styles.statsGrid}>
            {[0, 1, 2, 3].map(i => <View key={i} style={[styles.statCard, styles.skeleton]} />)}
          </View>
        ) : (
          <Animated.View style={[styles.statsGrid, { opacity: fadeAnim }]}>
            {statCards.map((s) => (
              <View key={s.label} style={[styles.statCard, { borderTopColor: s.color }]}>
                <View style={[styles.statIconWrap, { backgroundColor: `${s.color}18` }]}>
                  <Ionicons name={s.icon} size={20} color={s.color} />
                </View>
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Recent Appointments */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Recent Appointments</Text>
          <TouchableOpacity onPress={() => router.push('/(patient)/appointments')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        {recentAppointments.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="calendar-outline" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>No appointments yet</Text>
            <Text style={styles.emptyText}>Book your first appointment with an AI-matched doctor</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(patient)/book')}>
              <Text style={styles.emptyBtnText}>Book Now →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          recentAppointments.map((apt, i) => (
            <View key={apt._id ?? i} style={styles.aptCard}>
              <View style={[styles.aptLeft, { borderLeftColor: statusColor(apt.status) }]}>
                <Text style={styles.aptDoctor}>Dr. {apt.doctor?.name ?? 'Unknown'}</Text>
                <Text style={styles.aptSpec}>{apt.doctor?.specialization ?? ''}</Text>
                <Text style={styles.aptDate}>
                  {apt.appointmentDate ? new Date(apt.appointmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}
                </Text>
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
        <Text style={[styles.sectionTitle, { marginTop: SPACING.md, marginBottom: SPACING.sm }]}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.actionCard}
              onPress={() => router.push(action.route)}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: `${action.color}18` }]}>
                <Ionicons name={action.icon} size={24} color={action.color} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
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
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: `${COLORS.primary}20`, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: `${COLORS.primary}40`,
  },
  greeting: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, fontWeight: '600' },
  userName: { fontSize: FONT_SIZES.md, fontWeight: '800', color: COLORS.textPrimary },
  logoutBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: `${COLORS.error}18`, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  content: { padding: SPACING.lg, paddingBottom: 100 },
  banner: {
    backgroundColor: 'rgba(17, 24, 39, 0.9)',
    borderRadius: RADIUS.xl, padding: SPACING.lg,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 1, borderColor: `${COLORS.primary}30`,
    borderLeftWidth: 4, borderLeftColor: COLORS.primary,
    ...SHADOWS.glowBlue,
  },
  bannerContent: { flex: 1 },
  bannerEyebrow: { fontSize: 10, color: COLORS.primary, fontWeight: '800', letterSpacing: 1.5, marginBottom: 4 },
  bannerTitle: { fontSize: FONT_SIZES.md, fontWeight: '800', color: COLORS.textPrimary },
  bannerSub: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  bannerIconContainer: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: `${COLORS.primary}18`, justifyContent: 'center', alignItems: 'center',
  },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  sectionTitle: { fontSize: FONT_SIZES.sm, fontWeight: '800', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 },
  seeAll: { fontSize: FONT_SIZES.xs, color: COLORS.primary, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.lg },
  statCard: {
    flex: 1, minWidth: '45%', backgroundColor: 'rgba(17, 24, 39, 0.9)',
    borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderTopWidth: 3, ...SHADOWS.md,
  },
  skeleton: { height: 100, backgroundColor: 'rgba(30, 40, 64, 0.8)' },
  statIconWrap: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.xs },
  statValue: { fontSize: FONT_SIZES.xxl, fontWeight: '900' },
  statLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 2, fontWeight: '600', textTransform: 'uppercase' },
  emptyBox: {
    backgroundColor: 'rgba(17, 24, 39, 0.9)', borderRadius: RADIUS.xl,
    padding: SPACING.xl, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: SPACING.lg,
  },
  emptyIconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: `${COLORS.primary}18`, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md,
  },
  emptyTitle: { fontSize: FONT_SIZES.base, fontWeight: '700', color: COLORS.textPrimary },
  emptyText: { color: COLORS.textMuted, fontSize: FONT_SIZES.sm, marginTop: 4, textAlign: 'center', lineHeight: 20 },
  emptyBtn: { marginTop: SPACING.md, backgroundColor: `${COLORS.primary}22`, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, borderWidth: 1, borderColor: `${COLORS.primary}44` },
  emptyBtnText: { color: COLORS.primary, fontSize: FONT_SIZES.sm, fontWeight: '700' },
  aptCard: {
    backgroundColor: 'rgba(17, 24, 39, 0.9)', borderRadius: RADIUS.lg, padding: SPACING.md,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: SPACING.sm, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  aptLeft: { flex: 1, borderLeftWidth: 3, paddingLeft: SPACING.sm },
  aptDoctor: { fontSize: FONT_SIZES.base, fontWeight: '700', color: COLORS.textPrimary },
  aptSpec: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 1 },
  aptDate: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 4 },
  aptBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 5, borderRadius: RADIUS.full, marginLeft: SPACING.sm },
  aptBadgeText: { fontSize: FONT_SIZES.xs, fontWeight: '700', textTransform: 'capitalize' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  actionCard: {
    flex: 1, minWidth: '45%', backgroundColor: 'rgba(17, 24, 39, 0.9)',
    borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: 'center', gap: SPACING.sm,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', ...SHADOWS.sm,
  },
  actionIconWrap: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  actionLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, textAlign: 'center', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
});
