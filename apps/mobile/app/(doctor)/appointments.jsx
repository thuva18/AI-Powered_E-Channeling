// app/(doctor)/appointments.jsx
// Doctor Appointments Module – view & manage appointment statuses
// Fully theme-reactive using useStyles hook

import { useEffect, useState, useCallback } from 'react';
import useStyles from '../../hooks/useStyles';
import useTheme from '../../hooks/useTheme';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl, Image, ScrollView, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import DatePickerInput from '../../components/DatePickerInput';
import ScreenTransition from '../../components/common/ScreenTransition';
import { FONT_SIZES, SPACING, RADIUS } from '../../constants/theme';

const VALID_TRANSITIONS = {
  PENDING: ['ACCEPTED', 'REJECTED'],
  ACCEPTED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
  REJECTED: [],
};

export default function DoctorAppointmentsScreen() {
  const styles = useStyles(getStyles);
  const { C, isDark } = useTheme();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [selectedDateFilter, setSelectedDateFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  const statusColor = useCallback((s) => {
    const map = {
      ACCEPTED: C.success, PENDING: C.warning, CANCELLED: C.error,
      COMPLETED: C.info, REJECTED: C.error,
    };
    return map[s] ?? C.textSecondary;
  }, [C]);

  const statusIcon = useCallback((s) => {
    const map = {
      ACCEPTED: 'checkmark-circle', PENDING: 'time', CANCELLED: 'close-circle',
      COMPLETED: 'checkmark-done-circle', REJECTED: 'ban',
    };
    return map[s] ?? 'ellipse';
  }, []);

  const actionBgColor = useCallback((s) => {
    const map = { ACCEPTED: C.success, REJECTED: C.error, CANCELLED: C.error, COMPLETED: C.info };
    return map[s] ?? C.primary;
  }, [C]);

  const actionLabel = useCallback((s) => {
    const map = { ACCEPTED: '✓ Accept', REJECTED: '✕ Reject', CANCELLED: '✕ Cancel', COMPLETED: '✔ Complete' };
    return map[s] ?? s;
  }, []);

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
    const sc = statusColor(item.status);

    return (
      <View style={[styles.card, { borderLeftColor: sc }]}>
        {/* Patient info */}
        <View style={styles.cardHeader}>
          <View style={[styles.patientAvatar, { backgroundColor: `${sc}12` }]}>
            <Ionicons name="person" size={18} color={sc} />
          </View>
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>{patientName}</Text>
            {patientProfile.phone && (
              <View style={styles.contactRow}>
                <Ionicons name="call-outline" size={11} color={C.textMuted} />
                <Text style={styles.patientContact}>{patientProfile.phone}</Text>
              </View>
            )}
            {item.appointmentDate && (
              <View style={styles.contactRow}>
                <Ionicons name="calendar-outline" size={11} color={C.textMuted} />
                <Text style={styles.aptDate}>
                  {new Date(item.appointmentDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  {item.timeSlot ? ` · ${item.timeSlot}` : ''}
                </Text>
              </View>
            )}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: sc + '18' }]}>
            <Ionicons name={statusIcon(item.status)} size={12} color={sc} />
            <Text style={[styles.statusText, { color: sc }]}>{item.status}</Text>
          </View>
        </View>

        {/* Symptom expand toggle */}
        {(hasSymptoms || hasImages) && (
          <TouchableOpacity
            style={styles.viewSymptomBtn}
            onPress={() => setExpandedId(isExpanded ? null : item._id)}
            activeOpacity={0.7}
          >
            <Ionicons name={isExpanded ? 'chevron-up' : 'document-text-outline'} size={14} color={C.doctorPrimary} />
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

        {item.notes && !isExpanded && (
          <View style={styles.notesRow}>
            <Ionicons name="document-text-outline" size={12} color={C.textMuted} />
            <Text style={styles.notes}>{item.notes}</Text>
          </View>
        )}

        {/* Status action buttons */}
        {transitions.length > 0 && (
          <View style={styles.actionsRow}>
            {transitions.map((s) => {
              const ac = actionBgColor(s);
              return (
                <TouchableOpacity
                  key={s}
                  style={[styles.actionBtn, { backgroundColor: ac + '15', borderColor: ac + '35' }]}
                  onPress={() => updateStatus(item._id, s)}
                  disabled={updatingId === item._id}
                  activeOpacity={0.7}
                >
                  {updatingId === item._id
                    ? <ActivityIndicator size="small" color={ac} />
                    : <Text style={[styles.actionBtnText, { color: ac }]}>
                        {actionLabel(s)}
                      </Text>
                  }
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  return (
    <ScreenTransition style={styles.root}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Appointments</Text>
          <Text style={styles.subtitle}>{appointments.length} total · {displayList.length} shown</Text>
        </View>
        <View style={styles.headerBadge}>
          <Ionicons name="calendar" size={18} color={C.doctorPrimary} />
        </View>
      </View>

      {/* Filter */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {['ALL', 'PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED'].map((f) => {
            const count = f === 'ALL' ? appointments.length : appointments.filter(a => a.status === f).length;
            const isActive = filter === f;
            return (
              <TouchableOpacity
                key={f} style={[styles.filterTab, isActive && styles.filterTabActive]}
                onPress={() => setFilter(f)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {f}
                </Text>
                <View style={[styles.badge, isActive ? styles.badgeActive : styles.badgeInactive]}>
                  <Text style={[styles.badgeText, isActive && styles.badgeTextActive]}>{count}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <DatePickerInput
          value={selectedDateFilter}
          onChange={setSelectedDateFilter}
          placeholder="Filter by date"
          accentColor={C.doctorPrimary}
          style={{ marginHorizontal: SPACING.lg, marginBottom: SPACING.md }}
        />
      </View>

      {loading ? <ActivityIndicator color={C.doctorPrimary} style={{ marginTop: 40 }} /> : (
        <FlatList
          data={displayList}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.doctorPrimary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="calendar-outline" size={32} color={C.doctorPrimary} />
              </View>
              <Text style={styles.emptyTitle}>No {filter !== 'ALL' ? filter.toLowerCase() : ''} appointments</Text>
              <Text style={styles.emptySubtitle}>Pull down to refresh or adjust filters</Text>
            </View>
          }
        />
      )}

      {/* Image Lightbox Modal */}
      <Modal visible={!!selectedImage} transparent animationType="fade" onRequestClose={() => setSelectedImage(null)}>
        <View style={styles.lightboxOverlay}>
          <TouchableOpacity style={styles.lightboxClose} onPress={() => setSelectedImage(null)}>
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>
          {selectedImage && (
            <Image source={{ uri: selectedImage }} style={styles.lightboxImage} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </ScreenTransition>
  );
}

const getStyles = (C, isDark, S) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.md,
    backgroundColor: C.headerBg,
    borderBottomWidth: 1, borderBottomColor: C.headerBorder,
  },
  title: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: C.textPrimary },
  subtitle: { fontSize: FONT_SIZES.xs, color: C.textSecondary, marginTop: 2 },
  headerBadge: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: `${C.doctorPrimary}15`, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: `${C.doctorPrimary}30`,
  },
  filterContainer: { borderBottomWidth: 1, borderBottomColor: C.border },
  filterRow: { flexDirection: 'row', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, gap: SPACING.sm },
  filterTab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: SPACING.md, paddingVertical: 8,
    borderRadius: RADIUS.full, backgroundColor: isDark ? C.bgElevated : C.bgCard,
    borderWidth: 1, borderColor: C.border,
  },
  filterTabActive: { backgroundColor: C.doctorPrimary, borderColor: C.doctorPrimary },
  filterText: { fontSize: 11, color: C.textSecondary, fontWeight: '700' },
  filterTextActive: { color: C.textInverse },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.full },
  badgeInactive: { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : C.bgElevated },
  badgeActive: { backgroundColor: 'rgba(0,0,0,0.15)' },
  badgeText: { fontSize: 10, fontWeight: '800', color: C.textSecondary },
  badgeTextActive: { color: C.textInverse },
  dateFilterContainer: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md, gap: SPACING.sm,
  },
  dateInput: {
    flex: 1, height: 42, backgroundColor: isDark ? C.bgElevated : C.bgInput,
    borderRadius: RADIUS.md, paddingHorizontal: SPACING.md,
    color: C.textPrimary, fontSize: FONT_SIZES.sm, borderWidth: 1, borderColor: C.border,
  },
  list: { padding: SPACING.lg, paddingBottom: 100 },
  card: {
    backgroundColor: isDark ? 'rgba(17, 24, 39, 0.9)' : C.bgCard,
    borderRadius: RADIUS.lg, padding: SPACING.md,
    marginBottom: SPACING.md, borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.06)' : C.border,
    borderLeftWidth: 4, ...S.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  patientAvatar: {
    width: 46, height: 46, borderRadius: 23,
    justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md,
  },
  patientInfo: { flex: 1 },
  patientName: { fontSize: FONT_SIZES.base, fontWeight: '700', color: C.textPrimary },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  patientContact: { fontSize: FONT_SIZES.xs, color: C.textSecondary },
  aptDate: { fontSize: FONT_SIZES.xs, color: C.textMuted },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full,
  },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  notesRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: SPACING.sm },
  notes: { flex: 1, fontSize: FONT_SIZES.sm, color: C.textSecondary, fontStyle: 'italic' },
  actionsRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
  actionBtn: {
    flex: 1, paddingVertical: 10, borderRadius: RADIUS.md,
    alignItems: 'center', borderWidth: 1,
  },
  actionBtnText: { fontSize: FONT_SIZES.sm, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: `${C.doctorPrimary}15`, justifyContent: 'center', alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: { fontSize: FONT_SIZES.base, fontWeight: '700', color: C.textPrimary },
  emptySubtitle: { color: C.textMuted, marginTop: 4, fontSize: FONT_SIZES.sm },

  // Symptom panel
  viewSymptomBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: SPACING.sm, paddingVertical: 7, paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md, backgroundColor: `${C.doctorPrimary}10`,
    borderWidth: 1, borderColor: `${C.doctorPrimary}22`, alignSelf: 'flex-start',
  },
  viewSymptomText: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: C.doctorPrimary },
  symptomPanel: {
    marginTop: SPACING.sm, padding: SPACING.md,
    backgroundColor: isDark ? 'rgba(34, 201, 160, 0.04)' : 'rgba(15, 168, 123, 0.04)',
    borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: `${C.doctorPrimary}18`,
  },
  symptomSection: { marginBottom: SPACING.sm },
  symptomLabel: {
    fontSize: 10, fontWeight: '800', color: C.doctorPrimary,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4,
  },
  symptomText: {
    fontSize: FONT_SIZES.sm, color: C.textSecondary,
    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : C.bgInput,
    padding: SPACING.sm,
    borderRadius: RADIUS.sm, borderWidth: 1, borderColor: C.cardInnerBorder,
    lineHeight: 20,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    paddingHorizontal: SPACING.sm, paddingVertical: 4,
    borderRadius: RADIUS.full, backgroundColor: `${C.doctorPrimary}15`,
    borderWidth: 1, borderColor: `${C.doctorPrimary}28`,
  },
  tagText: { fontSize: FONT_SIZES.xs, color: C.doctorPrimary, fontWeight: '700' },
  symptomImage: {
    width: 80, height: 80, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: `${C.doctorPrimary}30`,
  },
  lightboxOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center', alignItems: 'center',
  },
  lightboxClose: {
    position: 'absolute', top: 54, right: 20, zIndex: 10,
    padding: 10, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: RADIUS.full,
  },
  lightboxImage: { flex: 1, width: '100%', height: '100%' },
});
