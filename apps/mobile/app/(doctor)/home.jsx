// app/(doctor)/home.jsx
// Premium Doctor Dashboard – theme aware with ThemeToggle

import { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Animated, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import useTheme from '../../hooks/useTheme';
import useStyles from '../../hooks/useStyles';
import ThemeToggle from '../../components/common/ThemeToggle';
import NotificationBell from '../../components/NotificationBell';
import { FONT_SIZES, SPACING, RADIUS } from '../../constants/theme';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DoctorHomeScreen() {
  const { user, clearUser } = useAuthStore();
  const { C, S, isDark } = useTheme();
  const styles = useStyles(getStyles);
  const router = useRouter();
  const [analytics, setAnalytics] = useState(null);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  function statusColor(status) {
    switch (status?.toLowerCase()) {
      case 'accepted':
      case 'confirmed': return C.success;
      case 'pending': return C.warning;
      case 'cancelled': return C.error;
      case 'completed': return C.info;
      default: return C.textSecondary;
    }
  }

  function statusIcon(status) {
    switch (status?.toLowerCase()) {
      case 'accepted':
      case 'confirmed': return 'checkmark-circle';
      case 'pending': return 'time';
      case 'cancelled': return 'close-circle';
      case 'completed': return 'checkmark-done-circle';
      default: return 'ellipse';
    }
  }

  const fetchData = async () => {
    try {
      const [analyticsRes, aptsRes, patientsRes] = await Promise.all([
        api.get('/doctors/analytics'),
        api.get('/doctors/appointments'),
        api.get('/doctors/patients'),
      ]);
      setAnalytics({ ...analyticsRes.data, totalPatients: patientsRes.data?.length ?? 0 });
      const todayStr = new Date().toDateString();
      setTodayAppointments(
        (aptsRes.data || []).filter((a) => new Date(a.appointmentDate).toDateString() === todayStr).slice(0, 5),
      );
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]).start();
    } catch (e) { console.error('Failed to fetch doctor dashboard', e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => {
    if (user && user.role === 'doctor') {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const statCards = [
    { label: 'Today',     value: todayAppointments.length,               icon: 'today-outline',    color: C.doctorPrimary },
    { label: 'Total',     value: analytics?.totalAppointments ?? 0,       icon: 'calendar',         color: C.primary },
    { label: 'Pending',   value: analytics?.pendingAppointments ?? 0,     icon: 'time-outline',     color: C.warning },
    { label: 'Patients',  value: analytics?.totalPatients ?? 0,           icon: 'people',           color: '#9B59F5' },
    { label: 'Completed', value: analytics?.completedAppointments ?? 0,   icon: 'checkmark-circle', color: C.success },
    { label: 'Revenue',   value: `Rs.${(analytics?.totalRevenue ?? 0).toLocaleString()}`, icon: 'cash-outline', color: C.info ?? '#38BDF8' },
  ];

  const quickActions = [
    { label: 'Appointments', icon: 'calendar', route: '/(doctor)/appointments', color: C.primary },
    { label: 'My Patients', icon: 'people', route: '/(doctor)/patients', color: C.doctorPrimary },
    { label: 'Journal', icon: 'book', route: '/(doctor)/journal', color: '#9B59F5' },
    { label: 'My Profile', icon: 'person', route: '/(doctor)/profile', color: C.warning },
  ];

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const doctorName = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user?.name ?? 'Doctor');

  return (
    <View style={styles.root}>
      {/* Header with gradient */}
      <View style={styles.headerWrap}>
        <LinearGradient
          colors={isDark ? [C.gradientDoctorStart, C.bg] : [C.gradientDoctorStart, C.bg]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        />
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarCircle}>
              <Ionicons name="medkit" size={22} color={C.doctorPrimary} />
            </View>
            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.doctorName}>Dr. {doctorName}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <NotificationBell size={38} />
            <ThemeToggle size={38} />
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={async () => { await clearUser(); router.replace('/(auth)/login'); }}
            >
              <Ionicons name="log-out-outline" size={20} color={C.error} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.doctorPrimary} />}
        showsVerticalScrollIndicator={false}
      >

        {/* Date Banner */}
        <View style={styles.dateBanner}>
          <View>
            <Text style={styles.dateLabelSmall}>TODAY</Text>
            <Text style={styles.dateText}>{today}</Text>
          </View>
          <View style={styles.dateBadge}>
            <Ionicons name="today-outline" size={14} color={C.doctorPrimary} />
            <Text style={styles.dateBadgeText}>{todayAppointments.length} appts</Text>
          </View>
        </View>

        {/* Stats */}
        {loading ? (
          <View style={styles.skeletonRow}>
            {[0, 1, 2, 3].map(i => (
              <View key={i} style={styles.skeletonCard}>
                <ActivityIndicator size="small" color={C.textMuted} />
              </View>
            ))}
          </View>
        ) : (
          <Animated.View style={[styles.statsGrid, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            {statCards.map((s) => (
              <TouchableOpacity
                key={s.label}
                activeOpacity={0.7}
                onPress={() => {
                  if (s.label === 'Patients') router.push('/(doctor)/patients');
                  else if (s.label === 'Revenue') router.push('/(doctor)/profile');
                  else router.push('/(doctor)/appointments');
                }}
                style={styles.statCard}
              >
                <View style={[styles.statIconWrap, { backgroundColor: `${s.color}15` }]}>
                  <Ionicons name={s.icon} size={20} color={s.color} />
                </View>
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
                <View style={[styles.statAccent, { backgroundColor: s.color }]} />
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}

        {/* Today's Appointments */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Today's Schedule</Text>
          <TouchableOpacity onPress={() => router.push('/(doctor)/appointments')} hitSlop={8}>
            <Text style={styles.seeAllText}>View all →</Text>
          </TouchableOpacity>
        </View>

        {todayAppointments.length === 0 ? (
          <View style={styles.emptySchedule}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="calendar-outline" size={32} color={C.doctorPrimary} />
            </View>
            <Text style={styles.emptyTitle}>Clear schedule</Text>
            <Text style={styles.emptySubtitle}>No appointments booked for today</Text>
          </View>
        ) : (
          todayAppointments.map((apt, index) => (
            <Animated.View
              key={apt._id}
              style={[
                styles.appointmentCard,
                { borderLeftColor: statusColor(apt.status) },
              ]}
            >
              <View style={[styles.aptAvatarWrap, { backgroundColor: `${statusColor(apt.status)}12` }]}>
                <Ionicons name="person" size={18} color={statusColor(apt.status)} />
              </View>
              <View style={styles.aptInfo}>
                <Text style={styles.aptName}>
                  {apt.patientId?.patientProfile
                    ? `${apt.patientId.patientProfile.firstName} ${apt.patientId.patientProfile.lastName}`.trim()
                    : apt.patientId?.email ?? 'Patient'}
                </Text>
                <View style={styles.aptMetaRow}>
                  <Ionicons name="time-outline" size={12} color={C.textMuted} />
                  <Text style={styles.aptTime}>{apt.timeSlot ?? 'Scheduled'}</Text>
                </View>
              </View>
              <View style={[styles.aptStatusBadge, { backgroundColor: statusColor(apt.status) + '18' }]}>
                <Ionicons name={statusIcon(apt.status)} size={12} color={statusColor(apt.status)} />
                <Text style={[styles.aptStatusText, { color: statusColor(apt.status) }]}>{apt.status}</Text>
              </View>
            </Animated.View>
          ))
        )}

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { marginTop: SPACING.lg }]}>Quick Access</Text>
        <View style={styles.quickGrid}>
          {quickActions.map((a) => (
            <TouchableOpacity
              key={a.label}
              style={styles.quickCard}
              onPress={() => router.push(a.route)}
              activeOpacity={0.7}
            >
              <View style={[styles.quickIconWrap, { backgroundColor: `${a.color}15` }]}>
                <Ionicons name={a.icon} size={24} color={a.color} />
              </View>
              <Text style={styles.quickLabel}>{a.label}</Text>
              <Ionicons name="chevron-forward" size={14} color={C.textMuted} style={{ marginTop: 4 }} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const getStyles = (C, isDark, S) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Header
  headerWrap: { position: 'relative' },
  headerGradient: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    opacity: 0.5,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingTop: 58, paddingBottom: SPACING.md,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  avatarCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: `${C.doctorPrimary}15`,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: `${C.doctorPrimary}35`,
  },
  greeting: {
    fontSize: FONT_SIZES.xs, color: C.textSecondary, fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  doctorName: { fontSize: FONT_SIZES.md, fontWeight: '800', color: C.textPrimary },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  logoutBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: `${C.error}12`, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: `${C.error}20`,
  },

  // Date Banner
  dateBanner: {
    backgroundColor: isDark ? 'rgba(17, 24, 39, 0.85)' : C.bgCard,
    borderRadius: RADIUS.lg, padding: SPACING.md,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: SPACING.lg, borderWidth: 1,
    borderColor: `${C.doctorPrimary}25`, borderLeftWidth: 4, borderLeftColor: C.doctorPrimary,
    ...S.sm,
  },
  dateLabelSmall: {
    fontSize: 9, color: C.doctorPrimary, fontWeight: '800',
    letterSpacing: 2, marginBottom: 2,
  },
  dateText: { fontSize: FONT_SIZES.base, fontWeight: '700', color: C.textPrimary },
  dateBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: `${C.doctorPrimary}15`, paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm, borderRadius: RADIUS.full,
    borderWidth: 1, borderColor: `${C.doctorPrimary}28`,
  },
  dateBadgeText: { fontSize: FONT_SIZES.xs, color: C.doctorPrimary, fontWeight: '700' },

  // Stats
  skeletonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.lg },
  skeletonCard: {
    flex: 1, minWidth: '45%', height: 110, borderRadius: RADIUS.lg,
    backgroundColor: isDark ? C.bgElevated : C.bgElevated,
    justifyContent: 'center', alignItems: 'center',
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.lg },
  statCard: {
    flex: 1, minWidth: '45%', backgroundColor: isDark ? 'rgba(17, 24, 39, 0.9)' : C.bgCard,
    borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: 'center',
    borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.06)' : C.border,
    position: 'relative', overflow: 'hidden', ...S.sm,
  },
  statIconWrap: {
    width: 42, height: 42, borderRadius: 21,
    justifyContent: 'center', alignItems: 'center', marginBottom: 6,
  },
  statValue: { fontSize: FONT_SIZES.xl, fontWeight: '900' },
  statLabel: {
    fontSize: FONT_SIZES.xs, color: C.textSecondary, marginTop: 2,
    fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3,
  },
  statAccent: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
    borderTopLeftRadius: RADIUS.lg, borderTopRightRadius: RADIUS.lg,
  },

  // Section
  sectionRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.sm, fontWeight: '800', color: C.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  seeAllText: { fontSize: FONT_SIZES.xs, color: C.doctorPrimary, fontWeight: '700' },

  // Empty schedule
  emptySchedule: {
    backgroundColor: isDark ? 'rgba(17, 24, 39, 0.9)' : C.bgCard,
    borderRadius: RADIUS.xl, padding: SPACING.xl, alignItems: 'center',
    borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.06)' : C.border,
    marginBottom: SPACING.lg,
  },
  emptyIconWrap: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: `${C.doctorPrimary}15`,
    justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md,
  },
  emptyTitle: { fontSize: FONT_SIZES.base, fontWeight: '700', color: C.textPrimary },
  emptySubtitle: { color: C.textMuted, fontSize: FONT_SIZES.sm, marginTop: 4 },

  // Appointment card
  appointmentCard: {
    backgroundColor: isDark ? 'rgba(17, 24, 39, 0.9)' : C.bgCard,
    borderRadius: RADIUS.lg, padding: SPACING.md,
    flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.06)' : C.border,
    borderLeftWidth: 4, ...S.sm,
  },
  aptAvatarWrap: {
    width: 42, height: 42, borderRadius: 21,
    justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md,
  },
  aptInfo: { flex: 1 },
  aptName: { fontSize: FONT_SIZES.base, fontWeight: '700', color: C.textPrimary },
  aptMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  aptTime: { fontSize: FONT_SIZES.xs, color: C.textMuted },
  aptStatusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: SPACING.sm, paddingVertical: 5, borderRadius: RADIUS.full,
  },
  aptStatusText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },

  // Quick Actions
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.sm },
  quickCard: {
    flex: 1, minWidth: '45%', backgroundColor: isDark ? 'rgba(17, 24, 39, 0.9)' : C.bgCard,
    borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.06)' : C.border,
    ...S.sm,
  },
  quickIconWrap: {
    width: 52, height: 52, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center',
  },
  quickLabel: {
    fontSize: FONT_SIZES.xs, color: C.textSecondary, textAlign: 'center',
    fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3,
  },
});
