// app/(auth)/register.jsx
// Patient + Doctor Registration Screen (with role toggle)

import { useState } from 'react';
import useStyles from '../../hooks/useStyles';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { COLORS as C, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

// ─── Password Strength Helper ────────────────────────────────────────────────
const getPasswordStrength = (password) => {
  if (!password) return null;
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { label: 'Weak', color: '#EF4444', width: '25%' };
  if (score <= 3) return { label: 'Medium', color: '#F59E0B', width: '60%' };
  return { label: 'Strong', color: '#10B981', width: '100%' };
};

const SPECIALIZATIONS = [
  'General Physician', 'Cardiologist', 'Neurologist', 'Dermatologist',
  'Orthopedic', 'Pediatrician', 'Gynecologist', 'Psychiatrist',
  'Ophthalmologist', 'ENT Specialist', 'Oncologist', 'Urologist',
  'Endocrinologist', 'Gastroenterologist', 'Pulmonologist',
];

export default function RegisterScreen() {
  const styles = useStyles(getStyles);
  const router = useRouter();
  const [role, setRole] = useState('patient'); // 'patient' | 'doctor'

  // ─── Shared fields ──────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
    nic: '', phone: '',
    // Patient-only
    gender: '', dob: '',
    // Doctor-only
    slmcNumber: '', specialization: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showSpecPicker, setShowSpecPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const setField = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  // ─── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'First name is required';
    else if (form.firstName.trim().length < 2) e.firstName = 'First name must be at least 2 characters';
    else if (!/^[a-zA-Z\s]*$/.test(form.firstName.trim())) e.firstName = 'First name can only contain letters';

    if (!form.lastName.trim()) e.lastName = 'Last name is required';
    else if (form.lastName.trim().length < 2) e.lastName = 'Last name must be at least 2 characters';
    else if (!/^[a-zA-Z\s]*$/.test(form.lastName.trim())) e.lastName = 'Last name can only contain letters';

    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Invalid email format';

    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Min 6 characters';
    else if (!/\d/.test(form.password)) e.password = 'Must contain at least 1 number';
    else if (!/[a-zA-Z]/.test(form.password)) e.password = 'Must contain at least 1 letter';

    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';

    if (!form.nic.trim()) e.nic = 'NIC is required';
    else if (!/^(\d{9}[VvXx]|\d{12})$/.test(form.nic.trim())) e.nic = 'Invalid NIC (e.g. 123456789V or 200012345678)';

    if (!form.phone.trim()) e.phone = 'Phone number is required';
    else if (!/^(07\d{8}|\+94\d{9})$/.test(form.phone.trim())) e.phone = 'Invalid SL phone (e.g. 07XXXXXXXX or +94XXXXXXXXX)';

    if (!form.gender) e.gender = 'Gender is required';
    if (role === 'patient') {
      if (form.dob) {
        const d = new Date(form.dob);
        if (isNaN(d.getTime())) e.dob = 'Invalid date (use YYYY-MM-DD)';
        else if (d >= new Date()) e.dob = 'Date of birth must be in the past';
      } else {
        e.dob = 'Date of birth is required';
      }
    }

    if (role === 'doctor') {
      if (!form.slmcNumber.trim()) e.slmcNumber = 'SLMC number is required';
      else if (!/^[0-9A-Za-z]{4,10}$/.test(form.slmcNumber.trim())) e.slmcNumber = 'Invalid SLMC number (4-10 alphanumeric characters)';

      if (!form.specialization) e.specialization = 'Specialization is required';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ─── Submit ──────────────────────────────────────────────────────────────────
  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      if (role === 'patient') {
        await api.post('/auth/patient/register', {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          nic: form.nic.trim(),
          phone: form.phone.trim(),
          gender: form.gender,
          dateOfBirth: form.dob || undefined,
        });
        Alert.alert(
          '✅ Account Created',
          'Your patient account has been created. You can now log in.',
          [{ text: 'Log In', onPress: () => router.replace('/(auth)/login') }]
        );
      } else {
        await api.post('/auth/doctor/register', {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          nic: form.nic.trim(),
          phone: form.phone.trim(),
          gender: form.gender,
          slmcNumber: form.slmcNumber.trim(),
          specialization: form.specialization,
        });
        Alert.alert(
          '✅ Doctor Account Submitted',
          'Your registration is pending admin approval. You will be able to log in once approved.',
          [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
        );
      }
    } catch (error) {
      const msg = error.response?.data?.message ?? 'Registration failed. Please try again.';
      Alert.alert('Registration Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const accentColor = role === 'doctor' ? C.doctorPrimary : C.primary;

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={C.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join Medicare E-Channeling</Text>
          </View>
        </View>

        {/* Role Toggle */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, role === 'patient' && styles.toggleBtnActive]}
            onPress={() => setRole('patient')}
            activeOpacity={0.8}
          >
            <Ionicons name="person" size={16} color={role === 'patient' ? C.white : C.textSecondary} />
            <Text style={[styles.toggleText, role === 'patient' && styles.toggleTextActive]}>Patient</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, role === 'doctor' && styles.toggleBtnDoctor]}
            onPress={() => setRole('doctor')}
            activeOpacity={0.8}
          >
            <Ionicons name="medical" size={16} color={role === 'doctor' ? C.white : C.textSecondary} />
            <Text style={[styles.toggleText, role === 'doctor' && styles.toggleTextActive]}>Doctor</Text>
          </TouchableOpacity>
        </View>

        {role === 'doctor' && (
          <View style={styles.approvalNote}>
            <Ionicons name="information-circle-outline" size={14} color={C.doctorPrimary} />
            <Text style={styles.approvalNoteText}>Doctor accounts require admin approval before login.</Text>
          </View>
        )}

        {/* Form Card */}
        <View style={[styles.card, { borderTopColor: accentColor }]}>

          {/* Name Row */}
          <View style={styles.nameRow}>
            <View style={{ flex: 1 }}>
              <Field icon="person-outline" label="First Name" value={form.firstName}
                onChange={(v) => setField('firstName', v)} error={errors.firstName}
                extra={{ autoCapitalize: 'words' }} />
            </View>
            <View style={{ flex: 1 }}>
              <Field icon="person-outline" label="Last Name" value={form.lastName}
                onChange={(v) => setField('lastName', v)} error={errors.lastName}
                extra={{ autoCapitalize: 'words' }} />
            </View>
          </View>

          <Field icon="mail-outline" label="Email Address" value={form.email}
            onChange={(v) => setField('email', v)} error={errors.email}
            extra={{ keyboardType: 'email-address', autoCapitalize: 'none' }} />

          <Field icon="card-outline" label="NIC Number" value={form.nic}
            onChange={(v) => setField('nic', v)} error={errors.nic}
            extra={{ autoCapitalize: 'characters', placeholder: '123456789V or 200012345678' }} />

          <Field icon="call-outline" label="Phone Number" value={form.phone}
            onChange={(v) => setField('phone', v)} error={errors.phone}
            extra={{ keyboardType: 'phone-pad', placeholder: '07XXXXXXXX' }} />

          {/* ── Shared Demographic Fields ─────────────────────────────── */}
          <Text style={styles.label}>Gender</Text>
          <View style={styles.genderRow}>
            {[{ label: '♂ Male', value: 'male' }, { label: '♀ Female', value: 'female' }, { label: '⚧ Other', value: 'other' }].map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.genderBtn, form.gender === opt.value && styles.genderBtnActive]}
                onPress={() => setField('gender', opt.value)}
              >
                <Text style={[styles.genderBtnText, form.gender === opt.value && { color: accentColor, fontWeight: '700' }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}

          {/* ── Patient-only Fields ─────────────────────────────────────── */}
          {role === 'patient' && (
            <>
              <Field icon="calendar-outline" label="Date of Birth (YYYY-MM-DD)" value={form.dob}
                onChange={(v) => setField('dob', v)} error={errors.dob}
                extra={{ placeholder: '1990-01-15' }} />
            </>
          )}

          {/* ── Doctor-only Fields ──────────────────────────────────────── */}
          {role === 'doctor' && (
            <>
              <Field icon="id-card-outline" label="SLMC Registration Number" value={form.slmcNumber}
                onChange={(v) => setField('slmcNumber', v)} error={errors.slmcNumber}
                extra={{ autoCapitalize: 'characters', placeholder: 'Your SLMC number' }} />

              <Text style={styles.label}>Specialization</Text>
              <TouchableOpacity
                style={[styles.inputRow, errors.specialization && styles.inputError]}
                onPress={() => setShowSpecPicker(!showSpecPicker)}
                activeOpacity={0.8}
              >
                <Ionicons name="briefcase-outline" size={18} color={C.textSecondary} style={styles.inputIcon} />
                <Text style={[styles.pickerText, !form.specialization && { color: C.textMuted }]}>
                  {form.specialization || 'Select specialization...'}
                </Text>
                <Ionicons name={showSpecPicker ? 'chevron-up' : 'chevron-down'} size={16} color={C.textSecondary} />
              </TouchableOpacity>
              {errors.specialization && <Text style={styles.errorText}>{errors.specialization}</Text>}

              {showSpecPicker && (
                <View style={styles.specDropdown}>
                  <ScrollView
                    nestedScrollEnabled={true}
                    style={{ maxHeight: 240 }}
                    showsVerticalScrollIndicator={true}
                    keyboardShouldPersistTaps="handled"
                  >
                    {SPECIALIZATIONS.map((s) => (
                      <TouchableOpacity
                        key={s}
                        style={[styles.specItem, form.specialization === s && styles.specItemActive]}
                        onPress={() => { setField('specialization', s); setShowSpecPicker(false); }}
                      >
                        <Ionicons
                          name={form.specialization === s ? 'checkmark-circle' : 'ellipse-outline'}
                          size={16} color={form.specialization === s ? C.doctorPrimary : C.textMuted}
                          style={{ marginRight: 8 }}
                        />
                        <Text style={[styles.specItemText, form.specialization === s && { color: C.doctorPrimary, fontWeight: '700' }]}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </>
          )}

          {/* ── Password ─────────────────────────────────────────────────── */}
          <Text style={styles.label}>Password</Text>
          <View style={[styles.inputRow, errors.password && styles.inputError]}>
            <Ionicons name="lock-closed-outline" size={18} color={C.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Min 6 chars, letter + number"
              placeholderTextColor={C.textMuted}
              value={form.password}
              onChangeText={(v) => setField('password', v)}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
              <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={18} color={C.textSecondary} />
            </TouchableOpacity>
          </View>
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

          {/* Real-time password strength meter */}
          {form.password.length > 0 && (() => {
            const strength = getPasswordStrength(form.password);
            return (
              <View style={{ marginBottom: SPACING.sm, marginTop: 4 }}>
                <View style={{ height: 4, backgroundColor: C.border, borderRadius: 4, overflow: 'hidden' }}>
                  <View style={{ height: 4, width: strength.width, backgroundColor: strength.color, borderRadius: 4 }} />
                </View>
                <Text style={{ fontSize: FONT_SIZES.xs, color: strength.color, fontWeight: '700', marginTop: 4 }}>
                  {strength.label} Password
                </Text>
              </View>
            );
          })()}

          <Field icon="lock-closed-outline" label="Confirm Password" value={form.confirmPassword}
            onChange={(v) => setField('confirmPassword', v)} error={errors.confirmPassword}
            extra={{ secureTextEntry: true, placeholder: 'Re-enter password' }} />

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: accentColor }, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={C.white} />
              : (
                <>
                  <Ionicons name={role === 'doctor' ? 'medical' : 'person-add'} size={18} color={C.white} style={{ marginRight: 8 }} />
                  <Text style={styles.submitBtnText}>
                    {role === 'doctor' ? 'Submit for Approval' : 'Create Account'}
                  </Text>
                </>
              )
            }
          </TouchableOpacity>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
              <Text style={[styles.loginLink, { color: accentColor }]}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Reusable Field Component ────────────────────────────────────────────────
function Field({ icon, label, value, onChange, error, extra = {} }) {
  const styles = useStyles(getStyles);
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, error && styles.inputError]}>
        <Ionicons name={icon} size={18} color={error ? C.error : C.textSecondary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholderTextColor={C.textMuted}
          value={value}
          onChangeText={onChange}
          {...extra}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </>
  );
}

const getStyles = (C, isDark) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  container: { flexGrow: 1, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.xl, paddingBottom: 60 },
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.lg },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.bgElevated, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: C.textPrimary },
  subtitle: { fontSize: FONT_SIZES.sm, color: C.textSecondary },

  toggleRow: { flexDirection: 'row', backgroundColor: C.bgElevated, borderRadius: RADIUS.lg, padding: 4, marginBottom: SPACING.md },
  toggleBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingVertical: SPACING.sm, borderRadius: RADIUS.md },
  toggleBtnActive: { backgroundColor: C.primary, ...SHADOWS.glowBlue },
  toggleBtnDoctor: { backgroundColor: C.doctorPrimary, ...SHADOWS.glowGreen },
  toggleText: { fontSize: FONT_SIZES.base, color: C.textSecondary, fontWeight: '600' },
  toggleTextActive: { color: C.white, fontWeight: '800' },

  approvalNote: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: `${C.doctorPrimary}15`, borderRadius: RADIUS.md,
    padding: SPACING.sm, marginBottom: SPACING.md,
    borderLeftWidth: 3, borderLeftColor: C.doctorPrimary,
  },
  approvalNoteText: { flex: 1, fontSize: FONT_SIZES.xs, color: C.doctorPrimary, lineHeight: 18 },

  card: {
    backgroundColor: C.cardBgTranslucent, borderRadius: RADIUS.xl,
    padding: SPACING.lg, borderWidth: 1, borderColor: C.cardInnerBorder,
    borderTopWidth: 3, ...SHADOWS.lg,
  },
  nameRow: { flexDirection: 'row', gap: SPACING.sm },
  label: {
    fontSize: FONT_SIZES.xs, fontWeight: '700', color: C.textSecondary,
    marginBottom: SPACING.sm, marginTop: SPACING.sm, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.inputBgAlt,
    borderRadius: RADIUS.md, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: SPACING.md, height: 50, marginBottom: 2,
  },
  inputError: { borderColor: C.error },
  inputIcon: { marginRight: SPACING.sm },
  input: { flex: 1, color: C.textPrimary, fontSize: FONT_SIZES.base },
  pickerText: { flex: 1, color: C.textPrimary, fontSize: FONT_SIZES.base },
  errorText: { color: C.error, fontSize: FONT_SIZES.xs, marginBottom: SPACING.xs, marginTop: 2 },

  genderRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: 2 },
  genderBtn: {
    flex: 1, paddingVertical: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 1,
    borderColor: C.border, backgroundColor: C.inputBgAlt, alignItems: 'center',
  },
  genderBtnActive: { borderColor: C.primary, backgroundColor: `${C.primary}22` },
  genderBtnText: { color: C.textSecondary, fontSize: FONT_SIZES.sm },

  specDropdown: {
    backgroundColor: C.bgCard, borderRadius: RADIUS.md, borderWidth: 1,
    borderColor: C.border, marginBottom: SPACING.sm,
  },
  specItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: C.cardInnerBorder,
  },
  specItemActive: { backgroundColor: `${C.doctorPrimary}15` },
  specItemText: { color: C.textSecondary, fontSize: FONT_SIZES.sm, flex: 1 },

  submitBtn: {
    borderRadius: RADIUS.md, height: 54, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', marginTop: SPACING.lg,
  },
  btnDisabled: { opacity: 0.65 },
  submitBtnText: { color: C.white, fontSize: FONT_SIZES.base, fontWeight: '800', letterSpacing: 0.3 },

  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.md },
  loginText: { color: C.textSecondary, fontSize: FONT_SIZES.sm },
  loginLink: { fontSize: FONT_SIZES.sm, fontWeight: '700' },
});
