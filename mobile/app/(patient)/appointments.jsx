// app/(patient)/appointments.tsx
// Patient My Appointments screen – list & cancel

import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

// Types removed
const STATUS_COLORS = {
  confirmed: COLORS.success,
  pending: COLORS.warning,
  cancelled: COLORS.error,
  completed: COLORS.info,
};

export default function PatientAppointmentsScreen() {
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
              prev.map((a) => a._id === id ? { ...a, status: 'cancelled' } : a),
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

  const filters = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];
  const displayList = filter === 'all' ? appointments : appointments.filter((a) => a.status === filter);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.avatar}>
          <Text style={{ fontSize: 20 }}>👨‍⚕️</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.docName}>Dr. {item.doctor?.name ?? 'Unknown'}</Text>
          <Text style={styles.docSpec}>{item.doctor?.specialization ?? ''}</Text>
          {item.appointmentDate && (
            <Text style={styles.date}>
              📅 {new Date(item.appointmentDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              {item.timeSlot ? `  ·  ${item.timeSlot}` : ''}
            </Text>
          )}
        </View>
        <View style={[styles.badge, { backgroundColor: (STATUS_COLORS[item.status] ?? COLORS.textMuted) + '22' }]}>
          <Text style={[styles.badgeText, { color: STATUS_COLORS[item.status] ?? COLORS.textMuted }]}>
            {item.status}
          </Text>
        </View>
      </View>

      {item.notes && <Text style={styles.notes}>{item.notes}</Text>}

      {(item.status === 'pending' || item.status === 'confirmed') && (
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => handleCancel(item._id)}
          disabled={cancellingId === item._id}
        >
          {cancellingId === item._id
            ? <ActivityIndicator size="small" color={COLORS.error} />
            : <><Ionicons name="close-circle-outline" size={16} color={COLORS.error} /><Text style={styles.cancelText}>  Cancel Appointment</Text></>
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
      <View style={styles.filterScroll}>
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
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={displayList}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No {filter !== 'all' ? filter : ''} appointments</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.md,
    backgroundColor: COLORS.bgCard, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  title: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.textPrimary },
  filterScroll: { flexDirection: 'row', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, gap: SPACING.sm },
  filterTab: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full, backgroundColor: COLORS.bgCard,
    borderWidth: 1, borderColor: COLORS.border,
  },
  filterTabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, fontWeight: '600' },
  filterTextActive: { color: COLORS.white },
  list: { padding: SPACING.lg, paddingBottom: 80 },
  card: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: SPACING.md,
    marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  avatar: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.bgElevated,
    justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md,
  },
  info: { flex: 1 },
  docName: { fontSize: FONT_SIZES.base, fontWeight: '700', color: COLORS.textPrimary },
  docSpec: { fontSize: FONT_SIZES.sm, color: COLORS.primary, marginTop: 2 },
  date: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 4 },
  badge: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full },
  badgeText: { fontSize: FONT_SIZES.xs, fontWeight: '700', textTransform: 'capitalize' },
  notes: {
    fontSize: FONT_SIZES.sm, color: COLORS.textSecondary,
    marginTop: SPACING.sm, fontStyle: 'italic',
  },
  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.error + '44',
    backgroundColor: `${COLORS.error}11`,
  },
  cancelText: { color: COLORS.error, fontSize: FONT_SIZES.sm, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: COLORS.textMuted, marginTop: SPACING.md, fontSize: FONT_SIZES.base },
});
