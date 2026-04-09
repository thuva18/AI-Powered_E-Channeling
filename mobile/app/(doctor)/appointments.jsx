// app/(doctor)/appointments.tsx
// Member 3 – Doctor Appointments Module
// Doctor view appointments & update status

import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

// Types removed

const VALID_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export default function DoctorAppointmentsScreen() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [filter, setFilter] = useState('all');

  const fetchAppointments = useCallback(async () => {
    try {
      const res = await api.get('/doctors/appointments');
      setAppointments(res.data || []);
    } catch { Alert.alert('Error', 'Failed to load appointments'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchAppointments(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchAppointments(); };

  const updateStatus = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      await api.patch(`/doctors/appointments/${id}/status`, { status: newStatus });
      setAppointments((prev) =>
        prev.map((a) => a._id === id ? { ...a, status: newStatus } : a),
      );
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message ?? 'Status update failed');
    } finally { setUpdatingId(null); }
  };

  const displayList = filter === 'all' ? appointments : appointments.filter((a) => a.status === filter);

  const renderItem = ({ item }) => {
    const transitions = VALID_TRANSITIONS[item.status] ?? [];
    return (
      <View style={styles.card}>
        {/* Patient info */}
        <View style={styles.cardHeader}>
          <View style={styles.patientAvatar}>
            <Text style={{ fontSize: 20 }}>🧑</Text>
          </View>
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>{item.patient?.name ?? 'Patient'}</Text>
            {item.patient?.phone && <Text style={styles.patientContact}>📞 {item.patient.phone}</Text>}
            {item.appointmentDate && (
              <Text style={styles.aptDate}>
                📅 {new Date(item.appointmentDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                {item.timeSlot ? ` · ${item.timeSlot}` : ''}
              </Text>
            )}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor(item.status) + '22' }]}>
            <Text style={[styles.statusText, { color: statusColor(item.status) }]}>{item.status}</Text>
          </View>
        </View>

        {item.notes && <Text style={styles.notes}>📝 {item.notes}</Text>}

        {/* Status action buttons */}
        {transitions.length > 0 && (
          <View style={styles.actionsRow}>
            {transitions.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.actionBtn, { backgroundColor: actionBgColor(s) + '22', borderColor: actionBgColor(s) + '44' }]}
                onPress={() => updateStatus(item._id, s)}
                disabled={updatingId === item._id}
              >
                {updatingId === item._id
                  ? <ActivityIndicator size="small" color={actionBgColor(s)} />
                  : <Text style={[styles.actionBtnText, { color: actionBgColor(s) }]}>
                      {actionLabel(s)}
                    </Text>
                }
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Appointments</Text>
        <Text style={styles.subtitle}>{appointments.length} total</Text>
      </View>

      {/* Filter */}
      <View style={styles.filterRow}>
        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((f) => (
          <TouchableOpacity
            key={f} style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? <ActivityIndicator color={COLORS.doctorPrimary} style={{ marginTop: 40 }} /> : (
        <FlatList
          data={displayList}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.doctorPrimary} />}
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

function statusColor(s) {
  return { confirmed: COLORS.success, pending: COLORS.warning, cancelled: COLORS.error, completed: COLORS.info }[s] ?? COLORS.textSecondary;
}

function actionBgColor(s) {
  return { confirmed: COLORS.success, cancelled: COLORS.error, completed: COLORS.info }[s] ?? COLORS.primary;
}

function actionLabel(s) {
  return { confirmed: '✓ Confirm', cancelled: '✕ Cancel', completed: '✔ Complete' }[s] ?? s;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.md,
    backgroundColor: COLORS.bgCard, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  title: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.textPrimary },
  subtitle: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  filterRow: { flexDirection: 'row', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, gap: SPACING.sm },
  filterTab: {
    paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full, backgroundColor: COLORS.bgCard,
    borderWidth: 1, borderColor: COLORS.border,
  },
  filterTabActive: { backgroundColor: COLORS.doctorPrimary, borderColor: COLORS.doctorPrimary },
  filterText: { fontSize: 10, color: COLORS.textSecondary, fontWeight: '600' },
  filterTextActive: { color: COLORS.textInverse },
  list: { padding: SPACING.lg, paddingBottom: 80 },
  card: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: SPACING.md,
    marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  patientAvatar: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.bgElevated,
    justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md,
  },
  patientInfo: { flex: 1 },
  patientName: { fontSize: FONT_SIZES.base, fontWeight: '700', color: COLORS.textPrimary },
  patientContact: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  aptDate: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 4 },
  statusBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full },
  statusText: { fontSize: FONT_SIZES.xs, fontWeight: '700', textTransform: 'capitalize' },
  notes: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: SPACING.sm, fontStyle: 'italic' },
  actionsRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
  actionBtn: {
    flex: 1, paddingVertical: SPACING.sm, borderRadius: RADIUS.md,
    alignItems: 'center', borderWidth: 1,
  },
  actionBtnText: { fontSize: FONT_SIZES.sm, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: COLORS.textMuted, marginTop: SPACING.md },
});
