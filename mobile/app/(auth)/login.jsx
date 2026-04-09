// app/(auth)/login.jsx
// Premium Login Screen

import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { setUser } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const btnScale = useRef(new Animated.Value(1)).current;

  const animatePress = () => {
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(btnScale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
  };

  const validate = () => {
    const newErrors = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(email)) newErrors.email = 'Invalid email format';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    animatePress();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email: email.trim().toLowerCase(), password });
      const data = res.data;
      const rawRole = (data.role || data.user?.role || '').toLowerCase();
      const user = {
        _id: data._id || data.user?._id,
        name: data.name || data.user?.name || data.firstName ? `${data.firstName} ${data.lastName}`.trim() : '',
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || data.user?.email,
        role: rawRole,
        token: data.token,
        profileImage: data.profileImage,
        doctorId: data.doctorId,
        approvalStatus: data.approvalStatus,
      };
      await setUser(user);
      if (rawRole === 'patient') router.replace('/(patient)/home');
      else if (rawRole === 'doctor') router.replace('/(doctor)/home');
      else if (rawRole === 'admin') router.replace('/(admin)/home');
      else {
        setErrors({ server: `Unknown role: ${rawRole}. Please contact support.` });
      }
    } catch (error) {
      const msg = error.response?.data?.message ?? 'Login failed. Please try again.';
      setErrors({ server: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.logoOuter}>
            <View style={styles.logoInner}>
              <Text style={styles.logoEmoji}>🏥</Text>
            </View>
          </View>
          <Text style={styles.appName}>AI E-Channeling</Text>
          <Text style={styles.tagline}>Your health, intelligently managed</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome back</Text>
          <Text style={styles.cardSubtitle}>Sign in to continue</Text>

          {/* Server Error */}
          {errors.server && (
            <View style={styles.serverError}>
              <Ionicons name="alert-circle" size={16} color={COLORS.error} />
              <Text style={styles.serverErrorText}>{errors.server}</Text>
            </View>
          )}

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={[styles.inputRow, errors.email && styles.inputError]}>
              <Ionicons name="mail-outline" size={18} color={errors.email ? COLORS.error : COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="doctor@hospital.com"
                placeholderTextColor={COLORS.textMuted}
                value={email}
                onChangeText={(t) => { setEmail(t); setErrors((e) => ({ ...e, email: undefined, server: undefined })); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
              {email.length > 0 && !errors.email && /^\S+@\S+\.\S+$/.test(email) && (
                <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
              )}
            </View>
            {errors.email && <Text style={styles.errorText}><Ionicons name="alert-circle-outline" size={11} /> {errors.email}</Text>}
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={[styles.inputRow, errors.password && styles.inputError]}>
              <Ionicons name="lock-closed-outline" size={18} color={errors.password ? COLORS.error : COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={COLORS.textMuted}
                value={password}
                onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: undefined, server: undefined })); }}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.errorText}><Ionicons name="alert-circle-outline" size={11} /> {errors.password}</Text>}
          </View>

          {/* Login Button */}
          <Animated.View style={{ transform: [{ scale: btnScale }], marginTop: SPACING.md }}>
            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Text style={styles.loginBtnText}>Sign In</Text>
                  <Ionicons name="arrow-forward" size={18} color={COLORS.white} style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Register */}
          <View style={styles.registerRow}>
            <Text style={styles.registerText}>New patient? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.registerLink}>Create an account</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Info hint */}
        <View style={styles.hintBox}>
          <Ionicons name="information-circle-outline" size={14} color={COLORS.textMuted} />
          <Text style={styles.hintText}>  Doctors & Admins are registered by system administrators.</Text>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  container: { flexGrow: 1, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
  hero: { alignItems: 'center', paddingTop: 80, paddingBottom: SPACING.xl },
  logoOuter: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(78, 154, 241, 0.12)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1, borderColor: 'rgba(78, 154, 241, 0.25)',
    ...SHADOWS.glowBlue,
  },
  logoInner: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: 'rgba(78, 154, 241, 0.2)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(78, 154, 241, 0.4)',
  },
  logoEmoji: { fontSize: 36 },
  appName: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.5 },
  tagline: { fontSize: FONT_SIZES.sm, color: COLORS.textMuted, marginTop: 4 },
  card: {
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    borderRadius: RADIUS.xl, padding: SPACING.lg,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    ...SHADOWS.lg,
  },
  cardTitle: { fontSize: FONT_SIZES.lg, fontWeight: '800', color: COLORS.textPrimary },
  cardSubtitle: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2, marginBottom: SPACING.md },
  serverError: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: `${COLORS.error}15`, borderWidth: 1, borderColor: `${COLORS.error}33`,
    borderRadius: RADIUS.md, padding: SPACING.sm, marginBottom: SPACING.md,
  },
  serverErrorText: { color: COLORS.error, fontSize: FONT_SIZES.sm, flex: 1 },
  fieldGroup: { marginBottom: SPACING.sm },
  label: {
    fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.textSecondary,
    marginBottom: SPACING.sm, textTransform: 'uppercase', letterSpacing: 0.8,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(26, 34, 53, 0.8)',
    borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md, height: 54,
  },
  inputError: { borderColor: COLORS.error, backgroundColor: `${COLORS.error}08` },
  inputIcon: { marginRight: SPACING.sm },
  input: { flex: 1, color: COLORS.textPrimary, fontSize: FONT_SIZES.base },
  eyeBtn: { padding: SPACING.xs },
  errorText: { color: COLORS.error, fontSize: FONT_SIZES.xs, marginTop: 4, marginLeft: 2 },
  loginBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md, height: 54,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    ...SHADOWS.glowBlue,
  },
  loginBtnDisabled: { opacity: 0.65 },
  loginBtnText: { color: COLORS.white, fontSize: FONT_SIZES.base, fontWeight: '800', letterSpacing: 0.3 },
  registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.md },
  registerText: { color: COLORS.textSecondary, fontSize: FONT_SIZES.sm },
  registerLink: { color: COLORS.primary, fontSize: FONT_SIZES.sm, fontWeight: '700' },
  hintBox: {
    flexDirection: 'row', alignItems: 'flex-start',
    marginTop: SPACING.lg, backgroundColor: 'rgba(26, 34, 53, 0.6)',
    padding: SPACING.md, borderRadius: RADIUS.md,
    borderLeftWidth: 2, borderLeftColor: COLORS.border,
  },
  hintText: { flex: 1, color: COLORS.textMuted, fontSize: FONT_SIZES.xs, lineHeight: 18 },
});
