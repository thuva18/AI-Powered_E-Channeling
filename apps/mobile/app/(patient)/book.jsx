// app/(patient)/book.jsx
// Premium Patient Book Appointment & AI Prediction (Matches Web Feature-for-Feature)

import { useEffect, useState, useCallback, useRef } from 'react';
import useStyles from '../../hooks/useStyles';
import useTheme from '../../hooks/useTheme';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Modal, Image,
  KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import DatePickerInput from '../../components/DatePickerInput';
import { FONT_SIZES, SPACING, RADIUS } from '../../constants/theme';

export default function BookAppointmentScreen() {
  const styles = useStyles(getStyles);
  const { C } = useTheme();
  const [doctors, setDoctors] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // AI prediction state
  const [symptoms, setSymptoms] = useState('');
  const [images, setImages] = useState([]); // Dummy images
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  // Booking Modal State
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const scrollRef = useRef(null);
  const doctorListRef = useRef(null);

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

  useEffect(() => { fetchDoctors(); }, [fetchDoctors]);

  // Search filter
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      q
        ? doctors.filter(
            (d) =>
              d.firstName?.toLowerCase().includes(q) ||
              d.lastName?.toLowerCase().includes(q) ||
              d.name?.toLowerCase().includes(q) ||
              d.specialization?.toLowerCase().includes(q),
          )
        : doctors,
    );
  }, [search, doctors]);

  // AI specialist prediction
  const handleAIPredict = async () => {
    if (!symptoms.trim()) { Alert.alert('Enter symptoms', 'Describe your symptoms to get AI recommendations.'); return; }
    setAiLoading(true);
    setAiError('');
    try {
      const res = await api.post('/ai/predict-specialist', { symptoms: symptoms.trim() });
      setAiResult(res.data);
    } catch (e) {
      setAiError(e.response?.data?.message || 'AI service unavailable.');
    } finally {
      setAiLoading(false);
    }
  };

  const jumpToDoctors = (specialty) => {
    if (specialty) {
      setSearch(specialty);
    }
    // Scroll to the list area with a calculated offset
    // The ScrollView header is roughly 100, AI card is variable.
    // 600 is a safe bet to pass the prediction card.
    if (scrollRef.current) {
        scrollRef.current.scrollTo({ y: 620, animated: true });
    }
  };

  const handlePickImageMock = () => {
    // In a real app we'd use expo-image-picker. Mocking here.
    const mockImage = { uri: 'file://mock_path.jpg', name: `symptom_${Date.now()}.jpg` };
    setImages([...images, mockImage]);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Book Appointment</Text>
        <Text style={styles.subtitle}>Find & book your doctor</Text>
      </View>

      <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* AI Symptom Check */}
        <View style={styles.aiCard}>
          <View style={styles.aiHeaderRow}>
            <View style={styles.searchIconBg}>
              <Ionicons name="search" size={24} color={C.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.aiTitle}>Symptom Check</Text>
              <Text style={styles.aiSubText}>Describe what you're feeling — we'll find the right doctor</Text>
            </View>
          </View>

          <Text style={styles.label}>How are you feeling? *</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Describe your symptoms in detail (e.g. chest pain, persistent headache...)"
            placeholderTextColor={C.textMuted}
            value={symptoms}
            onChangeText={setSymptoms}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Upload Images (optional)</Text>
          <TouchableOpacity style={styles.imageUploadBtn} onPress={handlePickImageMock} activeOpacity={0.8}>
            <Ionicons name="cloud-upload-outline" size={20} color={C.textMuted} />
            <Text style={styles.imageUploadText}>Tap to add image (Mock)</Text>
          </TouchableOpacity>
          {images.length > 0 && (
            <View style={styles.imagePreviewRow}>
              {images.map((img, i) => (
                <View key={i} style={styles.imagePreviewContainer}>
                  <View style={styles.mockImgBox}>
                    <Ionicons name="image-outline" size={20} color={C.textSecondary} />
                  </View>
                  <TouchableOpacity style={styles.removeImgBtn} onPress={() => removeImage(i)}>
                    <Ionicons name="close" size={12} color={C.white} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={[styles.aiPredictBtn, (!symptoms.trim() || aiLoading || loading) && styles.btnDisabled]}
            onPress={handleAIPredict}
            disabled={!symptoms.trim() || aiLoading || loading}
          >
            {aiLoading ? <ActivityIndicator color={C.white} /> : (
              <>
                <Ionicons name="color-wand-outline" size={18} color={C.white} style={{ marginRight: 8 }} />
                <Text style={styles.aiPredictBtnText}>Find Doctor Specialization</Text>
              </>
            )}
          </TouchableOpacity>

          {aiError ? (
            <Text style={styles.aiErrorText}>⚠️ {aiError}</Text>
          ) : null}

          {/* AI Result Card Matching Web */}
          {aiResult && (
            <View style={styles.aiResultCard}>
              <View style={styles.aiResultHeader}>
                <View style={styles.aiResultIconBg}>
                  <Ionicons name="color-wand" size={18} color={C.white} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.aiRecommendationLabel}>AI Recommendation {aiResult.winningModel ? `· ${aiResult.winningModel}` : ''}</Text>
                  <Text style={styles.aiSpecialist}>{aiResult.specialist || aiResult.predictedSpecialist}</Text>
                </View>
                {aiResult.belowThreshold && (
                  <View style={styles.lowConfBadge}>
                    <Text style={styles.lowConfText}>LOW CONF</Text>
                  </View>
                )}
              </View>

              {aiResult.confidence !== undefined && (
                <View style={styles.confSection}>
                  <View style={styles.flexRowBetween}>
                    <Text style={styles.confLabel}><Ionicons name="trending-up" size={11} /> Confidence</Text>
                    <Text style={styles.confValue}>{Math.round(aiResult.confidence * 100)}%</Text>
                  </View>
                  <View style={styles.confBarBg}>
                    <View style={[styles.confBarFill, { width: `${Math.min(aiResult.confidence * 100, 100)}%`, backgroundColor: aiResult.confidence > 0.8 ? C.success : C.info }]} />
                  </View>
                </View>
              )}

              <TouchableOpacity 
                style={styles.findDocsActionBtn}
                onPress={() => jumpToDoctors(aiResult.predictedSpecialist)}
              >
                <Text style={styles.findDocsActionText}>Find {aiResult.predictedSpecialist} Doctors</Text>
                <Ionicons name="arrow-down" size={14} color="#000" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Doctor Search & List */}
        <View style={styles.searchRow}>
          <Ionicons name="search" size={18} color={C.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search doctors or specialization..."
            placeholderTextColor={C.textMuted}
            value={search}
            onChangeText={(v) => { setSearch(v); }}
          />
          {search ? (
            <TouchableOpacity onPress={() => { setSearch(''); }}>
              <Ionicons name="close-circle" size={18} color={C.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.listHeaderRow}>
          <Text style={styles.sectionTitle}>
            {search && aiResult?.predictedSpecialist === search 
              ? `Matched ${search}s (${filtered.length})`
              : `Available Doctors (${filtered.length})`}
          </Text>
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearFilterText}>Show All</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {loading ? (
          <ActivityIndicator color={C.primary} style={{ marginTop: 20 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="medkit-outline" size={36} color={C.textMuted} />
            <Text style={styles.emptyText}>No doctors available</Text>
          </View>
        ) : (
          filtered.map((doc) => (
            <View key={doc._id} style={styles.doctorCardWrapper}>
              <View style={styles.doctorCard}>
                <View style={styles.doctorAvatar}>
                  <Text style={{ fontSize: 24 }}>👨‍⚕️</Text>
                </View>
                <View style={styles.doctorInfo}>
                  <Text style={styles.doctorName}>Dr. {doc.firstName || doc.name} {doc.lastName || ''}</Text>
                  <Text style={styles.doctorSpec}>{doc.specialization}</Text>
                  <Text style={styles.doctorFee}>Fee: Rs. {doc.consultationFee || doc.fee || 'N/A'}</Text>
                </View>
                <TouchableOpacity
                  style={styles.bookActionBtn}
                  onPress={() => { setSelectedDoctor(doc); setShowModal(true); }}
                >
                  <Text style={styles.bookActionText}>Book</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Payment & Booking Modal */}
      {selectedDoctor && (
        <BookingModal
          visible={showModal}
          doctor={selectedDoctor}
          symptomText={symptoms}
          images={images}
          onClose={() => setShowModal(false)}
        />
      )}
    </KeyboardAvoidingView>
  );
}

// ─── Booking Modal Component ─────────────────────────────────────────────
function BookingModal({ visible, doctor, symptomText, images, onClose }) {
  const styles = useStyles(getStyles);
  const { C } = useTheme();
  const [step, setStep] = useState(1);
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [receiptMode, setReceiptMode] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [fetchingSlots, setFetchingSlots] = useState(false);


  useEffect(() => {
    if (visible) {
      setStep(1); setDate(''); setSlot(''); setPaymentMethod(''); setPaymentRef(''); setReceiptMode(false);
      setAvailableSlots([]);
    }
  }, [visible]);

  useEffect(() => {
    if (date.length === 10 && step === 1) {
      fetchSlots(date);
    } else {
      setAvailableSlots([]);
      setSlot('');
    }
  }, [date]);

  const fetchSlots = async (selectedDate) => {
    setFetchingSlots(true);
    try {
      const res = await api.get(`/patients/doctors/${doctor._id}/slots?date=${selectedDate}`);
      setAvailableSlots(res.data?.slots || []);
    } catch (e) {
      // Fallback or error
      setAvailableSlots([]);
    } finally {
      setFetchingSlots(false);
    }
  };

  const handleNext = () => {
    if (!date.trim()) { Alert.alert('Error', 'Please enter a date.'); return; }
    if (!slot) { Alert.alert('Error', 'Please select a time slot.'); return; }
    setStep(2);
  };

  const handleSubmit = async () => {
    if (paymentMethod !== 'PAYHERE' && !paymentRef.trim()) {
      Alert.alert('Error', 'Please enter payment reference.'); return;
    }
    
    setSubmitting(true);

    // Build symptom data correctly matching the backend fields
    const symptomDescription = (symptomText || '').trim();
    const symptomsArray = symptomDescription
      ? symptomDescription.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean).slice(0, 12)
      : [];

    try {
      const payload = {
        doctorId: doctor._id,
        appointmentDate: date,
        timeSlot: slot,
        method: paymentMethod,
        symptomDescription,
        symptoms: symptomsArray,
        symptomImages: images.map(i => i.uri || i.name || '').filter(Boolean),
      };

      const resInit = await api.post('/payments/initiate', payload);
      const transactionId = resInit.data?.transactionId;

      // Submit the payment reference immediately for non-PayHere methods
      if (paymentMethod !== 'PAYHERE' && transactionId) {
        await api.post(`/payments/${transactionId}/dummy-submit`, {
          paymentReference: paymentRef,
          paymentNote: '',
        });
      } else if (paymentMethod === 'PAYHERE' && transactionId) {
        // Fallback for mobile PayHere to check if status gets mocked on dev environment
        await api.get(`/payments/${transactionId}/status`).catch(() => {});
      }
      setReceiptMode(true);
    } catch (e) {
      Alert.alert('Booking Error', e.response?.data?.message || 'Failed to complete payment and booking.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <>
      <Text style={styles.modalStepTitle}>Select Date & Time</Text>
      <DatePickerInput
        value={date}
        onChange={setDate}
        minimumDate={new Date()}
        accentColor={C.patientPrimary}
        placeholder="Tap to select date"
        style={{ marginBottom: SPACING.md }}
      />

      <Text style={styles.label}>Time Slot</Text>
      {fetchingSlots ? (
        <ActivityIndicator size="small" color={C.patientPrimary} style={{ marginVertical: SPACING.md }} />
      ) : availableSlots.length > 0 ? (
        <View style={styles.dynamicSlotRow}>
          {availableSlots.map((s, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.slotSelectBtn,
                { flex: 0, width: '48%', marginBottom: SPACING.sm },
                slot === s.slot && styles.slotSelectBtnActive,
                !s.available && styles.slotSelectBtnDisabled,
              ]}
              onPress={() => s.available && setSlot(s.slot)}
              disabled={!s.available}
            >
              <Text style={[
                styles.slotSelectText,
                slot === s.slot && styles.slotSelectTextActive,
                !s.available && styles.slotSelectTextDisabled,
              ]}>
                {s.slot}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : date.length === 10 ? (
        <Text style={{ color: C.error, fontSize: FONT_SIZES.sm, marginTop: 4, marginBottom: SPACING.md }}>
          No slots available for this date.
        </Text>
      ) : (
        <Text style={{ color: C.textMuted, fontSize: FONT_SIZES.xs, marginTop: 4, marginBottom: SPACING.md }}>
          Enter date (YYYY-MM-DD) to see slots
        </Text>
      )}

      <TouchableOpacity style={styles.primaryModalBtn} onPress={handleNext}>
        <Text style={styles.primaryModalBtnText}>Continue to Payment</Text>
        <Ionicons name="arrow-forward" size={16} color={C.white} style={{ marginLeft: 6 }} />
      </TouchableOpacity>
    </>
  );

  const renderStep2 = () => (
    <>
      <Text style={styles.modalStepTitle}>Payment Details</Text>
      <View style={styles.billBox}>
        <View style={styles.flexRowBetween}><Text style={styles.billText}>Consultation Fee</Text><Text style={styles.billValue}>Rs. {doctor.consultationFee || doctor.fee}</Text></View>
        <View style={styles.flexRowBetween}><Text style={styles.billText}>Platform Fee</Text><Text style={styles.billValue}>Rs. 0</Text></View>
        <View style={[styles.flexRowBetween, { marginTop: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: C.border }]}><Text style={[styles.billText, { fontWeight: '700' }]}>Total</Text><Text style={[styles.billValue, { color: C.success, fontSize: FONT_SIZES.md }]}>Rs. {doctor.consultationFee || doctor.fee}</Text></View>
      </View>

      <Text style={styles.label}>Select Payment Method</Text>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: SPACING.md }}>
        {['BANK_TRANSFER', 'PAYHERE', 'PAYPAL'].map((m) => (
          <TouchableOpacity
            key={m}
            style={[styles.payMethodBtn, paymentMethod === m && styles.payMethodBtnActive]}
            onPress={() => setPaymentMethod(m)}
          >
            <Text style={[styles.payMethodText, paymentMethod === m && styles.payMethodTextActive]}>
              {m.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {paymentMethod === 'PAYHERE' && (
        <View style={styles.infoBox}>
          <Text style={{ color: C.warning, fontSize: FONT_SIZES.sm }}>Mobile PayHere SDK is limited. We will fall back to manual verification or mock success.</Text>
        </View>
      )}

      {(paymentMethod === 'BANK_TRANSFER' || paymentMethod === 'PAYPAL' || paymentMethod === 'PAYHERE') && (
        <>
          <Text style={styles.label}>Reference Number / Transaction ID</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="e.g. TXN123456"
            placeholderTextColor={C.textMuted}
            value={paymentRef}
            onChangeText={setPaymentRef}
          />
        </>
      )}

      <View style={styles.modalActionRow}>
        <TouchableOpacity style={styles.secondaryModalBtn} onPress={() => setStep(1)} disabled={submitting}>
          <Text style={styles.secondaryModalBtnText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.primaryModalBtn, { flex: 1 }, submitting && styles.btnDisabled]} onPress={handleSubmit} disabled={!paymentMethod || submitting}>
          {submitting ? <ActivityIndicator color={C.white} /> : (
            <>
              <Ionicons name="lock-closed" size={14} color={C.white} style={{ marginRight: 6 }} />
              <Text style={styles.primaryModalBtnText}>Confirm Booking</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </>
  );

  const renderReceipt = () => (
    <View style={{ alignItems: 'center', paddingVertical: SPACING.lg }}>
      <Ionicons name="checkmark-circle" size={64} color={C.success} />
      <Text style={[styles.modalStepTitle, { textAlign: 'center', marginTop: SPACING.md }]}>Booking Confirmed!</Text>
      <Text style={{ color: C.textSecondary, textAlign: 'center', marginVertical: SPACING.md }}>
        Your appointment with Dr. {doctor.firstName || doctor.name} on {date} ({slot}) has been successfully booked.
      </Text>
      <TouchableOpacity style={styles.primaryModalBtn} onPress={onClose}>
        <Text style={styles.primaryModalBtnText}>Done</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Book Dr. {doctor?.firstName || doctor?.name}</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={C.textMuted} /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody} bounces={false}>
            {receiptMode ? renderReceipt() : (step === 1 ? renderStep1() : renderStep2())}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (C, isDark, S) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.md,
    backgroundColor: C.headerBg, borderBottomWidth: 1, borderBottomColor: C.headerBorder,
  },
  title: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: C.textPrimary },
  subtitle: { fontSize: FONT_SIZES.sm, color: C.textSecondary, marginTop: 2 },
  scroll: { flex: 1 },
  content: { padding: SPACING.lg, paddingBottom: 100 },
  
  // AI Card
  aiCard: {
    backgroundColor: C.cardBgTranslucent, borderRadius: RADIUS.xl, padding: SPACING.lg,
    borderWidth: 1, borderColor: C.cardInnerBorder, marginBottom: SPACING.xl, ...S.md,
  },
  aiHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md },
  searchIconBg: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center', ...S.glowPurple },
  aiTitle: { fontSize: FONT_SIZES.lg, fontWeight: '800', color: C.textPrimary },
  aiSubText: { fontSize: FONT_SIZES.xs, color: C.textSecondary, marginTop: 2 },
  
  label: { fontSize: 12, fontWeight: '700', color: C.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SPACING.xs, marginTop: SPACING.md },
  textArea: {
    backgroundColor: C.inputBgAlt, borderWidth: 1, borderColor: C.border,
    borderRadius: RADIUS.md, padding: SPACING.md, color: C.textPrimary, fontSize: FONT_SIZES.base,
  },
  imageUploadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    backgroundColor: C.inputBgAlt, borderWidth: 1, borderColor: C.border, borderRadius: RADIUS.md, borderStyle: 'dashed', padding: SPACING.md,
  },
  imageUploadText: { color: C.textMuted, fontSize: FONT_SIZES.sm, fontWeight: '600' },
  imagePreviewRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.sm },
  imagePreviewContainer: { position: 'relative' },
  mockImgBox: { width: 60, height: 60, backgroundColor: C.bgElevated, borderRadius: RADIUS.md, borderWidth: 1, borderColor: C.border, justifyContent: 'center', alignItems: 'center' },
  removeImgBtn: { position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: 10, backgroundColor: C.error, justifyContent: 'center', alignItems: 'center' },
  
  aiPredictBtn: {
    backgroundColor: '#4F46E5', borderRadius: RADIUS.md, height: 50,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: SPACING.lg, ...S.glowPurple
  },
  aiPredictBtnText: { color: C.white, fontWeight: '800', fontSize: FONT_SIZES.base },
  btnDisabled: { opacity: 0.5 },
  aiErrorText: { color: C.error, fontSize: FONT_SIZES.sm, marginTop: SPACING.sm },
  
  aiResultCard: {
    marginTop: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(139, 92, 246, 0.1)', borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.3)'
  },
  aiResultHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  aiResultIconBg: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#8B5CF6', justifyContent: 'center', alignItems: 'center' },
  aiRecommendationLabel: { fontSize: 10, fontWeight: '800', color: '#A78BFA', textTransform: 'uppercase', letterSpacing: 1 },
  aiSpecialist: { fontSize: FONT_SIZES.md, fontWeight: '800', color: C.textPrimary },
  lowConfBadge: { backgroundColor: 'rgba(245, 158, 11, 0.2)', borderWidth: 1, borderColor: '#F59E0B', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  lowConfText: { color: '#F59E0B', fontSize: 9, fontWeight: '800' },
  confSection: { marginTop: SPACING.sm },
  confLabel: { fontSize: 11, color: C.textSecondary, fontWeight: '600' },
  confValue: { fontSize: 11, fontWeight: '800', color: '#A78BFA' },
  confBarBg: { height: 6, backgroundColor: C.bgElevated, borderRadius: 3, marginTop: 4, overflow: 'hidden' },
  confBarFill: { height: '100%', borderRadius: 3 },
  flexRowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  // Search & List
  searchRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.cardBgTranslucent,
    borderRadius: RADIUS.md, borderWidth: 1, borderColor: C.cardInnerBorder,
    paddingHorizontal: SPACING.md, height: 50, marginBottom: SPACING.md, ...S.sm
  },
  searchIcon: { marginRight: SPACING.sm },
  searchInput: { flex: 1, color: C.textPrimary, fontSize: FONT_SIZES.base },
  sectionTitle: { fontSize: FONT_SIZES.sm, fontWeight: '800', color: C.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SPACING.md },
  emptyBox: { alignItems: 'center', padding: SPACING.xl },
  emptyText: { color: C.textMuted, marginTop: SPACING.sm, fontWeight: '600' },
  
  doctorCardWrapper: { marginBottom: SPACING.sm },
  doctorCard: {
    backgroundColor: C.cardBgTranslucent, borderRadius: RADIUS.lg, padding: SPACING.md,
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.cardInnerBorder, ...S.sm
  },
  doctorAvatar: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(78, 154, 241, 0.1)',
    borderWidth: 1, borderColor: 'rgba(78, 154, 241, 0.2)', justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md
  },
  doctorInfo: { flex: 1 },
  doctorName: { fontSize: FONT_SIZES.base, fontWeight: '800', color: C.textPrimary, marginBottom: 2 },
  doctorSpec: { fontSize: FONT_SIZES.sm, color: C.patientPrimary, fontWeight: '600' },
  doctorFee: { fontSize: FONT_SIZES.xs, color: C.textSecondary, marginTop: 4 },
  bookActionBtn: { backgroundColor: C.patientPrimary, borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: 8 },
  bookActionText: { color: '#000', fontWeight: '800', fontSize: FONT_SIZES.xs },

  findDocsActionBtn: {
    backgroundColor: C.patientPrimary,
    borderRadius: RADIUS.md,
    marginTop: SPACING.md,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...S.sm
  },
  findDocsActionText: {
    color: '#000',
    fontWeight: '800',
    fontSize: FONT_SIZES.sm
  },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: C.modalBg, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: C.headerBorder },
  modalTitle: { fontSize: FONT_SIZES.md, fontWeight: '800', color: C.textPrimary },
  modalBody: { padding: SPACING.lg, paddingBottom: 40 },
  modalStepTitle: { fontSize: FONT_SIZES.lg, fontWeight: '800', color: C.textPrimary, marginBottom: SPACING.md },
  modalInput: { backgroundColor: C.inputBgAlt, borderWidth: 1, borderColor: C.border, borderRadius: RADIUS.md, height: 48, paddingHorizontal: SPACING.md, color: C.textPrimary, fontSize: FONT_SIZES.base },
  datePickerRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.inputBgAlt, borderWidth: 1, borderColor: C.border,
    borderRadius: RADIUS.md, height: 52, paddingHorizontal: SPACING.md,
    marginBottom: 4,
  },
  datePickerRowFilled: { borderColor: C.patientPrimary, backgroundColor: `${C.patientPrimary}10` },
  slotRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  slotSelectBtn: { flex: 1, paddingVertical: 12, borderRadius: RADIUS.md, borderWidth: 1, borderColor: C.border, backgroundColor: C.inputBgAlt, alignItems: 'center' },
  slotSelectBtnActive: { borderColor: C.patientPrimary, backgroundColor: 'rgba(78, 154, 241, 0.15)' },
  slotSelectBtnDisabled: { borderColor: 'rgba(255,255,255,0.02)', backgroundColor: 'transparent', opacity: 0.5 },
  slotSelectText: { color: C.textSecondary, fontSize: FONT_SIZES.sm, fontWeight: '600', textTransform: 'capitalize' },
  slotSelectTextActive: { color: C.patientPrimary, fontWeight: '800' },
  slotSelectTextDisabled: { color: C.textMuted, textDecorationLine: 'line-through' },
  dynamicSlotRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: SPACING.sm },
  
  billBox: { backgroundColor: C.subtleBg, padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1, borderColor: C.cardInnerBorder, marginBottom: SPACING.md },
  billText: { fontSize: FONT_SIZES.sm, color: C.textSecondary },
  billValue: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: C.textPrimary },
  
  payMethodBtn: { flex: 1, paddingVertical: 10, borderRadius: RADIUS.md, borderWidth: 1, borderColor: C.border, backgroundColor: C.inputBgAlt, alignItems: 'center' },
  payMethodBtnActive: { borderColor: C.patientPrimary, backgroundColor: 'rgba(78, 154, 241, 0.15)' },
  payMethodText: { color: C.textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  payMethodTextActive: { color: C.patientPrimary, fontWeight: '800' },
  
  infoBox: { backgroundColor: 'rgba(245, 166, 35, 0.1)', padding: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 1, borderColor: 'rgba(245, 166, 35, 0.3)', marginBottom: SPACING.md },
  
  primaryModalBtn: { flexDirection: 'row', backgroundColor: C.patientPrimary, height: 50, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center', marginTop: SPACING.xl },
  primaryModalBtnText: { color: '#000', fontSize: FONT_SIZES.base, fontWeight: '800' },
  secondaryModalBtn: { backgroundColor: C.bgElevated, height: 50, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center', paddingHorizontal: SPACING.lg, marginTop: SPACING.xl },
  secondaryModalBtnText: { color: C.textPrimary, fontSize: FONT_SIZES.base, fontWeight: '700' },
  modalActionRow: { flexDirection: 'row', gap: SPACING.sm },
});
