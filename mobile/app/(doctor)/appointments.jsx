// app/(doctor)/appointments.tsx
// Member 3 – Doctor Appointments Module
// Doctor view appointments & update status

import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl, Image, ScrollView, Modal, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

// Types removed

const VALID_TRANSITIONS = {
  PENDING: ['ACCEPTED', 'REJECTED'],
  ACCEPTED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
  REJECTED: [],
};

export default function DoctorAppointmentsScreen() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [selectedDateFilter, setSelectedDateFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

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

  const isSameCalendarDate = (dateValue, selectedDate) => {
    if (!selectedDate) return true;
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return false;
    const [year, month, day] = selectedDate.split('-').map(Number);
    if (!year || !month || !day) return false;
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  };

  const filteredByStatus = filter === 'ALL' ? appointments : appointments.filter((a) => a.status === filter);
  const displayList = filteredByStatus.filter((a) => isSameCalendarDate(a.appointmentDate, selectedDateFilter));

  const renderItem = ({ item }) => {
    const patientProfile = item.patientId?.patientProfile || {};
    const patientName = patientProfile.firstName
      ? `${patientProfile.firstName} ${patientProfile.lastName || ''}`.trim()
      : (item.patientId?.email || 'Patient');
    const isExpanded = expandedId === item._id;
    const hasSymptoms = !!(item.symptomDescription || (item.symptoms && item.symptoms.length > 0));
    const hasImages = item.symptomImages && item.symptomImages.length > 0;
    const transitions = VALID_TRANSITIONS[item.status] || [];

    return (
      <View style={styles.card}>
        {/* Patient info */}
        <View style={styles.cardHeader}>
          <View style={styles.patientAvatar}>
            <Text style={{ fontSize: 20 }}>🧑</Text>
          </View>
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>{patientName}</Text>
            {patientProfile.phone && <Text style={styles.patientContact}>📞 {patientProfile.phone}</Text>}
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

        {/* Symptom expand toggle */}
        {(hasSymptoms || hasImages) && (
          <TouchableOpacity
            style={styles.viewSymptomBtn}
            onPress={() => setExpandedId(isExpanded ? null : item._id)}
          >
            <Ionicons name={isExpanded ? 'chevron-up' : 'document-text-outline'} size={14} color={COLORS.doctorPrimary} />
            <Text style={styles.viewSymptomText}>
              {isExpanded ? 'Hide Symptoms' : 'View Symptoms'}
              {hasImages ? ` · ${item.symptomImages.length} image(s)` : ''}
            </Text>
          </TouchableOpacity>
        )}

        {/* Symptom detail panel */}
        {isExpanded && (
          <View style={styles.symptomPanel}>
            {item.symptomDescription ? (
              <View style={styles.symptomSection}>
                <Text style={styles.symptomLabel}>SYMPTOM DESCRIPTION</Text>
                <Text style={styles.symptomText}>{item.symptomDescription}</Text>
              </View>
            ) : null}

            {item.symptoms && item.symptoms.length > 0 ? (
              <View style={styles.symptomSection}>
                <Text style={styles.symptomLabel}>SYMPTOM TAGS</Text>
                <View style={styles.tagRow}>
                  {item.symptoms.map((s, idx) => (
                    <View key={idx} style={styles.tag}>
                      <Text style={styles.tagText}>{s}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {hasImages ? (
              <View style={styles.symptomSection}>
                <Text style={styles.symptomLabel}>UPLOADED IMAGES ({item.symptomImages.length})</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {item.symptomImages.map((src, idx) => (
                      <TouchableOpacity key={idx} onPress={() => setSelectedImage(src)}>
                        <Image
                          source={{ uri: src }}
                          style={styles.symptomImage}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            ) : null}
          </View>
        )}

        {item.notes && !isExpanded && <Text style={styles.notes}>📝 {item.notes}</Text>}

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
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {['ALL', 'PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED'].map((f) => {
            const count = f === 'ALL' ? appointments.length : appointments.filter(a => a.status === f).length;
            return (
              <TouchableOpacity
                key={f} style={[styles.filterTab, filter === f && styles.filterTabActive]}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                  {f}
                </Text>
                <View style={[styles.badge, filter === f ? styles.badgeActive : styles.badgeInactive]}>
                  <Text style={[styles.badgeText, filter === f && styles.badgeTextActive]}>{count}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <View style={styles.dateFilterContainer}>
          <Ionicons name="calendar" size={16} color={COLORS.textSecondary} />
          <TextInput
            style={styles.dateInput}
            placeholder="Filter by Date (YYYY-MM-DD)"
            placeholderTextColor={COLORS.textMuted}
            value={selectedDateFilter}
            onChangeText={setSelectedDateFilter}
          />
          {selectedDateFilter ? (
            <TouchableOpacity onPress={() => setSelectedDateFilter('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
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
              <Text style={styles.emptyText}>No {filter !== 'ALL' ? filter.toLowerCase() : ''} appointments</Text>
            </View>
          }
        />
      )}

      {/* Image Lightbox Modal */}
      <Modal visible={!!selectedImage} transparent animationType="fade" onRequestClose={() => setSelectedImage(null)}>
        <View style={styles.lightboxOverlay}>
          <TouchableOpacity style={styles.lightboxClose} onPress={() => setSelectedImage(null)}>
            <Ionicons name="close" size={32} color={COLORS.white} />
          </TouchableOpacity>
          {selectedImage && (
            <Image source={{ uri: selectedImage }} style={styles.lightboxImage} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </View>
  );
}

function statusColor(s) {
  return { ACCEPTED: COLORS.success, PENDING: COLORS.warning, CANCELLED: COLORS.error, COMPLETED: COLORS.info, REJECTED: COLORS.error }[s] ?? COLORS.textSecondary;
}

function actionBgColor(s) {
  return { ACCEPTED: COLORS.success, REJECTED: COLORS.error, CANCELLED: COLORS.error, COMPLETED: COLORS.info }[s] ?? COLORS.primary;
}

function actionLabel(s) {
  return { ACCEPTED: '✓ Accept', REJECTED: '✕ Reject', CANCELLED: '✕ Cancel', COMPLETED: '✔ Complete' }[s] ?? s;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.md,
    backgroundColor: COLORS.bgCard, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  title: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.textPrimary },
  subtitle: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  filterContainer: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  filterRow: { flexDirection: 'row', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, gap: SPACING.sm },
  filterTab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: SPACING.md, paddingVertical: 8,
    borderRadius: RADIUS.full, backgroundColor: COLORS.bgCard,
    borderWidth: 1, borderColor: COLORS.border,
  },
  filterTabActive: { backgroundColor: COLORS.doctorPrimary, borderColor: COLORS.doctorPrimary },
  filterText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '700' },
  filterTextActive: { color: COLORS.textInverse },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.full },
  badgeInactive: { backgroundColor: 'rgba(255,255,255,0.05)' },
  badgeActive: { backgroundColor: 'rgba(0,0,0,0.15)' },
  badgeText: { fontSize: 10, fontWeight: '800', color: COLORS.textSecondary },
  badgeTextActive: { color: COLORS.textInverse },
  dateFilterContainer: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md, gap: SPACING.sm
  },
  dateInput: {
    flex: 1, height: 40, backgroundColor: COLORS.bgElevated, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md,
    color: COLORS.textPrimary, fontSize: FONT_SIZES.sm, borderWidth: 1, borderColor: COLORS.border
  },
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

  // Symptom panel
  viewSymptomBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: SPACING.sm, paddingVertical: 6, paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md, backgroundColor: `${COLORS.doctorPrimary}12`,
    borderWidth: 1, borderColor: `${COLORS.doctorPrimary}25`, alignSelf: 'flex-start',
  },
  viewSymptomText: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.doctorPrimary },
  symptomPanel: {
    marginTop: SPACING.sm, padding: SPACING.md,
    backgroundColor: 'rgba(34, 201, 160, 0.05)', borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: `${COLORS.doctorPrimary}20`,
  },
  symptomSection: { marginBottom: SPACING.sm },
  symptomLabel: {
    fontSize: 10, fontWeight: '800', color: COLORS.doctorPrimary,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4,
  },
  symptomText: {
    fontSize: FONT_SIZES.sm, color: COLORS.textSecondary,
    backgroundColor: 'rgba(255,255,255,0.03)', padding: SPACING.sm,
    borderRadius: RADIUS.sm, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    lineHeight: 20,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    paddingHorizontal: SPACING.sm, paddingVertical: 3,
    borderRadius: RADIUS.full, backgroundColor: `${COLORS.doctorPrimary}18`,
    borderWidth: 1, borderColor: `${COLORS.doctorPrimary}30`,
  },
  tagText: { fontSize: FONT_SIZES.xs, color: COLORS.doctorPrimary, fontWeight: '700' },
  symptomImage: {
    width: 80, height: 80, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: `${COLORS.doctorPrimary}30`,
  },
  lightboxOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center', alignItems: 'center',
  },
  lightboxClose: {
    position: 'absolute', top: 50, right: 20, zIndex: 10,
    padding: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: RADIUS.full,
  },
  lightboxImage: { flex: 1, width: '100%', height: '100%' },
});
