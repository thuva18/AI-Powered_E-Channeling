// app/(doctor)/home.tsx
// Doctor dashboard screen

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

export default function DoctorHomeScreen() {
  const { user, clearUser } = useAuthStore();
  const router = useRouter();
  const [analytics, setAnalytics] = useState(null);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
    } catch { console.error('Failed to fetch doctor dashboard'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchData(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const statCards = [
    { label: "Today's", value: todayAppointments.length, icon: 'today-outline', color: COLORS.doctorPrimary },
    { label: 'Total', value: analytics?.totalAppointments ?? 0, icon: 'calendar', color: COLORS.primary },
    { label: 'Pending', value: analytics?.pendingAppointments ?? 0, icon: 'time-outline', color: COLORS.warning },
    { label: 'Patients', value: analytics?.totalPatients ?? 0, icon: 'people', color: COLORS.accent },
  ];

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back, 👨‍⚕️</Text>
          <Text style={styles.name}>Dr. {user?.name ?? 'Doctor'}</Text>
          <Text style={styles.spec}>{user?.specialization ?? 'Physician'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={async () => { await clearUser(); router.replace('/(auth)/login'); }}>
          <Ionicons name="log-out-outline" size={22} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll} contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.doctorPrimary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats */}
        {loading ? <ActivityIndicator color={COLORS.doctorPrimary} style={{ marginTop: 20 }} /> : (
          <View style={styles.statsGrid}>
            {statCards.map((s) => (
              <View key={s.label} style={styles.statCard}>
                <View style={[styles.statIconBox, { backgroundColor: s.color + '22' }]}>
                  <Ionicons name={s.icon} size={22} color={s.color} />
                </View>
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Today's Appointments */}
        <Text style={styles.sectionTitle}>Today's Appointments</Text>
        {todayAppointments.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="calendar-outline" size={32} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No appointments today</Text>
          </View>
        ) : (
          todayAppointments.map((apt) => (
            <View key={apt._id} style={styles.aptCard}>
              <View style={styles.aptLeft}>
                <View style={styles.aptAvatar}><Text style={{ fontSize: 18 }}>🧑</Text></View>
                <View>
                  <Text style={styles.aptPatient}>{apt.patient?.name ?? 'Patient'}</Text>
                  <Text style={styles.aptTime}>{apt.timeSlot ?? 'Morning'}</Text>
                </View>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: statusColor(apt.status) + '22' }]}>
                <Text style={[styles.statusText, { color: statusColor(apt.status) }]}>{apt.status}</Text>
              </View>
            </View>
          ))
        )}

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {[
            { label: 'All Appointments', icon: 'calendar', route: '/(doctor)/appointments' },
            { label: 'My Patients', icon: 'people', route: '/(doctor)/patients' },
            { label: 'Journal', icon: 'book', route: '/(doctor)/journal' },
            { label: 'My Profile', icon: 'person', route: '/(doctor)/profile' },
          ].map((a) => (
            <TouchableOpacity key={a.label} style={styles.actionCard} onPress={() => router.push(a.route)} activeOpacity={0.8}>
              <Ionicons name={a.icon} size={22} color={COLORS.doctorPrimary} />
              <Text style={styles.actionLabel}>{a.label}</Text>
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
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.md,
    backgroundColor: COLORS.bgCard, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  greeting: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  name: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textPrimary },
  spec: { fontSize: FONT_SIZES.sm, color: COLORS.doctorPrimary },
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
    borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm,
  },
  statIconBox: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm },
  statValue: { fontSize: FONT_SIZES.xl, fontWeight: '800' },
  statLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  sectionTitle: {
    fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SPACING.md, marginTop: SPACING.md,
  },
  emptyBox: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    padding: SPACING.xl, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  emptyText: { color: COLORS.textMuted, marginTop: SPACING.sm },
  aptCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, padding: SPACING.md,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border,
  },
  aptLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  aptAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.bgElevated, justifyContent: 'center', alignItems: 'center',
  },
  aptPatient: { fontSize: FONT_SIZES.base, fontWeight: '600', color: COLORS.textPrimary },
  aptTime: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  statusBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full },
  statusText: { fontSize: FONT_SIZES.xs, fontWeight: '700', textTransform: 'capitalize' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  actionCard: {
    flex: 1, minWidth: '45%', backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', gap: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm,
  },
  actionLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, textAlign: 'center', fontWeight: '600' },
});
