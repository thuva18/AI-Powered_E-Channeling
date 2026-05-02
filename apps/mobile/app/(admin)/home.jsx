// app/(admin)/home.jsx
// Premium Admin Dashboard screen – theme aware with ThemeToggle

import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import useTheme from '../../hooks/useTheme';
import ThemeToggle from '../../components/common/ThemeToggle';
import NotificationBell from '../../components/NotificationBell';
import { FONT_SIZES, SPACING, RADIUS } from '../../constants/theme';

export default function AdminHomeScreen() {
  const { user, clearUser } = useAuthStore();
  const { C, S, isDark } = useTheme();
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

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const statCards = [
    { label: 'Total Doctors',  value: analytics?.users?.totalDoctors   ?? analytics?.totalDoctors   ?? 0, icon: 'medical',      color: C.adminPrimary, route: '/(admin)/doctors' },
    { label: 'Total Patients', value: analytics?.users?.totalPatients  ?? analytics?.totalPatients  ?? 0, icon: 'people',       color: C.primary,      route: '/(admin)/patients' },
    { label: 'Appointments',   value: analytics?.appointments?.total   ?? analytics?.totalAppointments ?? 0, icon: 'calendar', color: C.accent,       route: '/(admin)/reports' },
    { label: 'Pending',        value: analytics?.doctors?.pending      ?? pendingDoctors.length,          icon: 'time-outline', color: C.warning,      route: '/(admin)/doctors' },
  ];

  const cardBg = isDark ? 'rgba(28, 36, 56, 0.6)' : C.bgCard;
  const cardBorder = isDark ? C.cardInnerBorder : C.border;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: SPACING.lg, paddingTop: 60, paddingBottom: SPACING.md,
        backgroundColor: isDark ? 'rgba(19, 25, 41, 0.95)' : C.bgCard,
        borderBottomWidth: 1, borderBottomColor: cardBorder, zIndex: 10,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: `${C.adminPrimary}20`, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 22 }}>👑</Text>
          </View>
          <View>
            <Text style={{ fontSize: FONT_SIZES.xs, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700' }}>Admin Portal</Text>
            <Text style={{ fontSize: FONT_SIZES.lg, fontWeight: '800', color: C.textPrimary }}>
              {user?.name && user.name !== 'User' ? user.name : 'Administrator'}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
          <NotificationBell size={38} />
          <ThemeToggle size={38} />
          <TouchableOpacity
            style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${C.error}1A`, justifyContent: 'center', alignItems: 'center' }}
            activeOpacity={0.7}
            onPress={async () => { await clearUser(); router.replace('/(auth)/login'); }}
          >
            <Ionicons name="log-out" size={20} color={C.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }} contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.adminPrimary} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? <ActivityIndicator color={C.adminPrimary} style={{ marginTop: 20 }} /> : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginBottom: SPACING.xl }}>
            {statCards.map((s) => (
              <TouchableOpacity key={s.label} activeOpacity={0.75} onPress={() => router.push(s.route)} style={{
                flex: 1, minWidth: '45%', backgroundColor: cardBg,
                borderRadius: RADIUS.lg, padding: SPACING.lg, alignItems: 'center',
                borderWidth: 1, borderColor: cardBorder, borderBottomWidth: 3, borderBottomColor: s.color, ...S.sm,
              }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: `${s.color}20`, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm }}>
                  <Ionicons name={s.icon} size={22} color={s.color} />
                </View>
                <Text style={{ fontSize: FONT_SIZES.xxl, fontWeight: '900', marginTop: 4, color: s.color }}>{s.value}</Text>
                <Text style={{ fontSize: FONT_SIZES.xs, color: C.textSecondary, marginTop: 4, textAlign: 'center', fontWeight: '600', textTransform: 'uppercase' }}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {pendingDoctors.length > 0 && (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md, marginTop: SPACING.xs }}>
              <Text style={{ fontSize: FONT_SIZES.md, fontWeight: '800', color: C.textPrimary }}>Waitlist</Text>
              <Text style={{ backgroundColor: `${C.adminPrimary}33`, color: C.adminPrimary, fontSize: 10, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, overflow: 'hidden' }}>{pendingDoctors.length} New</Text>
            </View>
            {pendingDoctors.map((doc) => (
              <TouchableOpacity key={doc._id} style={{
                backgroundColor: cardBg, borderRadius: RADIUS.lg, padding: SPACING.md,
                flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm,
                borderWidth: 1, borderColor: `${C.adminPrimary}33`, ...S.sm,
              }} activeOpacity={0.8} onPress={() => router.push('/(admin)/doctors')}>
                <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: isDark ? C.cardInnerBorder : C.bgElevated, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md }}>
                  <Text style={{ fontSize: 20 }}>👨‍⚕️</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: FONT_SIZES.base, fontWeight: '700', color: C.textPrimary, marginBottom: 2 }}>
                    Dr. {`${doc.firstName || ''} ${doc.lastName || ''}`.trim() || 'Unknown'}
                  </Text>
                  <Text style={{ fontSize: FONT_SIZES.xs, color: C.textSecondary }}>{doc.specialization}</Text>
                </View>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: `${C.adminPrimary}15`, justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="chevron-forward" size={20} color={C.adminPrimary} />
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        <Text style={{ fontSize: FONT_SIZES.md, fontWeight: '800', color: C.textPrimary, marginTop: SPACING.lg, marginBottom: SPACING.md }}>Quick Access</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md }}>
          {[
            { label: 'Manage Doctors', icon: 'medical', route: '/(admin)/doctors', color: '#9B59F5' },
            { label: 'Manage Patients', icon: 'people', route: '/(admin)/patients', color: '#4E9AF1' },
            { label: 'View Reports', icon: 'bar-chart', route: '/(admin)/reports', color: '#22C9A0' },
            { label: 'Transactions', icon: 'card', route: '/(admin)/payments', color: '#F5A623' },
          ].map((a) => (
            <TouchableOpacity key={a.label} style={{
              flex: 1, minWidth: '45%', backgroundColor: cardBg, borderRadius: RADIUS.lg,
              padding: SPACING.lg, alignItems: 'center', gap: SPACING.md,
              borderWidth: 1, borderColor: cardBorder, ...S.md,
            }} onPress={() => router.push(a.route)} activeOpacity={0.8}>
              <View style={{ width: 56, height: 56, borderRadius: 20, backgroundColor: `${a.color}15`, justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name={a.icon} size={28} color={a.color} />
              </View>
              <Text style={{ fontSize: FONT_SIZES.sm, color: C.textSecondary, textAlign: 'center', fontWeight: '700' }}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
