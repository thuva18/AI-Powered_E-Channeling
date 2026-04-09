// app/(patient)/book.tsx
// Member 2 – Patient Core Module
// Book appointment with AI-powered doctor/specialist prediction

import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

// Types removed
export default function BookAppointmentScreen() {
  const [doctors, setDoctors] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // AI prediction state
  const [symptoms, setSymptoms] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Booking state
  const [selected, setSelected] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');

  const fetchDoctors = useCallback(async () => {
    try {
      const res = await api.get('/patients/doctors');
      setDoctors(res.data || []);
      setFiltered(res.data || []);
    } catch (e) {
      console.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDoctors(); }, []);

  // Search filter
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      q
        ? doctors.filter(
            (d) =>
              d.name.toLowerCase().includes(q) ||
              d.specialization?.toLowerCase().includes(q),
          )
        : doctors,
    );
  }, [search, doctors]);

  // AI specialist prediction
  const handleAIPredict = async () => {
    if (!symptoms.trim()) { Alert.alert('Enter symptoms', 'Describe your symptoms to get AI recommendations.'); return; }
    setAiLoading(true);
    try {
      const res = await api.post('/ai/predict', { symptoms: symptoms.trim() });
      setAiResult(res.data);
      // Auto-filter doctors by predicted specialist
      if (res.data?.specialist) {
        const spec = res.data.specialist.toLowerCase();
        setFiltered(doctors.filter((d) => d.specialization?.toLowerCase().includes(spec)));
        setSearch(res.data.specialist);
      }
    } catch (e) {
      Alert.alert('AI Error', e.response?.data?.message ?? 'AI prediction failed');
    } finally {
      setAiLoading(false);
    }
  };

  // Book appointment
  const handleBook = async () => {
    if (!selected) return;
    if (!selectedDate.trim()) { Alert.alert('Select Date', 'Please enter your preferred date.'); return; }
    setBookingLoading(true);
    try {
      await api.post('/patients/appointments', {
        doctorId: selected._id,
        appointmentDate: selectedDate,
        timeSlot: selectedSlot || 'morning',
      });
      Alert.alert('✅ Booked!', `Appointment with Dr. ${selected.name} has been requested.`, [
        { text: 'OK', onPress: () => { setSelected(null); setSelectedDate(''); setSelectedSlot(''); } },
      ]);
    } catch (e) {
      Alert.alert('Booking Failed', e.response?.data?.message ?? 'Try again later');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Book Appointment</Text>
        <Text style={styles.subtitle}>Find & book your doctor</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* AI Prediction Panel */}
        <View style={styles.aiCard}>
          <View style={styles.aiHeader}>
            <View style={styles.aiIconBox}>
              <Text style={{ fontSize: 20 }}>🤖</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.aiTitle}>AI Symptom Analysis</Text>
              <Text style={styles.aiSub}>Describe your symptoms for smart doctor matching</Text>
            </View>
          </View>
          <TextInput
            style={styles.aiInput}
            placeholder="e.g. fever, headache, sore throat..."
            placeholderTextColor={COLORS.textMuted}
            value={symptoms}
            onChangeText={setSymptoms}
            multiline
            numberOfLines={3}
          />
          {aiResult && (
            <View style={styles.aiResult}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
              <Text style={styles.aiResultText}>
                {'  '}Recommended: <Text style={{ color: COLORS.success, fontWeight: '700' }}>{aiResult.specialist}</Text>
                {aiResult.confidence ? `  (${Math.round(aiResult.confidence * 100)}% confidence)` : ''}
              </Text>
            </View>
          )}
          <TouchableOpacity style={styles.aiBtn} onPress={handleAIPredict} disabled={aiLoading} activeOpacity={0.8}>
            {aiLoading ? <ActivityIndicator color={COLORS.white} size="small" /> : (
              <>
                <Ionicons name="flash" size={16} color={COLORS.white} />
                <Text style={styles.aiBtnText}>  Analyse Symptoms</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <Ionicons name="search" size={18} color={COLORS.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search doctors or specialization..."
            placeholderTextColor={COLORS.textMuted}
            value={search}
            onChangeText={(v) => { setSearch(v); setAiResult(null); }}
          />
          {search ? (
            <TouchableOpacity onPress={() => { setSearch(''); setFiltered(doctors); setAiResult(null); }}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Doctor List */}
        <Text style={styles.sectionTitle}>
          {filtered.length} Doctor{filtered.length !== 1 ? 's' : ''} Available
        </Text>

        {loading ? (
          <ActivityIndicator color={COLORS.primary} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="search-outline" size={36} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No doctors found</Text>
          </View>
        ) : (
          filtered.map((doc) => (
            <TouchableOpacity
              key={doc._id}
              style={[styles.doctorCard, selected?._id === doc._id && styles.doctorCardSelected]}
              onPress={() => setSelected(selected?._id === doc._id ? null : doc)}
              activeOpacity={0.8}
            >
              <View style={styles.doctorAvatar}>
                <Text style={{ fontSize: 22 }}>👨‍⚕️</Text>
              </View>
              <View style={styles.doctorInfo}>
                <Text style={styles.doctorName}>Dr. {doc.name}</Text>
                <Text style={styles.doctorSpec}>{doc.specialization}</Text>
                {doc.hospital && <Text style={styles.doctorHosp}>🏥 {doc.hospital}</Text>}
              </View>
              <View style={styles.doctorRight}>
                {doc.fee && <Text style={styles.doctorFee}>Rs. {doc.fee}</Text>}
                <Ionicons
                  name={selected?._id === doc._id ? 'checkmark-circle' : 'chevron-forward'}
                  size={20}
                  color={selected?._id === doc._id ? COLORS.success : COLORS.textMuted}
                />
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* Booking Form – shows when doctor is selected */}
        {selected && (
          <View style={styles.bookingCard}>
            <Text style={styles.bookingTitle}>Confirm Booking</Text>
            <Text style={styles.bookingDoctor}>Dr. {selected.name} · {selected.specialization}</Text>

            <Text style={styles.label}>Preferred Date</Text>
            <View style={styles.inputRow}>
              <Ionicons name="calendar-outline" size={18} color={COLORS.textSecondary} style={{ marginRight: SPACING.sm }} />
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={COLORS.textMuted}
                value={selectedDate}
                onChangeText={setSelectedDate}
              />
            </View>

            <Text style={styles.label}>Time Slot</Text>
            <View style={styles.slotRow}>
              {['morning', 'afternoon', 'evening'].map((slot) => (
                <TouchableOpacity
                  key={slot}
                  style={[styles.slotBtn, selectedSlot === slot && styles.slotBtnActive]}
                  onPress={() => setSelectedSlot(slot)}
                >
                  <Text style={[styles.slotBtnText, selectedSlot === slot && styles.slotBtnTextActive]}>
                    {slot.charAt(0).toUpperCase() + slot.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.bookBtn, bookingLoading && styles.btnDisabled]}
              onPress={handleBook}
              disabled={bookingLoading}
              activeOpacity={0.8}
            >
              {bookingLoading
                ? <ActivityIndicator color={COLORS.white} />
                : <Text style={styles.bookBtnText}>Confirm Appointment</Text>
              }
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
  subtitle: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  scroll: { flex: 1 },
  content: { padding: SPACING.lg, paddingBottom: 80 },
  aiCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    padding: SPACING.lg, marginBottom: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.accent + '44', ...SHADOWS.md,
  },
  aiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  aiIconBox: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: `${COLORS.accent}22`, justifyContent: 'center', alignItems: 'center',
    marginRight: SPACING.md,
  },
  aiTitle: { fontSize: FONT_SIZES.base, fontWeight: '700', color: COLORS.textPrimary },
  aiSub: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },
  aiInput: {
    backgroundColor: COLORS.bgInput, borderRadius: RADIUS.md, borderWidth: 1,
    borderColor: COLORS.border, padding: SPACING.md, color: COLORS.textPrimary,
    fontSize: FONT_SIZES.base, minHeight: 72, marginBottom: SPACING.sm,
  },
  aiResult: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: `${COLORS.success}11`,
    padding: SPACING.sm, borderRadius: RADIUS.sm, marginBottom: SPACING.sm,
  },
  aiResultText: { color: COLORS.textSecondary, fontSize: FONT_SIZES.sm },
  aiBtn: {
    backgroundColor: COLORS.accent, borderRadius: RADIUS.md, height: 44,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
  },
  aiBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZES.sm },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md, height: 48, marginBottom: SPACING.md,
  },
  searchIcon: { marginRight: SPACING.sm },
  searchInput: { flex: 1, color: COLORS.textPrimary, fontSize: FONT_SIZES.base },
  sectionTitle: {
    fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SPACING.md,
  },
  emptyBox: { alignItems: 'center', padding: SPACING.xl },
  emptyText: { color: COLORS.textMuted, marginTop: SPACING.sm },
  doctorCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, padding: SPACING.md,
    flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm,
  },
  doctorCardSelected: { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}11` },
  doctorAvatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.bgElevated,
    justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md,
  },
  doctorInfo: { flex: 1 },
  doctorName: { fontSize: FONT_SIZES.base, fontWeight: '600', color: COLORS.textPrimary },
  doctorSpec: { fontSize: FONT_SIZES.sm, color: COLORS.primary },
  doctorHosp: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 2 },
  doctorRight: { alignItems: 'flex-end', gap: 4 },
  doctorFee: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.accent },
  bookingCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.primary + '44', marginTop: SPACING.md, ...SHADOWS.md,
  },
  bookingTitle: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  bookingDoctor: { fontSize: FONT_SIZES.sm, color: COLORS.primary, marginBottom: SPACING.md },
  label: {
    fontSize: FONT_SIZES.xs, fontWeight: '600', color: COLORS.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SPACING.sm, marginTop: SPACING.sm,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bgInput,
    borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md, height: 48,
  },
  input: { flex: 1, color: COLORS.textPrimary, fontSize: FONT_SIZES.base },
  slotRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  slotBtn: {
    flex: 1, paddingVertical: SPACING.sm, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bgInput, alignItems: 'center',
  },
  slotBtnActive: { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}22` },
  slotBtnText: { color: COLORS.textSecondary, fontSize: FONT_SIZES.sm },
  slotBtnTextActive: { color: COLORS.primary, fontWeight: '700' },
  bookBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md, height: 52,
    justifyContent: 'center', alignItems: 'center', ...SHADOWS.lg,
  },
  btnDisabled: { opacity: 0.7 },
  bookBtnText: { color: COLORS.white, fontSize: FONT_SIZES.base, fontWeight: '700' },
});
