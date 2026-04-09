// app/(admin)/home.jsx
// Premium Admin Dashboard screen with aesthetics

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
  const [analytics, setAnalytics] = useState(null);
  const [pendingDoctors, setPendingDoctors] = useState([]);
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
        <View style={styles.headerLeft}>
          <View style={styles.avatarWrap}>
            <Text style={{ fontSize: 22 }}>👑</Text>
          </View>
          <View>
            <Text style={styles.greeting}>Admin Portal</Text>
            <Text style={styles.name}>{user?.name ?? 'Administrator'}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.7} onPress={async () => { await clearUser(); router.replace('/(auth)/login'); }}>
          <Ionicons name="log-out" size={20} color={COLORS.error} />
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
              <View key={s.label} style={[styles.statCard, { borderBottomColor: s.color }]}>
                <View style={[styles.iconWrap, { backgroundColor: `${s.color}20` }]}>
                  <Ionicons name={s.icon} size={22} color={s.color} />
                </View>
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Pending Doctor Approvals */}
        {pendingDoctors.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Waitlist</Text>
              <Text style={styles.sectionBadge}>{pendingDoctors.length} New</Text>
            </View>
            {pendingDoctors.map((doc) => (
              <TouchableOpacity key={doc._id} style={styles.pendingCard} activeOpacity={0.8} onPress={() => router.push('/(admin)/doctors')}>
                <View style={styles.pendingAvatar}><Text style={{ fontSize: 20 }}>👨‍⚕️</Text></View>
                <View style={styles.pendingInfo}>
                  <Text style={styles.pendingName}>Dr. {doc.name}</Text>
                  <Text style={styles.pendingSpec}>{doc.specialization}</Text>
                </View>
                <View style={styles.approveChevron}>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.adminPrimary} />
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { marginTop: SPACING.lg, marginBottom: SPACING.md }]}>Quick Access</Text>
        <View style={styles.actionsGrid}>
          {[
            { label: 'Manage Doctors', icon: 'medical', route: '/(admin)/doctors', color: '#9B59F5' },
            { label: 'Manage Patients', icon: 'people', route: '/(admin)/patients', color: '#4E9AF1' },
            { label: 'View Reports', icon: 'bar-chart', route: '/(admin)/reports', color: '#22C9A0' },
            { label: 'Transactions', icon: 'card', route: '/(admin)/payments', color: '#F5A623' },
          ].map((a) => (
            <TouchableOpacity key={a.label} style={styles.actionCard} onPress={() => router.push(a.route)} activeOpacity={0.8}>
               <View style={[styles.actionIconBg, { backgroundColor: `${a.color}15` }]}>
                 <Ionicons name={a.icon} size={28} color={a.color} />
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
    backgroundColor: 'rgba(19, 25, 41, 0.95)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
    zIndex: 10,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  avatarWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(155, 89, 245, 0.2)', justifyContent: 'center', alignItems: 'center' },
  greeting: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700' },
  name: { fontSize: FONT_SIZES.lg, fontWeight: '800', color: COLORS.textPrimary },
  logoutBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: `${COLORS.error}1A`, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  content: { padding: SPACING.lg, paddingBottom: 100 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginBottom: SPACING.xl },
  statCard: {
    flex: 1, minWidth: '45%', backgroundColor: 'rgba(28, 36, 56, 0.6)',
    borderRadius: RADIUS.lg, padding: SPACING.lg, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', borderBottomWidth: 3, ...SHADOWS.sm,
  },
  iconWrap: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm },
  statValue: { fontSize: FONT_SIZES.xxl, fontWeight: '900', marginTop: 4 },
  statLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center', fontWeight: '600', textTransform: 'uppercase' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md, marginTop: SPACING.xs },
  sectionTitle: { fontSize: FONT_SIZES.md, fontWeight: '800', color: COLORS.textPrimary },
  sectionBadge: { backgroundColor: `${COLORS.adminPrimary}33`, color: COLORS.adminPrimary, fontSize: 10, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, overflow: 'hidden'},
  pendingCard: {
    backgroundColor: 'rgba(28, 36, 56, 0.6)', borderRadius: RADIUS.lg, padding: SPACING.md,
    flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: 'rgba(155, 89, 245, 0.2)', ...SHADOWS.sm,
  },
  pendingAvatar: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md },
  pendingInfo: { flex: 1 },
  pendingName: { fontSize: FONT_SIZES.base, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  pendingSpec: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },
  approveChevron: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(155, 89, 245, 0.1)', justifyContent: 'center', alignItems: 'center' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  actionCard: {
    flex: 1, minWidth: '45%', backgroundColor: 'rgba(28, 36, 56, 0.6)', borderRadius: RADIUS.lg,
    padding: SPACING.lg, alignItems: 'center', gap: SPACING.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', ...SHADOWS.md,
  },
  actionIconBg: { width: 56, height: 56, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  actionLabel: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, textAlign: 'center', fontWeight: '700' },
});
