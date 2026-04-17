// app/(doctor)/home.jsx
// Premium Doctor Dashboard – theme aware with ThemeToggle

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

export default function DoctorHomeScreen() {
  const { user, clearUser } = useAuthStore();
  const { C, S, isDark } = useTheme();
  const router = useRouter();
  const [analytics, setAnalytics] = useState(null);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

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
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    } catch (e) { console.error('Failed to fetch doctor dashboard', e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchData(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const statCards = [
    { label: 'Today', value: todayAppointments.length, icon: 'today-outline', color: C.doctorPrimary },
    { label: 'Total', value: analytics?.totalAppointments ?? 0, icon: 'calendar', color: C.primary },
    { label: 'Pending', value: analytics?.pendingAppointments ?? 0, icon: 'time-outline', color: C.warning },
    { label: 'Patients', value: analytics?.totalPatients ?? 0, icon: 'people', color: '#9B59F5' },
    { label: 'Completed', value: analytics?.completedAppointments ?? 0, icon: 'checkmark-circle', color: C.success },
    { label: 'Revenue', value: `Rs.${(analytics?.totalRevenue ?? 0).toLocaleString()}`, icon: 'cash-outline', color: C.info ?? '#38BDF8' },
  ];

  const quickActions = [
    { label: 'Appointments', icon: 'calendar', route: '/(doctor)/appointments', color: C.primary },
    { label: 'My Patients', icon: 'people', route: '/(doctor)/patients', color: C.doctorPrimary },
    { label: 'Journal', icon: 'book', route: '/(doctor)/journal', color: '#9B59F5' },
    { label: 'My Profile', icon: 'person', route: '/(doctor)/profile', color: C.warning },
  ];

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const cardBg = isDark ? 'rgba(17, 24, 39, 0.9)' : C.bgCard;
  const cardBorder = isDark ? 'rgba(255,255,255,0.06)' : C.border;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: SPACING.lg, paddingTop: 60, paddingBottom: SPACING.md,
        backgroundColor: isDark ? 'rgba(17, 24, 39, 0.98)' : C.bgCard,
        borderBottomWidth: 1, borderBottomColor: cardBorder,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
          <View style={{
            width: 46, height: 46, borderRadius: 23,
            backgroundColor: `${C.doctorPrimary}20`, justifyContent: 'center', alignItems: 'center',
            borderWidth: 1, borderColor: `${C.doctorPrimary}40`,
          }}>
            <Text style={{ fontSize: 22 }}>👨‍⚕️</Text>
          </View>
          <View>
            <Text style={{ fontSize: FONT_SIZES.xs, color: C.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>{getGreeting()}</Text>
            <Text style={{ fontSize: FONT_SIZES.md, fontWeight: '800', color: C.textPrimary }}>
              Dr. {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user?.name ?? 'Doctor')}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
          <NotificationBell size={38} />
          <ThemeToggle size={38} />
          <TouchableOpacity style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${C.error}18`, justifyContent: 'center', alignItems: 'center' }}
            onPress={async () => { await clearUser(); router.replace('/(auth)/login'); }}>
            <Ionicons name="log-out-outline" size={20} color={C.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.doctorPrimary} />}
        showsVerticalScrollIndicator={false}>

        {/* Date Banner */}
        <View style={{
          backgroundColor: cardBg, borderRadius: RADIUS.lg, padding: SPACING.md,
          flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: SPACING.lg, borderWidth: 1,
          borderColor: `${C.doctorPrimary}30`, borderLeftWidth: 4, borderLeftColor: C.doctorPrimary,
          ...S.md,
        }}>
          <View>
            <Text style={{ fontSize: 10, color: C.doctorPrimary, fontWeight: '800', letterSpacing: 2, marginBottom: 2 }}>TODAY</Text>
            <Text style={{ fontSize: FONT_SIZES.base, fontWeight: '700', color: C.textPrimary }}>{today}</Text>
          </View>
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 4,
            backgroundColor: `${C.doctorPrimary}18`, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
            borderRadius: RADIUS.full, borderWidth: 1, borderColor: `${C.doctorPrimary}33`,
          }}>
            <Ionicons name="today-outline" size={14} color={C.doctorPrimary} />
            <Text style={{ fontSize: FONT_SIZES.xs, color: C.doctorPrimary, fontWeight: '700' }}>{todayAppointments.length} appts</Text>
          </View>
        </View>

        {/* Stats */}
        {loading ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.lg }}>
            {[0, 1, 2, 3].map(i => <View key={i} style={{ flex: 1, minWidth: '45%', height: 100, borderRadius: RADIUS.lg, backgroundColor: isDark ? 'rgba(30, 40, 64, 0.8)' : C.bgElevated }} />)}
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

        {/* Today's Appointments */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm }}>
          <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '800', color: C.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 }}>Today's Schedule</Text>
          <TouchableOpacity onPress={() => router.push('/(doctor)/appointments')}>
            <Text style={{ fontSize: FONT_SIZES.xs, color: C.doctorPrimary, fontWeight: '700' }}>View all</Text>
          </TouchableOpacity>
        </View>

        {todayAppointments.length === 0 ? (
          <View style={{
            backgroundColor: cardBg, borderRadius: RADIUS.xl, padding: SPACING.xl, alignItems: 'center',
            borderWidth: 1, borderColor: cardBorder, marginBottom: SPACING.lg,
          }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: `${C.doctorPrimary}18`, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md }}>
              <Ionicons name="calendar-outline" size={28} color={C.doctorPrimary} />
            </View>
            <Text style={{ fontSize: FONT_SIZES.base, fontWeight: '700', color: C.textPrimary }}>Clear schedule</Text>
            <Text style={{ color: C.textMuted, fontSize: FONT_SIZES.sm, marginTop: 4 }}>No appointments booked for today</Text>
          </View>
        ) : (
          todayAppointments.map((apt) => (
            <View key={apt._id} style={{
              backgroundColor: cardBg, borderRadius: RADIUS.lg, padding: SPACING.md,
              flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm,
              borderWidth: 1, borderColor: cardBorder, borderLeftWidth: 4, borderLeftColor: statusColor(apt.status),
            }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : C.bgElevated, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md }}>
                <Text style={{ fontSize: 18 }}>🧑</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: FONT_SIZES.base, fontWeight: '700', color: C.textPrimary }}>
                  {apt.patientId?.patientProfile
                    ? `${apt.patientId.patientProfile.firstName} ${apt.patientId.patientProfile.lastName}`.trim()
                    : apt.patientId?.email ?? 'Patient'}
                </Text>
                <Text style={{ fontSize: FONT_SIZES.xs, color: C.textSecondary, marginTop: 2, textTransform: 'capitalize' }}>{apt.timeSlot ?? 'Scheduled'}</Text>
              </View>
              <View style={{ paddingHorizontal: SPACING.sm, paddingVertical: 5, borderRadius: RADIUS.full, backgroundColor: statusColor(apt.status) + '22' }}>
                <Text style={{ fontSize: FONT_SIZES.xs, fontWeight: '700', textTransform: 'capitalize', color: statusColor(apt.status) }}>{apt.status}</Text>
              </View>
            </View>
          ))
        )}

        {/* Quick Actions */}
        <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '800', color: C.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: SPACING.md, marginBottom: SPACING.sm }}>Quick Access</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
          {quickActions.map((a) => (
            <TouchableOpacity key={a.label} style={{
              flex: 1, minWidth: '45%', backgroundColor: cardBg,
              borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: 'center', gap: SPACING.sm,
              borderWidth: 1, borderColor: cardBorder, ...S.sm,
            }} onPress={() => router.push(a.route)} activeOpacity={0.8}>
              <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: `${a.color}18`, justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name={a.icon} size={24} color={a.color} />
              </View>
              <Text style={{ fontSize: FONT_SIZES.xs, color: C.textSecondary, textAlign: 'center', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 }}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
