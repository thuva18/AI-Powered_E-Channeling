// app/(patient)/appointments.tsx
// Patient My Appointments screen – list & cancel

import { useEffect, useState, useCallback } from 'react';
import useStyles from '../../hooks/useStyles';
import useTheme from '../../hooks/useTheme';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { FONT_SIZES, SPACING, RADIUS } from '../../constants/theme';

export default function PatientAppointmentsScreen() {
  const styles = useStyles(getStyles);
  const { C } = useTheme();
  const STATUS_COLORS = {
    accepted: C.success, pending: C.warning,
    cancelled: C.error, completed: C.info,
  };
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [filter, setFilter] = useState('all');

  const fetchAppointments = useCallback(async () => {
    try {
      const res = await api.get('/patients/appointments');
      setAppointments(res.data || []);
    } catch {
      Alert.alert('Error', 'Failed to load appointments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAppointments(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchAppointments(); };

  const handleCancel = async (id) => {
    Alert.alert('Cancel Appointment', 'Are you sure you want to cancel this appointment?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel', style: 'destructive',
        onPress: async () => {
          setCancellingId(id);
          try {
            await api.patch(`/patients/appointments/${id}/cancel`);
            setAppointments((prev) =>
              prev.map((a) => a._id === id ? { ...a, status: 'CANCELLED' } : a),
            );
          } catch (e) {
            Alert.alert('Error', e.response?.data?.message ?? 'Failed to cancel');
          } finally {
            setCancellingId(null);
          }
        },
      },
    ]);
  };

  const filters = ['all', 'pending', 'accepted', 'completed', 'cancelled'];
  const displayList = filter === 'all' ? appointments : appointments.filter((a) => a.status?.toLowerCase() === filter);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.avatar}>
          <Text style={{ fontSize: 20 }}>👨‍⚕️</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.docName}>Dr. {item.doctorId ? `${item.doctorId.firstName || ''} ${item.doctorId.lastName || ''}`.trim() || 'Unknown' : 'Unknown'}</Text>
          <Text style={styles.docSpec}>{item.doctorId?.specialization ?? ''}</Text>
          {item.appointmentDate && (
            <Text style={styles.date}>
              📅 {new Date(item.appointmentDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              {item.timeSlot ? `  ·  ${item.timeSlot}` : ''}
            </Text>
          )}
        </View>
        <View style={[styles.badge, { backgroundColor: (STATUS_COLORS[item.status?.toLowerCase()] ?? C.textMuted) + '22' }]}>
          <Text style={[styles.badgeText, { color: STATUS_COLORS[item.status?.toLowerCase()] ?? C.textMuted }]}>
            {item.status?.toLowerCase()}
          </Text>
        </View>
      </View>

      {item.notes && <Text style={styles.notes}>{item.notes}</Text>}

      {(item.status?.toLowerCase() === 'pending' || item.status?.toLowerCase() === 'accepted') && (
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => handleCancel(item._id)}
          disabled={cancellingId === item._id}
        >
          {cancellingId === item._id
            ? <ActivityIndicator size="small" color={C.error} />
            : <><Ionicons name="close-circle-outline" size={16} color={C.error} /><Text style={styles.cancelText}>  Cancel Appointment</Text></>
          }
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>My Appointments</Text>
      </View>

      {/* Filter Tabs */}
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {filters.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, filter === f && styles.filterTabActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={displayList}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={40} color={C.textMuted} />
              <Text style={styles.emptyText}>No {filter !== 'all' ? filter : ''} appointments</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const getStyles = (C, isDark, S) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.md,
    backgroundColor: C.bgCard, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  title: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: C.textPrimary },
  filterScroll: { flexDirection: 'row', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, gap: SPACING.sm },
  filterTab: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full, backgroundColor: C.bgCard,
    borderWidth: 1, borderColor: C.border,
  },
  filterTabActive: { backgroundColor: C.primary, borderColor: C.primary },
  filterText: { fontSize: FONT_SIZES.xs, color: C.textSecondary, fontWeight: '600' },
  filterTextActive: { color: C.white },
  list: { padding: SPACING.lg, paddingBottom: 80 },
  card: {
    backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: SPACING.md,
    marginBottom: SPACING.md, borderWidth: 1, borderColor: C.border, ...S.sm,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  avatar: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: C.bgElevated,
    justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md,
  },
  info: { flex: 1 },
  docName: { fontSize: FONT_SIZES.base, fontWeight: '700', color: C.textPrimary },
  docSpec: { fontSize: FONT_SIZES.sm, color: C.primary, marginTop: 2 },
  date: { fontSize: FONT_SIZES.xs, color: C.textMuted, marginTop: 4 },
  badge: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full },
  badgeText: { fontSize: FONT_SIZES.xs, fontWeight: '700', textTransform: 'capitalize' },
  notes: {
    fontSize: FONT_SIZES.sm, color: C.textSecondary,
    marginTop: SPACING.sm, fontStyle: 'italic',
  },
  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md, borderWidth: 1, borderColor: C.error + '44',
    backgroundColor: `${C.error}11`,
  },
  cancelText: { color: C.error, fontSize: FONT_SIZES.sm, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: C.textMuted, marginTop: SPACING.md, fontSize: FONT_SIZES.base },
});
