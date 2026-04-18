// app/(doctor)/profile.jsx
// Doctor Profile & Availability — matches web DoctorProfile.jsx feature-for-feature

import { useState, useEffect, useCallback } from 'react';
import useStyles from '../../hooks/useStyles';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, Switch, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { COLORS as C, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const PHONE_REGEX = /^(07\d{8}|\+94\d{9})$/;
const MAX_SLOT_HOURS = 8;
const MAX_SLOTS_PER_DAY = 8;

const slotDurationHours = (start, end) => {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return (eh * 60 + em - (sh * 60 + sm)) / 60;
};

// ─── Field Component ─────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, readOnly, extra = {}, note, rightIcon }) {
  const styles = useStyles(getStyles);
  return (
    <View style={fStyles.wrap}>
      <Text style={fStyles.label}>{label}</Text>
      <View style={[fStyles.row, readOnly && fStyles.readOnly]}>
        <TextInput
          style={fStyles.input}
          value={value}
          onChangeText={readOnly ? undefined : onChange}
          placeholder={placeholder}
          placeholderTextColor={C.textMuted}
          editable={!readOnly}
          {...extra}
        />
        {rightIcon}
      </View>
      {!!note && (
        <View style={fStyles.noteRow}>
          <Ionicons name="alert-circle-outline" size={11} color={C.warning} />
          <Text style={fStyles.note}>{note}</Text>
        </View>
      )}
    </View>
  );
}
const fStyles = StyleSheet.create({
  wrap: { marginBottom: SPACING.sm },
  label: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: C.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.inputBgAlt, borderRadius: RADIUS.md, borderWidth: 1,
    borderColor: C.border, paddingHorizontal: SPACING.md, height: 50,
  },
  readOnly: { backgroundColor: 'rgba(10,15,30,0.6)', opacity: 0.6 },
  input: { flex: 1, color: C.textPrimary, fontSize: FONT_SIZES.base },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  note: { flex: 1, fontSize: FONT_SIZES.xs, color: C.textMuted },
});

// ─── Toast ───────────────────────────────────────────────────────────────────
function Toast({ msg, type }) {
  const styles = useStyles(getStyles);
  if (!msg) return null;
  const bg = type === 'success' ? C.success : C.error;
  return (
    <View style={[toastStyles.box, { backgroundColor: bg }]}>
      <Ionicons name={type === 'success' ? 'checkmark-circle' : 'alert-circle'} size={16} color={C.white} />
      <Text style={toastStyles.text}>{msg}</Text>
    </View>
  );
}
const toastStyles = StyleSheet.create({
  box: { position: 'absolute', top: 60, left: SPACING.lg, right: SPACING.lg, zIndex: 99, flexDirection: 'row', alignItems: 'center', gap: 8, padding: SPACING.md, borderRadius: RADIUS.md, ...SHADOWS.lg },
  text: { flex: 1, color: C.white, fontSize: FONT_SIZES.sm, fontWeight: '600' },
});

