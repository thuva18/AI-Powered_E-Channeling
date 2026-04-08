// app/(auth)/register.tsx
// Member 1 – Authentication Module
// Patient registration screen

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  nic: string;
  phone: string;
  gender: 'male' | 'female' | 'other' | '';
  dob: string;
}

type FormErrors = Partial<Record<keyof FormData, string>>;

export default function RegisterScreen() {
  const router = useRouter();

  const [form, setForm] = useState<FormData>({
    name: '', email: '', password: '', confirmPassword: '',
    nic: '', phone: '', gender: '', dob: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const setField = (field: keyof FormData, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  // ─── Validation ─────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.name.trim()) newErrors.name = 'Full name is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) newErrors.email = 'Invalid email';
    if (!form.password) newErrors.password = 'Password is required';
    else if (form.password.length < 6) newErrors.password = 'Min 6 characters';
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!form.nic.trim()) newErrors.nic = 'NIC is required';
    if (!form.phone.trim()) newErrors.phone = 'Phone is required';
    if (!form.gender) newErrors.gender = 'Gender is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await api.post('/auth/patient/register', {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        nic: form.nic.trim(),
        phone: form.phone.trim(),
        gender: form.gender,
        dob: form.dob || undefined,
      });
      Alert.alert('Registration Successful', 'Your account has been created. Please log in.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (error: any) {
      Alert.alert('Registration Failed', error.response?.data?.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const genderOptions: Array<{ label: string; value: 'male' | 'female' | 'other' }> = [
    { label: '♂ Male', value: 'male' },
    { label: '♀ Female', value: 'female' },
    { label: '⚧ Other', value: 'other' },
  ];

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Register as a new patient</Text>
        </View>

        <View style={styles.card}>
          {/* Full Name */}
          {renderInput('person-outline', 'Full Name', form.name, (v) => setField('name', v), errors.name, { autoCapitalize: 'words' })}
          {/* Email */}
          {renderInput('mail-outline', 'Email Address', form.email, (v) => setField('email', v), errors.email, { keyboardType: 'email-address', autoCapitalize: 'none' })}
          {/* NIC */}
          {renderInput('card-outline', 'NIC Number', form.nic, (v) => setField('nic', v), errors.nic, { autoCapitalize: 'characters' })}
          {/* Phone */}
          {renderInput('call-outline', 'Phone Number', form.phone, (v) => setField('phone', v), errors.phone, { keyboardType: 'phone-pad' })}
          {/* Date of Birth */}
          {renderInput('calendar-outline', 'Date of Birth (YYYY-MM-DD)', form.dob, (v) => setField('dob', v), errors.dob, { placeholder: '1990-01-15' })}

          {/* Gender */}
          <Text style={styles.label}>Gender</Text>
          <View style={styles.genderRow}>
            {genderOptions.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.genderBtn, form.gender === opt.value && styles.genderBtnActive]}
                onPress={() => setField('gender', opt.value)}
              >
                <Text style={[styles.genderBtnText, form.gender === opt.value && styles.genderBtnTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}

          {/* Password */}
          <Text style={[styles.label, { marginTop: SPACING.md }]}>Password</Text>
          <View style={[styles.inputRow, errors.password ? styles.inputError : null]}>
            <Ionicons name="lock-closed-outline" size={18} color={COLORS.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Min 6 characters"
              placeholderTextColor={COLORS.textMuted}
              value={form.password}
              onChangeText={(v) => setField('password', v)}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

          {/* Confirm Password */}
          {renderInput('lock-closed-outline', 'Confirm Password', form.confirmPassword, (v) => setField('confirmPassword', v), errors.confirmPassword, { secureTextEntry: true })}

          {/* Register Btn */}
          <TouchableOpacity
            style={[styles.registerBtn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.registerBtnText}>Create Account</Text>}
          </TouchableOpacity>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function renderInput(
  icon: string,
  label: string,
  value: string,
  onChange: (v: string) => void,
  error?: string,
  extra?: any,
) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, error ? styles.inputError : null]}>
        <Ionicons name={icon as any} size={18} color={COLORS.textSecondary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholderTextColor={COLORS.textMuted}
          value={value}
          onChangeText={onChange}
          {...extra}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  container: { flexGrow: 1, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.xl },
  header: { marginBottom: SPACING.lg },
  backBtn: { marginBottom: SPACING.md },
  title: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.textPrimary },
  subtitle: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 4 },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  label: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgInput,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    height: 50,
    marginBottom: 2,
  },
  inputError: { borderColor: COLORS.error },
  inputIcon: { marginRight: SPACING.sm },
  input: { flex: 1, color: COLORS.textPrimary, fontSize: FONT_SIZES.base },
  errorText: { color: COLORS.error, fontSize: FONT_SIZES.xs, marginBottom: SPACING.xs },
  genderRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: 2 },
  genderBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgInput,
    alignItems: 'center',
  },
  genderBtnActive: { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}22` },
  genderBtnText: { color: COLORS.textSecondary, fontSize: FONT_SIZES.sm },
  genderBtnTextActive: { color: COLORS.primary, fontWeight: '600' },
  registerBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
    ...SHADOWS.lg,
  },
  btnDisabled: { opacity: 0.7 },
  registerBtnText: { color: COLORS.white, fontSize: FONT_SIZES.md, fontWeight: '700' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.md },
  loginText: { color: COLORS.textSecondary, fontSize: FONT_SIZES.sm },
  loginLink: { color: COLORS.primary, fontSize: FONT_SIZES.sm, fontWeight: '600' },
});
