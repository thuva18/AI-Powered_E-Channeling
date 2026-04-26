// app/(patient)/home.jsx
// Premium Patient Dashboard – theme aware with ThemeToggle

import { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import useTheme from '../../hooks/useTheme';
import ThemeToggle from '../../components/common/ThemeToggle';
import NotificationBell from '../../components/NotificationBell';
import { FONT_SIZES, SPACING, RADIUS } from '../../constants/theme';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function PatientHomeScreen() {
  const router = useRouter();
  const { user, clearUser } = useAuthStore();
  const { C, S, isDark } = useTheme();
  const [analytics, setAnalytics] = useState(null);
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  function statusColor(status) {
    switch (status?.toLowerCase()) {
      case 'confirmed': case 'accepted': return C.success;
      case 'pending': return C.warning;
      case 'cancelled': return C.error;
      case 'completed': return C.info;
      default: return C.textSecondary;
    }
  }

  const fetchData = async () => {
    try {
      const [analyticsRes, appointmentsRes] = await Promise.all([
        api.get('/patients/analytics'),
        api.get('/patients/appointments'),
      ]);
      setAnalytics(analyticsRes.data);
      setRecentAppointments((appointmentsRes.data || []).slice(0, 3));
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    } catch (e) { console.error('Failed to fetch dashboard data', e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchData(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const statCards = [
    { label: 'Total', value: analytics?.totalAppointments ?? 0, icon: 'calendar', color: C.primary },
    { label: 'Upcoming', value: analytics?.upcomingAppointments ?? 0, icon: 'time-outline', color: C.warning },
    { label: 'Completed', value: analytics?.completedAppointments ?? 0, icon: 'checkmark-circle', color: C.success },
    { label: 'Cancelled', value: analytics?.cancelledAppointments ?? 0, icon: 'close-circle', color: C.error },
  ];

  const quickActions = [
    { label: 'Find Doctors', icon: 'search', route: '/(patient)/book', color: C.primary },
    { label: 'Appointments', icon: 'list', route: '/(patient)/appointments', color: C.accent },
    { label: 'Payments', icon: 'card', route: '/(patient)/payments', color: C.warning },
    { label: 'My Profile', icon: 'person', route: '/(patient)/profile', color: '#9B59F5' },
  ];

  const cardBg = isDark ? 'rgba(17, 24, 39, 0.9)' : C.bgCard;
  const cardBorder = isDark ? 'rgba(255,255,255,0.06)' : C.border;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: SPACING.lg, paddingTop: 60, paddingBottom: SPACING.md,
        backgroundColor: isDark ? C.bgCard : C.bgCard,
        borderBottomWidth: 1, borderBottomColor: cardBorder,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
          <View style={{
            width: 44, height: 44, borderRadius: 22,
            backgroundColor: `${C.primary}20`, justifyContent: 'center', alignItems: 'center',
            borderWidth: 1, borderColor: `${C.primary}40`,
          }}>
            <Text style={{ fontSize: 20 }}>🧑‍💼</Text>
          </View>
          <View>
            <Text style={{ fontSize: FONT_SIZES.xs, color: C.textSecondary, fontWeight: '600' }}>{getGreeting()} 👋</Text>
            <Text style={{ fontSize: FONT_SIZES.md, fontWeight: '800', color: C.textPrimary }}>{user?.name ?? 'Patient'}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
          <NotificationBell size={38} />
          <ThemeToggle size={38} />
          <TouchableOpacity
            style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${C.error}18`, justifyContent: 'center', alignItems: 'center' }}
            onPress={async () => { await clearUser(); router.replace('/(auth)/login'); }}>
            <Ionicons name="log-out-outline" size={20} color={C.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
        showsVerticalScrollIndicator={false}>

        {/* CTA Banner */}
        <TouchableOpacity style={{
          backgroundColor: cardBg, borderRadius: RADIUS.xl, padding: SPACING.lg,
          flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: SPACING.lg, borderWidth: 1, borderColor: `${C.primary}30`,
          borderLeftWidth: 4, borderLeftColor: C.primary, ...S.md,
        }} onPress={() => router.push('/(patient)/book')} activeOpacity={0.85}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 10, color: C.primary, fontWeight: '800', letterSpacing: 1.5, marginBottom: 4 }}>MEDICARE SMART CARE</Text>
            <Text style={{ fontSize: FONT_SIZES.md, fontWeight: '800', color: C.textPrimary }}>Book an Appointment</Text>
            <Text style={{ fontSize: FONT_SIZES.xs, color: C.textSecondary, marginTop: 2 }}>Find the right specialist with AI recommendation</Text>
          </View>
          <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: `${C.primary}18`, justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="medical" size={36} color={C.primary} />
          </View>
        </TouchableOpacity>

        {/* Stats */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm }}>
          <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '800', color: C.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 }}>Health Summary</Text>
        </View>
        {loading ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.lg }}>
            {[0, 1, 2, 3].map(i => <View key={i} style={{ flex: 1, minWidth: '45%', height: 100, borderRadius: RADIUS.lg, backgroundColor: isDark ? C.bgElevated : C.bgElevated }} />)}
          </View>
        ) : (
          <Animated.View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.lg, opacity: fadeAnim }}>
            {statCards.map((s) => (
              <View key={s.label} style={{
                flex: 1, minWidth: '45%', backgroundColor: cardBg,
                borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: 'center',
                borderWidth: 1, borderColor: cardBorder, borderTopWidth: 3, borderTopColor: s.color, ...S.md,
              }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: `${s.color}18`, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.xs }}>
                  <Ionicons name={s.icon} size={20} color={s.color} />
                </View>
                <Text style={{ fontSize: FONT_SIZES.xxl, fontWeight: '900', color: s.color }}>{s.value}</Text>
                <Text style={{ fontSize: FONT_SIZES.xs, color: C.textSecondary, marginTop: 2, fontWeight: '600', textTransform: 'uppercase' }}>{s.label}</Text>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Recent Appointments */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm }}>
          <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '800', color: C.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 }}>Recent Appointments</Text>
          <TouchableOpacity onPress={() => router.push('/(patient)/appointments')}>
            <Text style={{ fontSize: FONT_SIZES.xs, color: C.primary, fontWeight: '700' }}>See all</Text>
          </TouchableOpacity>
        </View>
        {recentAppointments.length === 0 ? (
          <View style={{
            backgroundColor: cardBg, borderRadius: RADIUS.xl, padding: SPACING.xl, alignItems: 'center',
            borderWidth: 1, borderColor: cardBorder, marginBottom: SPACING.lg,
          }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: `${C.primary}18`, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md }}>
              <Ionicons name="calendar-outline" size={32} color={C.primary} />
            </View>
            <Text style={{ fontSize: FONT_SIZES.base, fontWeight: '700', color: C.textPrimary }}>No appointments yet</Text>
            <Text style={{ color: C.textMuted, fontSize: FONT_SIZES.sm, marginTop: 4, textAlign: 'center', lineHeight: 20 }}>Book your first appointment with an AI-matched doctor</Text>
            <TouchableOpacity style={{ marginTop: SPACING.md, backgroundColor: `${C.primary}22`, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, borderWidth: 1, borderColor: `${C.primary}44` }}
              onPress={() => router.push('/(patient)/book')}>
              <Text style={{ color: C.primary, fontSize: FONT_SIZES.sm, fontWeight: '700' }}>Book Now →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          recentAppointments.map((apt, i) => {
            // Backend may populate as apt.doctorId (object) or apt.doctor (object)
            const doc = apt.doctorId || apt.doctor || {};
            const docName = doc.name
              || `${doc.firstName || ''} ${doc.lastName || ''}`.trim()
              || 'Unknown Doctor';
            const docSpec = doc.specialization || apt.specialization || '';
            return (
              <View key={apt._id ?? i} style={{
                backgroundColor: cardBg, borderRadius: RADIUS.lg, padding: SPACING.md,
                flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: SPACING.sm, borderWidth: 1, borderColor: cardBorder,
              }}>
                <View style={{ flex: 1, borderLeftWidth: 3, borderLeftColor: statusColor(apt.status), paddingLeft: SPACING.sm }}>
                  <Text style={{ fontSize: FONT_SIZES.base, fontWeight: '700', color: C.textPrimary }}>Dr. {docName}</Text>
                  {docSpec ? <Text style={{ fontSize: FONT_SIZES.sm, color: C.textSecondary, marginTop: 1 }}>{docSpec}</Text> : null}
                  <Text style={{ fontSize: FONT_SIZES.xs, color: C.textMuted, marginTop: 4 }}>
                    {apt.appointmentDate ? new Date(apt.appointmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}
                  </Text>
                </View>
                <View style={{ paddingHorizontal: SPACING.sm, paddingVertical: 5, borderRadius: RADIUS.full, marginLeft: SPACING.sm, backgroundColor: statusColor(apt.status) + '22' }}>
                  <Text style={{ fontSize: FONT_SIZES.xs, fontWeight: '700', textTransform: 'capitalize', color: statusColor(apt.status) }}>{apt.status ?? 'Pending'}</Text>
                </View>
              </View>
            );
          })
        )}


        {/* Quick Actions */}
        <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '800', color: C.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: SPACING.md, marginBottom: SPACING.sm }}>Quick Actions</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
          {quickActions.map((action) => (
            <TouchableOpacity key={action.label} style={{
              flex: 1, minWidth: '45%', backgroundColor: cardBg,
              borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: 'center', gap: SPACING.sm,
              borderWidth: 1, borderColor: cardBorder, ...S.sm,
            }} onPress={() => router.push(action.route)} activeOpacity={0.8}>
              <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: `${action.color}18`, justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name={action.icon} size={24} color={action.color} />
              </View>
              <Text style={{ fontSize: FONT_SIZES.xs, color: C.textSecondary, textAlign: 'center', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 }}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