export default function DoctorProfileScreen() {
  const styles = useStyles(getStyles);
  const { updateUser, clearUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('profile'); // 'profile' | 'availability'
  const [toast, setToast] = useState(null);
  const [phoneError, setPhoneError] = useState('');
  const [slotErrors, setSlotErrors] = useState({});
  const [slotInputs, setSlotInputs] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    firstName: '', lastName: '', specialization: '',
    consultationFee: '', phone: '',
    profileDetails: { bio: '', qualifications: '', experienceYears: '', contactNumber: '' },
    availability: [],
  });

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    api.get('/doctors/profile')
      .then(({ data }) => {
        setForm({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          specialization: data.specialization || '',
          consultationFee: String(data.consultationFee || ''),
          phone: data.phone || '',
          profileDetails: {
            bio: data.profileDetails?.bio || '',
            qualifications: (data.profileDetails?.qualifications || []).join(', '),
            experienceYears: String(data.profileDetails?.experienceYears || ''),
            contactNumber: data.profileDetails?.contactNumber || '',
          },
          availability: data.availability || [],
        });
        const inputs = {};
        (data.availability || []).forEach(a => { inputs[a.day] = String(a.maxSlots ?? MAX_SLOTS_PER_DAY); });
        setSlotInputs(inputs);
      })
      .catch(() => showToast('Failed to load profile.', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const setF = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const setDetail = (key, val) => setForm(f => ({ ...f, profileDetails: { ...f.profileDetails, [key]: val } }));

  // ── Profile save ──────────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!form.firstName.trim()) { showToast('First name is required', 'error'); return; }
    if (!form.lastName.trim()) { showToast('Last name is required', 'error'); return; }
    
    if (form.consultationFee && isNaN(Number(form.consultationFee))) { showToast('Consultation fee must be a valid number', 'error'); return; }
    if (form.consultationFee && Number(form.consultationFee) < 0) { showToast('Consultation fee cannot be negative', 'error'); return; }
    
    if (form.profileDetails.experienceYears && isNaN(Number(form.profileDetails.experienceYears))) { showToast('Experience years must be a valid number', 'error'); return; }
    if (form.profileDetails.experienceYears && Number(form.profileDetails.experienceYears) < 0) { showToast('Experience years cannot be negative', 'error'); return; }
    if (form.profileDetails.experienceYears && Number(form.profileDetails.experienceYears) > 100) { showToast('Experience years is unrealistic', 'error'); return; }

    if (form.phone && !PHONE_REGEX.test(form.phone.trim())) {
      setPhoneError('Enter a valid number: 07XXXXXXXX or +94XXXXXXXXX');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        consultationFee: Number(form.consultationFee),
        phone: form.phone.trim(),
        profileDetails: {
          ...form.profileDetails,
          experienceYears: Number(form.profileDetails.experienceYears),
          qualifications: form.profileDetails.qualifications.split(',').map(q => q.trim()).filter(Boolean),
        },
      };
      const { data } = await api.put('/doctors/profile', payload);
      updateUser({ firstName: data.firstName, lastName: data.lastName });
      setPhoneError('');
      showToast('Profile updated successfully!');
    } catch {
      showToast('Failed to update profile.', 'error');
    } finally { setSaving(false); }
  };

  // ── Availability ──────────────────────────────────────────────────────────
  const toggleDay = (day) => {
    setForm(f => {
      const exists = f.availability.find(a => a.day === day);
      if (exists) {
        setSlotErrors(prev => { const n = { ...prev }; delete n[day]; return n; });
        setSlotInputs(prev => { const n = { ...prev }; delete n[day]; return n; });
        return { ...f, availability: f.availability.filter(a => a.day !== day) };
      }
      setSlotInputs(prev => ({ ...prev, [day]: String(MAX_SLOTS_PER_DAY) }));
      return { ...f, availability: [...f.availability, { day, startTime: '09:00', endTime: '17:00', maxSlots: MAX_SLOTS_PER_DAY }] };
    });
  };

  const updateSlot = (day, field, value) => {
    setForm(f => {
      const updated = f.availability.map(a => a.day === day ? { ...a, [field]: value } : a);
      const slot = updated.find(a => a.day === day);
      if (slot && (field === 'startTime' || field === 'endTime')) {
        const dur = slotDurationHours(slot.startTime, slot.endTime);
        if (dur <= 0) setSlotErrors(prev => ({ ...prev, [day]: 'End time must be after start time.' }));
        else if (dur > MAX_SLOT_HOURS) setSlotErrors(prev => ({ ...prev, [day]: `Max ${MAX_SLOT_HOURS} hours per day.` }));
        else setSlotErrors(prev => { const n = { ...prev }; delete n[day]; return n; });
      }
      return { ...f, availability: updated };
    });
  };

  const stepSlots = (day, delta) => {
    const cur = parseInt(slotInputs[day], 10);
    const next = Math.max(1, Math.min(MAX_SLOTS_PER_DAY, (isNaN(cur) ? MAX_SLOTS_PER_DAY : cur) + delta));
    setSlotInputs(prev => ({ ...prev, [day]: String(next) }));
    setForm(f => ({ ...f, availability: f.availability.map(a => a.day === day ? { ...a, maxSlots: next } : a) }));
  };

  const handleSaveAvailability = async () => {
    const newErrors = {};
    form.availability.forEach(slot => {
      const dur = slotDurationHours(slot.startTime, slot.endTime);
      if (dur <= 0) newErrors[slot.day] = 'End time must be after start time.';
      else if (dur > MAX_SLOT_HOURS) newErrors[slot.day] = `Max ${MAX_SLOT_HOURS} hours per day.`;
      if (!slot.maxSlots || slot.maxSlots < 1 || slot.maxSlots > MAX_SLOTS_PER_DAY)
        newErrors[slot.day] = (newErrors[slot.day] ? newErrors[slot.day] + ' ' : '') + `Max slots must be 1–${MAX_SLOTS_PER_DAY}.`;
    });
    setSlotErrors(newErrors);
    if (Object.keys(newErrors).length > 0) { showToast('Fix slot errors before saving.', 'error'); return; }
    setSaving(true);
    try {
      await api.put('/doctors/availability', { availability: form.availability });
      showToast('Availability saved!');
    } catch { showToast('Failed to save availability.', 'error'); }
    finally { setSaving(false); }
  };

  // ── Delete profile ────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (deleteText !== 'DELETE') return;
    setDeleting(true);
    try {
      await api.delete('/doctors/profile');
      await clearUser();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete profile.', 'error');
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator color={C.doctorPrimary} size="large" />
    </View>
  );

  const phoneValid = !!form.phone.trim() && PHONE_REGEX.test(form.phone.trim());

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Settings</Text>
        <Text style={styles.pageSubtitle}>Profile & availability</Text>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {[{ key: 'profile', label: 'Profile', icon: 'person-outline' }, { key: 'availability', label: 'Schedule', icon: 'calendar-outline' }].map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}
            activeOpacity={0.8}
          >
            <Ionicons name={t.icon} size={16} color={tab === t.key ? C.doctorPrimary : C.textMuted} />
            <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* ── PROFILE TAB ─────────────────────────────────────────────────── */}
        {tab === 'profile' && (
          <View style={styles.section}>
            {/* Personal Info */}
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: `${C.primary}20` }]}>
                <Ionicons name="person" size={18} color={C.primary} />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Personal Information</Text>
                <Text style={styles.sectionSubtitle}>Basic details patients see</Text>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.twoCol}>
                <View style={{ flex: 1 }}>
                  <Field label="First Name" value={form.firstName} onChange={(v) => setF('firstName', v)} placeholder="First name" />
                </View>
                <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                  <Field label="Last Name" value={form.lastName} onChange={(v) => setF('lastName', v)} placeholder="Last name" />
                </View>
              </View>

              <Field
                label="Specialization"
                value={form.specialization}
                readOnly
                note="Managed by administrator. Contact admin to change."
              />

              <Field
                label="Consultation Fee (Rs.)"
                value={form.consultationFee}
                onChange={(v) => setF('consultationFee', v)}
                placeholder="e.g. 1500"
                extra={{ keyboardType: 'numeric' }}
              />

              <View style={fStyles.wrap}>
                <Text style={fStyles.label}>Phone Number</Text>
                <View style={[fStyles.row, phoneError && { borderColor: C.error }]}>
                  <TextInput
                    style={fStyles.input}
                    value={form.phone}
                    onChangeText={(v) => {
                      setF('phone', v);
                      if (v && !PHONE_REGEX.test(v.trim())) setPhoneError('Format: 07XXXXXXXX or +94XXXXXXXXX');
                      else setPhoneError('');
                    }}
                    placeholder="07XXXXXXXX or +94XXXXXXXXX"
                    placeholderTextColor={C.textMuted}
                    keyboardType="phone-pad"
                  />
                  {form.phone.trim() && (
                    <Ionicons
                      name={phoneValid ? 'checkmark-circle' : 'alert-circle'}
                      size={18}
                      color={phoneValid ? C.success : C.error}
                    />
                  )}
                </View>
                {phoneError ? <Text style={{ fontSize: 11, color: C.error, marginTop: 3 }}>{phoneError}</Text> : null}
              </View>

              <Field
                label="Years of Experience"
                value={form.profileDetails.experienceYears}
                onChange={(v) => setDetail('experienceYears', v)}
                placeholder="e.g. 10"
                extra={{ keyboardType: 'numeric' }}
              />
            </View>

            {/* Professional Details */}
            <View style={[styles.sectionHeader, { marginTop: SPACING.md }]}>
              <View style={[styles.sectionIcon, { backgroundColor: `${C.doctorPrimary}20` }]}>
                <Ionicons name="book-outline" size={18} color={C.doctorPrimary} />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Professional Details</Text>
                <Text style={styles.sectionSubtitle}>Your background & qualifications</Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={fStyles.label}>Biography</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Write a short professional bio..."
                placeholderTextColor={C.textMuted}
                value={form.profileDetails.bio}
                onChangeText={(v) => setDetail('bio', v)}
                multiline numberOfLines={4} textAlignVertical="top"
              />

              <Text style={[fStyles.label, { marginTop: SPACING.sm }]}>Qualifications (comma-separated)</Text>
              <TextInput
                style={styles.textArea}
                placeholder="MBBS, MD Cardiology, ..."
                placeholderTextColor={C.textMuted}
                value={form.profileDetails.qualifications}
                onChangeText={(v) => setDetail('qualifications', v)}
                multiline numberOfLines={2} textAlignVertical="top"
              />
            </View>

            {/* Save Profile */}
            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.65 }]}
              onPress={handleSaveProfile} disabled={saving} activeOpacity={0.85}
            >
              {saving ? <ActivityIndicator color={C.white} /> : (
                <>
                  <Ionicons name="save-outline" size={18} color={C.white} style={{ marginRight: 8 }} />
                  <Text style={styles.saveBtnText}>Save Profile</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Danger Zone */}
            <View style={styles.dangerCard}>
              <View style={styles.dangerHeader}>
                <Ionicons name="warning" size={18} color={C.error} />
                <Text style={styles.dangerTitle}>Danger Zone</Text>
              </View>
              <Text style={styles.dangerText}>
                Permanently delete your doctor account. Open appointments will be cancelled.{' '}
                <Text style={{ color: C.error, fontWeight: '700' }}>This cannot be undone.</Text>
              </Text>
              <TouchableOpacity style={styles.deleteAccBtn} onPress={() => { setShowDeleteConfirm(true); setDeleteText(''); }}>
                <Ionicons name="trash-outline" size={15} color={C.error} />
                <Text style={styles.deleteAccBtnText}>Delete My Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── AVAILABILITY TAB ─────────────────────────────────────────────── */}
        {tab === 'availability' && (
          <View style={styles.section}>
            <View style={styles.card}>
              <Text style={styles.availTitle}>Weekly Schedule</Text>
              <Text style={styles.availSubtitle}>Set your working hours and booking capacity for each day.</Text>

              {DAYS.map(day => {
                const slot = form.availability.find(a => a.day === day);
                const active = !!slot;
                const dur = active ? slotDurationHours(slot.startTime, slot.endTime) : 0;
                return (
                  <View key={day} style={[styles.dayCard, active && styles.dayCardActive]}>
                    {/* Toggle row */}
                    <View style={styles.dayToggleRow}>
                      <View style={styles.dayToggleSide}>
                        <Switch
                          value={active}
                          onValueChange={() => toggleDay(day)}
                          trackColor={{ false: C.border, true: `${C.doctorPrimary}55` }}
                          thumbColor={active ? C.doctorPrimary : C.textMuted}
                          ios_backgroundColor={C.border}
                        />
                        <Text style={[styles.dayName, active && { color: C.textPrimary }]}>
                          {day.charAt(0) + day.slice(1).toLowerCase()}
                        </Text>
                      </View>
                      {active && (
                        <View style={styles.activeBadge}>
                          <Text style={styles.activeBadgeText}>Active</Text>
                        </View>
                      )}
                    </View>

                    {/* Slot config (only when active) */}
                    {active && (
                      <View style={styles.slotConfig}>
                        {/* Start / End time row */}
                        <View style={styles.twoCol}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.slotLabel}>Start Time</Text>
                            <TextInput
                              style={[styles.timeInput, slotErrors[day] && { borderColor: C.error }]}
                              value={slot.startTime}
                              onChangeText={(v) => updateSlot(day, 'startTime', v)}
                              placeholder="09:00"
                              placeholderTextColor={C.textMuted}
                            />
                          </View>
                          <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                            <Text style={styles.slotLabel}>End Time</Text>
                            <TextInput
                              style={[styles.timeInput, slotErrors[day] && { borderColor: C.error }]}
                              value={slot.endTime}
                              onChangeText={(v) => updateSlot(day, 'endTime', v)}
                              placeholder="17:00"
                              placeholderTextColor={C.textMuted}
                            />
                          </View>
                        </View>

                        {slotErrors[day] ? (
                          <Text style={styles.slotError}>{slotErrors[day]}</Text>
                        ) : (
                          <Text style={styles.slotDuration}>
                            <Ionicons name="checkmark-circle" size={11} color={C.success} /> {' '}
                            Duration: {dur.toFixed(1)}h / max {MAX_SLOT_HOURS}h
                          </Text>
                        )}

                        {/* Max slots stepper */}
                        <Text style={[styles.slotLabel, { marginTop: SPACING.sm }]}>Max Slots / Day</Text>
                        <View style={styles.stepperRow}>
                          <TouchableOpacity
                            style={[styles.stepperBtn, slot.maxSlots <= 1 && { opacity: 0.3 }]}
                            onPress={() => stepSlots(day, -1)}
                            disabled={slot.maxSlots <= 1}
                          >
                            <Text style={styles.stepperBtnText}>−</Text>
                          </TouchableOpacity>
                          <TextInput
                            style={styles.stepperInput}
                            value={slotInputs[day] ?? String(slot.maxSlots)}
                            onChangeText={(v) => {
                              setSlotInputs(prev => ({ ...prev, [day]: v }));
                              const n = parseInt(v, 10);
                              if (!isNaN(n)) {
                                const c = Math.max(1, Math.min(MAX_SLOTS_PER_DAY, n));
                                setForm(f => ({ ...f, availability: f.availability.map(a => a.day === day ? { ...a, maxSlots: c } : a) }));
                              }
                            }}
                            keyboardType="numeric"
                            textAlign="center"
                          />
                          <TouchableOpacity
                            style={[styles.stepperBtn, slot.maxSlots >= MAX_SLOTS_PER_DAY && { opacity: 0.3 }]}
                            onPress={() => stepSlots(day, 1)}
                            disabled={slot.maxSlots >= MAX_SLOTS_PER_DAY}
                          >
                            <Text style={styles.stepperBtnText}>+</Text>
                          </TouchableOpacity>
                          <Text style={styles.stepperMax}>max {MAX_SLOTS_PER_DAY}</Text>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: C.doctorPrimary, ...SHADOWS.glowGreen }, saving && { opacity: 0.65 }]}
              onPress={handleSaveAvailability} disabled={saving} activeOpacity={0.85}
            >
              {saving ? <ActivityIndicator color={C.white} /> : (
                <>
                  <Ionicons name="save-outline" size={18} color={C.white} style={{ marginRight: 8 }} />
                  <Text style={styles.saveBtnText}>Save Availability</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Delete confirm modal */}
      {showDeleteConfirm && (
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModal}>
            <View style={styles.deleteModalIcon}>
              <Ionicons name="trash" size={28} color={C.error} />
            </View>
            <Text style={styles.deleteModalTitle}>Delete Your Doctor Profile?</Text>
            <Text style={styles.deleteModalText}>
              This will permanently delete your account and remove your access. Open appointments will be cancelled.{' '}
              <Text style={{ fontWeight: '700', color: C.error }}>Cannot be undone.</Text>
            </Text>
            <Text style={styles.deleteModalPrompt}>
              Type <Text style={{ fontFamily: 'monospace', color: C.error, fontWeight: '700' }}>DELETE</Text> to confirm:
            </Text>
            <TextInput
              style={styles.deleteModalInput}
              value={deleteText}
              onChangeText={setDeleteText}
              placeholder="Type DELETE here"
              placeholderTextColor={C.textMuted}
              autoCapitalize="characters"
            />
            <View style={styles.deleteModalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowDeleteConfirm(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmDeleteBtn, (deleteText !== 'DELETE' || deleting) && { opacity: 0.4 }]}
                onPress={handleDelete}
                disabled={deleteText !== 'DELETE' || deleting}
              >
                {deleting ? <ActivityIndicator color={C.white} size="small" /> : (
                  <Text style={styles.confirmDeleteBtnText}>Delete Profile</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const getStyles = (C, isDark) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.md,
    backgroundColor: C.headerBg, borderBottomWidth: 1, borderBottomColor: C.headerBorder,
  },
  pageTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: C.textPrimary },
  pageSubtitle: { fontSize: FONT_SIZES.xs, color: C.textSecondary, marginTop: 2 },

  tabBar: { flexDirection: 'row', backgroundColor: isDark ? 'rgba(26,34,53,0.5)' : C.border, margin: SPACING.lg, borderRadius: RADIUS.lg, padding: 4, gap: 4 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: RADIUS.md },
  tabActive: { backgroundColor: C.inputBgAlt, borderWidth: 1, borderColor: C.cardInnerBorder },
  tabLabel: { fontSize: FONT_SIZES.sm, color: C.textMuted, fontWeight: '600' },
  tabLabelActive: { color: C.doctorPrimary, fontWeight: '800' },

  section: { paddingHorizontal: SPACING.lg, paddingBottom: 100 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  sectionIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: FONT_SIZES.base, fontWeight: '800', color: C.textPrimary },
  sectionSubtitle: { fontSize: FONT_SIZES.xs, color: C.textSecondary },

  card: {
    backgroundColor: C.cardBgTranslucent, borderRadius: RADIUS.xl, padding: SPACING.lg,
    borderWidth: 1, borderColor: C.cardInnerBorder2, marginBottom: SPACING.md,
    borderTopWidth: 3, borderTopColor: C.doctorPrimary,
  },
  twoCol: { flexDirection: 'row', gap: SPACING.sm },
  textArea: {
    backgroundColor: C.inputBgAlt, borderWidth: 1, borderColor: C.border,
    borderRadius: RADIUS.md, padding: SPACING.md, color: C.textPrimary,
    fontSize: FONT_SIZES.base, minHeight: 80, textAlignVertical: 'top', marginBottom: 2,
  },

  saveBtn: {
    backgroundColor: C.primary, borderRadius: RADIUS.md, height: 54,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    marginBottom: SPACING.md, ...SHADOWS.glowBlue,
  },
  saveBtnText: { color: C.white, fontSize: FONT_SIZES.base, fontWeight: '800' },

  dangerCard: {
    borderRadius: RADIUS.xl, padding: SPACING.lg, borderWidth: 1,
    borderColor: `${C.error}33`, backgroundColor: `${C.error}08`, marginBottom: SPACING.md,
  },
  dangerHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  dangerTitle: { fontSize: FONT_SIZES.base, fontWeight: '800', color: C.error },
  dangerText: { fontSize: FONT_SIZES.sm, color: C.textSecondary, lineHeight: 20, marginBottom: SPACING.md },
  deleteAccBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: RADIUS.md, backgroundColor: `${C.error}15`, borderWidth: 1, borderColor: `${C.error}33` },
  deleteAccBtnText: { fontSize: FONT_SIZES.sm, color: C.error, fontWeight: '700' },

  // Availability
  availTitle: { fontSize: FONT_SIZES.lg, fontWeight: '800', color: C.textPrimary, marginBottom: 4 },
  availSubtitle: { fontSize: FONT_SIZES.sm, color: C.textSecondary, marginBottom: SPACING.md },
  dayCard: { borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: C.cardInnerBorder, backgroundColor: isDark ? 'rgba(26,34,53,0.4)' : C.bgElevated },
  dayCardActive: { borderColor: `${C.doctorPrimary}44`, backgroundColor: `${C.doctorPrimary}08` },
  dayToggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayToggleSide: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  dayName: { fontSize: FONT_SIZES.base, fontWeight: '700', color: C.textMuted },
  activeBadge: { backgroundColor: `${C.doctorPrimary}20`, paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
  activeBadgeText: { fontSize: 10, fontWeight: '800', color: C.doctorPrimary },
  slotConfig: { marginTop: SPACING.md, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: C.cardInnerBorder },
  slotLabel: { fontSize: 11, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  timeInput: {
    backgroundColor: C.inputBgAlt, borderWidth: 1, borderColor: C.border,
    borderRadius: RADIUS.sm, height: 44, paddingHorizontal: SPACING.sm,
    color: C.textPrimary, fontSize: FONT_SIZES.base, fontWeight: '600', textAlign: 'center',
  },
  slotError: { fontSize: 11, color: C.error, marginTop: 4 },
  slotDuration: { fontSize: 11, color: C.success, marginTop: 4 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  stepperBtn: { width: 38, height: 38, borderRadius: RADIUS.sm, backgroundColor: C.bgElevated, borderWidth: 1, borderColor: C.border, justifyContent: 'center', alignItems: 'center' },
  stepperBtnText: { fontSize: 20, color: C.textPrimary, fontWeight: '700', lineHeight: 24 },
  stepperInput: { flex: 1, height: 38, backgroundColor: C.inputBgAlt, borderWidth: 1, borderColor: C.border, borderRadius: RADIUS.sm, color: C.textPrimary, fontSize: FONT_SIZES.base, fontWeight: '700' },
  stepperMax: { fontSize: 11, color: C.textMuted },

  // Delete modal
  modalOverlay: { position: 'absolute', inset: 0, top: 0, bottom: 0, left: 0, right: 0, backgroundColor: C.overlay, justifyContent: 'center', alignItems: 'center', padding: SPACING.lg, zIndex: 999 },
  deleteModal: { backgroundColor: C.modalBg, borderRadius: RADIUS.xl, padding: SPACING.xl, width: '100%', borderWidth: 1, borderColor: C.cardInnerBorder },
  deleteModalIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: `${C.error}15`, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: SPACING.md },
  deleteModalTitle: { fontSize: FONT_SIZES.lg, fontWeight: '800', color: C.textPrimary, textAlign: 'center', marginBottom: SPACING.sm },
  deleteModalText: { fontSize: FONT_SIZES.sm, color: C.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: SPACING.md },
  deleteModalPrompt: { fontSize: FONT_SIZES.xs, color: C.textSecondary, marginBottom: SPACING.sm },
  deleteModalInput: { backgroundColor: C.inputBgAlt, borderWidth: 1, borderColor: C.border, borderRadius: RADIUS.md, height: 48, paddingHorizontal: SPACING.md, color: C.textPrimary, fontSize: FONT_SIZES.base, marginBottom: SPACING.md },
  deleteModalActions: { flexDirection: 'row', gap: SPACING.sm },
  cancelBtn: { flex: 1, height: 48, borderRadius: RADIUS.md, borderWidth: 1, borderColor: C.border, justifyContent: 'center', alignItems: 'center' },
  cancelBtnText: { fontSize: FONT_SIZES.base, color: C.textSecondary, fontWeight: '600' },
  confirmDeleteBtn: { flex: 1, height: 48, borderRadius: RADIUS.md, backgroundColor: C.error, justifyContent: 'center', alignItems: 'center' },
  confirmDeleteBtnText: { fontSize: FONT_SIZES.base, color: C.white, fontWeight: '800' },
});
