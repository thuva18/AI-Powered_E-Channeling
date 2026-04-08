// app/(patient)/profile.tsx
// Patient profile view & edit

import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

interface Profile {
  name: string;
  email: string;
  phone: string;
  nic: string;
  gender: string;
  dob: string;
  bloodGroup?: string;
  address?: string;
}

export default function PatientProfileScreen() {
  const { user, updateUser, clearUser } = useAuthStore();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Profile>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/patients/profile');
      setProfile(res.data);
      setForm(res.data);
    } catch {
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put('/patients/profile', {
        name: form.name,
        phone: form.phone,
        gender: form.gender,
        dob: form.dob,
        bloodGroup: form.bloodGroup,
        address: form.address,
      });
      setProfile(res.data);
      updateUser({ name: res.data.name });
      setEditing(false);
      Alert.alert('✅ Saved', 'Profile updated successfully');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message ?? 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <ActivityIndicator color={COLORS.primary} style={{ flex: 1, backgroundColor: COLORS.bg }} />;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>My Profile</Text>
        <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(!editing)}>
          <Ionicons name={editing ? 'close' : 'pencil'} size={18} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={{ fontSize: 40 }}>🧑‍⚕️</Text>
          </View>
          <Text style={styles.name}>{profile?.name}</Text>
          <Text style={styles.email}>{profile?.email}</Text>
          <View style={styles.roleBadge}><Text style={styles.roleText}>Patient</Text></View>
        </View>

        {/* Profile Fields */}
        <View style={styles.card}>
          {renderField('Person', 'Full Name', form.name, (v) => setForm((f) => ({ ...f, name: v })), editing, false)}
          {renderField('Mail', 'Email', form.email, () => {}, false, true)}
          {renderField('Card', 'NIC', form.nic, () => {}, false, true)}
          {renderField('Call', 'Phone', form.phone, (v) => setForm((f) => ({ ...f, phone: v })), editing, false, 'phone-pad')}
          {renderField('Calendar', 'Date of Birth', form.dob, (v) => setForm((f) => ({ ...f, dob: v })), editing)}
          {renderField('Water', 'Blood Group', form.bloodGroup, (v) => setForm((f) => ({ ...f, bloodGroup: v })), editing)}
          {renderField('Location', 'Address', form.address, (v) => setForm((f) => ({ ...f, address: v })), editing)}
        </View>

        {editing && (
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.btnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => {
            Alert.alert('Log Out', 'Are you sure?', [
              { text: 'Cancel' },
              { text: 'Log Out', style: 'destructive', onPress: async () => { await clearUser(); } },
            ]);
          }}
        >
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          <Text style={styles.logoutText}>  Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function renderField(
  _icon: string,
  label: string,
  value: string | undefined,
  onChange: (v: string) => void,
  editable: boolean = false,
  readonly: boolean = false,
  keyboardType: any = 'default',
) {
  return (
    <View key={label} style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {readonly || !editable ? (
        <Text style={[styles.fieldValue, readonly && styles.fieldValueLocked]}>
          {value || '—'}
          {readonly && <Text style={{ color: COLORS.textMuted }}> 🔒</Text>}
        </Text>
      ) : (
        <TextInput
          style={styles.fieldInput}
          value={value ?? ''}
          onChangeText={onChange}
          placeholderTextColor={COLORS.textMuted}
          keyboardType={keyboardType}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.md,
    backgroundColor: COLORS.bgCard, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  title: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.textPrimary },
  editBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: `${COLORS.primary}22`, justifyContent: 'center', alignItems: 'center',
  },
  content: { padding: SPACING.lg, paddingBottom: 80 },
  avatarSection: { alignItems: 'center', marginBottom: SPACING.lg },
  avatar: {
    width: 90, height: 90, borderRadius: 45, backgroundColor: COLORS.bgCard,
    justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md,
    borderWidth: 3, borderColor: COLORS.patientPrimary, ...SHADOWS.lg,
  },
  name: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.textPrimary },
  email: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 4 },
  roleBadge: {
    marginTop: SPACING.sm, paddingHorizontal: SPACING.md, paddingVertical: 4,
    backgroundColor: `${COLORS.patientPrimary}22`, borderRadius: RADIUS.full,
  },
  roleText: { color: COLORS.patientPrimary, fontWeight: '700', fontSize: FONT_SIZES.xs },
  card: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', ...SHADOWS.sm,
  },
  fieldRow: { padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  fieldLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  fieldValue: { fontSize: FONT_SIZES.base, color: COLORS.textPrimary },
  fieldValueLocked: { color: COLORS.textSecondary },
  fieldInput: {
    fontSize: FONT_SIZES.base, color: COLORS.textPrimary,
    borderBottomWidth: 1, borderBottomColor: COLORS.primary, paddingVertical: 2,
  },
  saveBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md, height: 52,
    justifyContent: 'center', alignItems: 'center', marginTop: SPACING.lg, ...SHADOWS.lg,
  },
  btnDisabled: { opacity: 0.7 },
  saveBtnText: { color: COLORS.white, fontSize: FONT_SIZES.base, fontWeight: '700' },
  logoutBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    marginTop: SPACING.lg, backgroundColor: `${COLORS.error}11`,
    borderRadius: RADIUS.md, height: 50, borderWidth: 1, borderColor: `${COLORS.error}33`,
  },
  logoutText: { color: COLORS.error, fontWeight: '700', fontSize: FONT_SIZES.base },
});
