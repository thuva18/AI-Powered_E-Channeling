// app/(patient)/profile.jsx
// Premium Patient profile view & edit

import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

export default function PatientProfileScreen() {
  const { user, updateUser, clearUser } = useAuthStore();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (deleteText !== 'DELETE') return;
    setDeleting(true);
    try {
      await api.delete('/patients/profile');
      await clearUser();
      router.replace('/(auth)/login');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to delete profile.');
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

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
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message ?? 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <ActivityIndicator color={COLORS.patientPrimary} style={{ flex: 1, backgroundColor: COLORS.bg }} />;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>My Profile</Text>
        <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(!editing)}>
          <Ionicons name={editing ? 'close' : 'pencil'} size={18} color={COLORS.patientPrimary} />
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

        {/* Links */}
        <TouchableOpacity style={styles.historyBtn} activeOpacity={0.8} onPress={() => router.push('/(patient)/journal')}>
            <View style={styles.hIcon}><Ionicons name="book" size={24} color={COLORS.patientPrimary} /></View>
            <View style={{flex: 1}}>
                <Text style={styles.historyBtnTitle}>Health Journal</Text>
                <Text style={styles.historyBtnSub}>Track daily mood, pain, and symptoms</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.historyBtn} activeOpacity={0.8} onPress={() => router.push('/(patient)/medical-history')}>
            <View style={styles.hIcon}><Ionicons name="medical" size={24} color={COLORS.patientPrimary} /></View>
            <View style={{flex: 1}}>
                <Text style={styles.historyBtnTitle}>Medical History</Text>
                <Text style={styles.historyBtnSub}>View past diagnoses & AI triage results</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Personal Details</Text>

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
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
          </TouchableOpacity>
        )}

        {/* Danger Zone */}
        <View style={styles.dangerCard}>
          <View style={styles.dangerHeader}>
            <Ionicons name="warning" size={18} color={COLORS.error} />
            <Text style={styles.dangerTitle}>Danger Zone</Text>
          </View>
          <Text style={styles.dangerText}>
            Permanently delete your patient account. <Text style={{ color: COLORS.error, fontWeight: '700' }}>This cannot be undone.</Text>
          </Text>
          <TouchableOpacity style={styles.deleteAccBtn} onPress={() => { setShowDeleteConfirm(true); setDeleteText(''); }}>
            <Ionicons name="trash-outline" size={15} color={COLORS.error} />
            <Text style={styles.deleteAccBtnText}>Delete My Profile</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => {
            Alert.alert('Log Out', 'Are you sure?', [
              { text: 'Cancel' },
              { text: 'Log Out', style: 'destructive', onPress: async () => { await clearUser(); router.replace('/(auth)/login'); } },
            ]);
          }}
        >
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          <Text style={styles.logoutText}>  Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Delete confirm modal */}
      {showDeleteConfirm && (
        <Modal transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.deleteModal}>
              <View style={styles.deleteModalIcon}>
                <Ionicons name="trash" size={28} color={COLORS.error} />
              </View>
              <Text style={styles.deleteModalTitle}>Delete Your Patient Profile?</Text>
              <Text style={styles.deleteModalText}>
                This will permanently delete your account and remove your access. <Text style={{ fontWeight: '700', color: COLORS.error }}>Cannot be undone.</Text>
              </Text>
              <Text style={styles.deleteModalPrompt}>
                Type <Text style={{ fontFamily: 'monospace', color: COLORS.error, fontWeight: '700' }}>DELETE</Text> to confirm:
              </Text>
              <TextInput
                style={styles.deleteModalInput}
                value={deleteText}
                onChangeText={setDeleteText}
                placeholder="Type DELETE here"
                placeholderTextColor={COLORS.textMuted}
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
                  {deleting ? <ActivityIndicator color={COLORS.white} size="small" /> : (
                    <Text style={styles.confirmDeleteBtnText}>Delete Profile</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

function renderField(
  _icon,
  label,
  value,
  onChange,
  editable = false,
  readonly = false,
  keyboardType = 'default',
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
    paddingHorizontal: SPACING.lg, paddingTop: 60, paddingBottom: SPACING.md,
    backgroundColor: 'rgba(19, 25, 41, 0.95)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  title: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.textPrimary },
  editBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(78, 154, 241, 0.1)', justifyContent: 'center', alignItems: 'center',
  },
  content: { padding: SPACING.lg, paddingBottom: 100 },
  avatarSection: { alignItems: 'center', marginBottom: SPACING.lg },
  avatar: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(28, 36, 56, 0.6)',
    justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md,
    borderWidth: 2, borderColor: COLORS.patientPrimary, ...SHADOWS.lg,
  },
  name: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.textPrimary },
  email: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 4 },
  roleBadge: {
    marginTop: SPACING.sm, paddingHorizontal: 16, paddingVertical: 6,
    backgroundColor: 'rgba(78, 154, 241, 0.2)', borderRadius: RADIUS.full,
  },
  roleText: { color: COLORS.patientPrimary, fontWeight: '800', fontSize: 11, textTransform: 'uppercase' },
  historyBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(28, 36, 56, 0.6)', borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', ...SHADOWS.sm },
  hIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(78, 154, 241, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md },
  historyBtnTitle: { fontSize: FONT_SIZES.md, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 2 },
  historyBtnSub: { fontSize: 12, color: COLORS.textSecondary },
  sectionTitle: { fontSize: FONT_SIZES.sm, textTransform: 'uppercase', letterSpacing: 1, color: COLORS.textSecondary, fontWeight: '800', marginBottom: SPACING.md, marginLeft: 4 },
  card: {
    backgroundColor: 'rgba(28, 36, 56, 0.6)', borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', overflow: 'hidden', ...SHADOWS.sm,
  },
  fieldRow: { padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  fieldLabel: { fontSize: 11, color: COLORS.textSecondary, textTransform: 'uppercase', fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
  fieldValue: { fontSize: FONT_SIZES.base, fontWeight: '600', color: COLORS.textPrimary },
  fieldValueLocked: { color: COLORS.textMuted },
  fieldInput: {
    fontSize: FONT_SIZES.base, color: COLORS.textPrimary, fontWeight: '600',
    borderBottomWidth: 1, borderBottomColor: COLORS.patientPrimary, paddingVertical: 4,
  },
  saveBtn: {
    backgroundColor: COLORS.patientPrimary, borderRadius: RADIUS.lg, height: 56,
    justifyContent: 'center', alignItems: 'center', marginTop: SPACING.xl, ...SHADOWS.lg,
  },
  btnDisabled: { opacity: 0.7 },
  saveBtnText: { color: "#131929", fontSize: FONT_SIZES.md, fontWeight: '800' },
  logoutBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    marginTop: SPACING.md, backgroundColor: 'rgba(232, 69, 69, 0.1)',
    borderRadius: RADIUS.lg, height: 56, borderWidth: 1, borderColor: 'rgba(232, 69, 69, 0.2)',
  },
  logoutText: { color: COLORS.error, fontWeight: '800', fontSize: FONT_SIZES.base },
  dangerCard: {
    borderRadius: RADIUS.xl, padding: SPACING.lg, borderWidth: 1,
    borderColor: `${COLORS.error}33`, backgroundColor: `${COLORS.error}08`, marginTop: SPACING.xl,
  },
  dangerHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  dangerTitle: { fontSize: FONT_SIZES.base, fontWeight: '800', color: COLORS.error },
  dangerText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, lineHeight: 20, marginBottom: SPACING.md },
  deleteAccBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: RADIUS.md, backgroundColor: `${COLORS.error}15`, borderWidth: 1, borderColor: `${COLORS.error}33` },
  deleteAccBtnText: { fontSize: FONT_SIZES.sm, color: COLORS.error, fontWeight: '700' },
  modalOverlay: { position: 'absolute', inset: 0, top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: SPACING.lg, zIndex: 999 },
  deleteModal: { backgroundColor: '#0E1525', borderRadius: RADIUS.xl, padding: SPACING.xl, width: '100%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  deleteModalIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: `${COLORS.error}15`, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: SPACING.md },
  deleteModalTitle: { fontSize: FONT_SIZES.lg, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center', marginBottom: SPACING.sm },
  deleteModalText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: SPACING.md },
  deleteModalPrompt: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  deleteModalInput: { backgroundColor: 'rgba(26,34,53,0.8)', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, height: 48, paddingHorizontal: SPACING.md, color: COLORS.textPrimary, fontSize: FONT_SIZES.base, marginBottom: SPACING.md },
  deleteModalActions: { flexDirection: 'row', gap: SPACING.sm },
  cancelBtn: { flex: 1, height: 48, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  cancelBtnText: { fontSize: FONT_SIZES.base, color: COLORS.textSecondary, fontWeight: '600' },
  confirmDeleteBtn: { flex: 1, height: 48, borderRadius: RADIUS.md, backgroundColor: COLORS.error, justifyContent: 'center', alignItems: 'center' },
  confirmDeleteBtnText: { fontSize: FONT_SIZES.base, color: COLORS.white, fontWeight: '800' },
});
