// app/(admin)/users.jsx
// Admin User Management – unified Patients / Doctors / Admins tabs
// Mirrors web AdminUserManagement.jsx feature-for-feature

import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, RefreshControl, Modal, ScrollView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import useTheme from '../../hooks/useTheme';
import { FONT_SIZES, SPACING, RADIUS } from '../../constants/theme';

// ── Patient Detail Modal ──────────────────────────────────────────────────────
function PatientModal({ patient, onClose }) {
  const { C, isDark } = useTheme();
  if (!patient) return null;
  const p = patient.patientProfile || {};
  const fullName = `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'N/A';
  const rows = [
    { icon: 'person', label: 'Full Name', value: fullName },
    { icon: 'mail', label: 'Email', value: patient.email },
    { icon: 'call', label: 'Phone', value: p.phone || '—' },
    { icon: 'card', label: 'NIC', value: p.nic || '—' },
    { icon: 'calendar', label: 'Date of Birth', value: p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : '—' },
    { icon: 'time', label: 'Registered', value: patient.createdAt ? new Date(patient.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' },
  ];
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: C.overlay, justifyContent: 'center', padding: SPACING.lg }}>
        <View style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.xl, overflow: 'hidden', maxHeight: '80%' }}>
          <View style={{ backgroundColor: C.patientPrimary, padding: SPACING.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#fff' }}>{(p.firstName?.[0] || patient.email?.[0] || 'P').toUpperCase()}</Text>
              </View>
              <View>
                <Text style={{ fontSize: FONT_SIZES.base, fontWeight: '700', color: '#fff' }}>{fullName}</Text>
                <Text style={{ fontSize: FONT_SIZES.xs, color: 'rgba(255,255,255,0.7)' }}>{patient.email}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="close" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ padding: SPACING.lg }}>
            {rows.map(r => (
              <View key={r.label} style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.md, backgroundColor: C.bgElevated, borderRadius: RADIUS.md, marginBottom: SPACING.sm }}>
                <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: `${C.patientPrimary}20`, justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name={r.icon} size={14} color={C.patientPrimary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, fontWeight: '600', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{r.label}</Text>
                  <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '600', color: C.textPrimary }}>{r.value}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ── Admin Form Modal (Create / Edit) ──────────────────────────────────────────
function AdminFormModal({ admin, onSave, onClose }) {
  const { C } = useTheme();
  const isEdit = !!admin?._id;
  const [form, setForm] = useState({
    firstName: admin?.patientProfile?.firstName || '',
    lastName: admin?.patientProfile?.lastName || '',
    email: admin?.email || '',
    password: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!form.email) { setError('Email is required'); return; }
    if (!isEdit && !form.password) { setError('Password is required'); return; }
    if (!isEdit && form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setSaving(true); setError('');
    try {
      const payload = { email: form.email, firstName: form.firstName, lastName: form.lastName };
      if (form.password) payload.password = form.password;
      await onSave(payload, admin?._id);
    } catch (e) { setError(e.response?.data?.message || 'Operation failed'); }
    finally { setSaving(false); }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={{ backgroundColor: C.bgCard, borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl, maxHeight: '85%' }}>
          <View style={{ backgroundColor: C.adminPrimary, padding: SPACING.lg, borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontSize: FONT_SIZES.base, fontWeight: '700', color: '#fff' }}>{isEdit ? 'Edit Admin' : 'Create New Admin'}</Text>
              <Text style={{ fontSize: FONT_SIZES.xs, color: 'rgba(255,255,255,0.7)' }}>{isEdit ? `Updating ${admin.email}` : 'Add a new administrator'}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="close" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ padding: SPACING.lg }} keyboardShouldPersistTaps="handled">
            <View style={{ flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: FONT_SIZES.xs, fontWeight: '600', color: C.textSecondary, marginBottom: 6 }}>First Name</Text>
                <TextInput style={{ backgroundColor: C.bgInput, borderWidth: 1, borderColor: C.border, borderRadius: RADIUS.md, height: 48, paddingHorizontal: SPACING.md, color: C.textPrimary, fontSize: FONT_SIZES.base }}
                  value={form.firstName} onChangeText={v => setForm(f => ({ ...f, firstName: v }))} placeholder="John" placeholderTextColor={C.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: FONT_SIZES.xs, fontWeight: '600', color: C.textSecondary, marginBottom: 6 }}>Last Name</Text>
                <TextInput style={{ backgroundColor: C.bgInput, borderWidth: 1, borderColor: C.border, borderRadius: RADIUS.md, height: 48, paddingHorizontal: SPACING.md, color: C.textPrimary, fontSize: FONT_SIZES.base }}
                  value={form.lastName} onChangeText={v => setForm(f => ({ ...f, lastName: v }))} placeholder="Doe" placeholderTextColor={C.textMuted} />
              </View>
            </View>
            <Text style={{ fontSize: FONT_SIZES.xs, fontWeight: '600', color: C.textSecondary, marginBottom: 6 }}>Email *</Text>
            <TextInput style={{ backgroundColor: C.bgInput, borderWidth: 1, borderColor: C.border, borderRadius: RADIUS.md, height: 48, paddingHorizontal: SPACING.md, color: C.textPrimary, fontSize: FONT_SIZES.base, marginBottom: SPACING.sm }}
              value={form.email} onChangeText={v => setForm(f => ({ ...f, email: v }))} placeholder="admin@mediportal.lk" placeholderTextColor={C.textMuted} keyboardType="email-address" autoCapitalize="none" />
            <Text style={{ fontSize: FONT_SIZES.xs, fontWeight: '600', color: C.textSecondary, marginBottom: 6 }}>Password {isEdit ? '(leave blank to keep)' : '*'}</Text>
            <TextInput style={{ backgroundColor: C.bgInput, borderWidth: 1, borderColor: C.border, borderRadius: RADIUS.md, height: 48, paddingHorizontal: SPACING.md, color: C.textPrimary, fontSize: FONT_SIZES.base, marginBottom: SPACING.md }}
              value={form.password} onChangeText={v => setForm(f => ({ ...f, password: v }))} placeholder={isEdit ? 'New password (optional)' : 'Min 6 characters'} placeholderTextColor={C.textMuted} secureTextEntry />

            {!!error && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: `${C.error}15`, borderRadius: RADIUS.md, padding: SPACING.sm, marginBottom: SPACING.md, borderLeftWidth: 3, borderLeftColor: C.error }}>
                <Ionicons name="alert-circle" size={14} color={C.error} />
                <Text style={{ flex: 1, color: C.error, fontSize: FONT_SIZES.xs }}>{error}</Text>
              </View>
            )}
            <View style={{ flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.xl }}>
              <TouchableOpacity style={{ flex: 1, height: 48, borderRadius: RADIUS.md, borderWidth: 1, borderColor: C.border, justifyContent: 'center', alignItems: 'center' }} onPress={onClose}>
                <Text style={{ fontSize: FONT_SIZES.base, color: C.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, height: 48, borderRadius: RADIUS.md, backgroundColor: C.adminPrimary, justifyContent: 'center', alignItems: 'center', opacity: saving ? 0.6 : 1 }}
                onPress={handleSubmit} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : (
                  <Text style={{ fontSize: FONT_SIZES.base, color: '#fff', fontWeight: '700' }}>{isEdit ? 'Save Changes' : 'Create Admin'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Main Screen ──────────────────────────────────────────────────────────────
export default function AdminUserManagementScreen() {
  const { C, S, isDark } = useTheme();
  const [tab, setTab] = useState('patients');
  const [search, setSearch] = useState('');
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewPatient, setViewPatient] = useState(null);
  const [adminForm, setAdminForm] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const fetchPatients = useCallback(async () => {
    try { const { data } = await api.get('/admin/patients'); setPatients(data.patients || data || []); }
    catch { console.error('Failed to load patients'); }
  }, []);

  const fetchDoctors = useCallback(async () => {
    try { const { data } = await api.get('/admin/doctors'); setDoctors(data || []); }
    catch { console.error('Failed to load doctors'); }
  }, []);

  const fetchAdmins = useCallback(async () => {
    try { const { data } = await api.get('/admin/admins'); setAdmins(data || []); }
    catch { console.error('Failed to load admins'); }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchPatients(), fetchDoctors(), fetchAdmins()]);
    setLoading(false); setRefreshing(false);
  }, []);

  useEffect(() => { fetchAll(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchAll(); };

  const handleToggleActive = async (userId) => {
    setTogglingId(userId);
    try {
      await api.patch(`/admin/users/${userId}/toggle-active`);
      await (tab === 'patients' ? fetchPatients() : tab === 'doctors' ? fetchDoctors() : fetchAdmins());
    } catch { Alert.alert('Error', 'Toggle failed'); }
    finally { setTogglingId(null); }
  };

  const handleDelete = (id, label, kind) => {
    Alert.alert(`Delete ${label}?`, 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          if (kind === 'doctor') await api.delete(`/admin/doctors/${id}`);
          else await api.delete(`/admin/users/${id}`);
          await (tab === 'patients' ? fetchPatients() : tab === 'doctors' ? fetchDoctors() : fetchAdmins());
        } catch { Alert.alert('Error', 'Delete failed'); }
      }},
    ]);
  };

  const handleAdminSave = async (payload, id) => {
    if (id) await api.patch(`/admin/admins/${id}`, payload);
    else await api.post('/admin/admins', payload);
    await fetchAdmins();
    setAdminForm(null);
  };

  // Filtered data
  const q = search.toLowerCase();
  const filteredPatients = q ? patients.filter(p => p.name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q)) : patients;
  const filteredDoctors = q ? doctors.filter(d => d.name?.toLowerCase().includes(q) || d.specialization?.toLowerCase().includes(q)) : doctors;
  const filteredAdmins = q ? admins.filter(a => a.email?.toLowerCase().includes(q)) : admins;

  const currentData = tab === 'patients' ? filteredPatients : tab === 'doctors' ? filteredDoctors : filteredAdmins;

  const TABS = [
    { key: 'patients', label: 'Patients', count: patients.length, icon: 'people', color: C.patientPrimary },
    { key: 'doctors', label: 'Doctors', count: doctors.length, icon: 'medical', color: C.doctorPrimary },
    { key: 'admins', label: 'Admins', count: admins.length, icon: 'shield-checkmark', color: C.adminPrimary },
  ];

  const statusColor = (s) => {
    if (s === 'approved') return C.success;
    if (s === 'pending') return C.warning;
    if (s === 'rejected') return C.error;
    return C.textMuted;
  };

  const renderPatient = ({ item }) => (
    <View style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: C.border, ...S.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: `${C.patientPrimary}20`, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: C.patientPrimary }}>{(item.name?.[0] || 'P').toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: FONT_SIZES.base, fontWeight: '700', color: C.textPrimary }}>{item.name || 'N/A'}</Text>
          <Text style={{ fontSize: FONT_SIZES.xs, color: C.textSecondary }}>{item.email}</Text>
        </View>
        <TouchableOpacity style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: `${C.patientPrimary}15`, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.xs }}
          onPress={() => setViewPatient(item)}>
          <Ionicons name="eye" size={16} color={C.patientPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: `${C.error}15`, justifyContent: 'center', alignItems: 'center' }}
          onPress={() => handleDelete(item._id, item.name || item.email, 'patient')}>
          <Ionicons name="trash" size={16} color={C.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDoctor = ({ item }) => (
    <View style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: C.border, ...S.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm }}>
        <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: `${C.doctorPrimary}20`, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md }}>
          <Text style={{ fontSize: 18 }}>👨‍⚕️</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: FONT_SIZES.base, fontWeight: '700', color: C.textPrimary }}>Dr. {item.name}</Text>
          <Text style={{ fontSize: FONT_SIZES.xs, color: C.doctorPrimary }}>{item.specialization || 'General'}</Text>
          <Text style={{ fontSize: FONT_SIZES.xs, color: C.textMuted }}>{item.email}</Text>
        </View>
        <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full, backgroundColor: statusColor(item.approvalStatus) + '22' }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: statusColor(item.approvalStatus), textTransform: 'capitalize' }}>{item.approvalStatus}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
        <TouchableOpacity style={{ flex: 1, height: 36, borderRadius: RADIUS.md, borderWidth: 1, borderColor: (item.isActive !== false ? C.error : C.success) + '44', justifyContent: 'center', alignItems: 'center' }}
          onPress={() => handleToggleActive(item.userId || item._id)} disabled={togglingId === (item.userId || item._id)}>
          {togglingId === (item.userId || item._id) ? <ActivityIndicator size="small" color={C.textSecondary} /> :
            <Text style={{ fontSize: FONT_SIZES.xs, fontWeight: '700', color: item.isActive !== false ? C.error : C.success }}>{item.isActive !== false ? 'Deactivate' : 'Activate'}</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={{ width: 36, height: 36, borderRadius: RADIUS.md, backgroundColor: `${C.error}15`, justifyContent: 'center', alignItems: 'center' }}
          onPress={() => handleDelete(item.doctorId || item._id, item.name, 'doctor')}>
          <Ionicons name="trash" size={16} color={C.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAdmin = ({ item }) => (
    <View style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: C.border, ...S.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: `${C.adminPrimary}20`, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md }}>
          <Ionicons name="shield-checkmark" size={20} color={C.adminPrimary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: FONT_SIZES.base, fontWeight: '700', color: C.textPrimary }}>{item.email}</Text>
          {(item.patientProfile?.firstName || item.firstName) && (
            <Text style={{ fontSize: FONT_SIZES.xs, color: C.textSecondary }}>
              {item.patientProfile?.firstName || item.firstName} {item.patientProfile?.lastName || item.lastName || ''}
            </Text>
          )}
        </View>
        <TouchableOpacity style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: `${C.warning}15`, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.xs }}
          onPress={() => setAdminForm(item)}>
          <Ionicons name="pencil" size={16} color={C.warning} />
        </TouchableOpacity>
        <TouchableOpacity style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: `${C.error}15`, justifyContent: 'center', alignItems: 'center' }}
          onPress={() => handleDelete(item._id, item.email, 'admin')}>
          <Ionicons name="trash" size={16} color={C.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderItem = tab === 'patients' ? renderPatient : tab === 'doctors' ? renderDoctor : renderAdmin;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View style={{ paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.md, backgroundColor: C.bgCard, borderBottomWidth: 1, borderBottomColor: C.border }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontSize: FONT_SIZES.xl, fontWeight: '700', color: C.textPrimary }}>User Management</Text>
            <Text style={{ fontSize: FONT_SIZES.sm, color: C.textSecondary }}>Manage patients, doctors & admins</Text>
          </View>
          {tab === 'admins' && (
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.adminPrimary, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.md }}
              onPress={() => setAdminForm({})}>
              <Ionicons name="add-circle" size={16} color="#fff" />
              <Text style={{ fontSize: FONT_SIZES.xs, fontWeight: '700', color: '#fff' }}>New Admin</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tab switcher */}
      <View style={{ flexDirection: 'row', padding: SPACING.md, backgroundColor: C.bgCard, borderBottomWidth: 1, borderBottomColor: C.border, gap: SPACING.sm }}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key} style={{
            flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
            paddingVertical: SPACING.sm, borderRadius: RADIUS.md,
            backgroundColor: tab === t.key ? t.color : C.bg,
            borderWidth: 1, borderColor: tab === t.key ? t.color : C.border,
          }} onPress={() => setTab(t.key)}>
            <Ionicons name={t.icon} size={14} color={tab === t.key ? '#fff' : C.textMuted} />
            <Text style={{ fontSize: FONT_SIZES.xs, fontWeight: '700', color: tab === t.key ? '#fff' : C.textSecondary }}>{t.label}</Text>
            <View style={{ backgroundColor: tab === t.key ? 'rgba(255,255,255,0.25)' : C.bgElevated, paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.full }}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: tab === t.key ? '#fff' : C.textMuted }}>{t.count}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search */}
      <View style={{ flexDirection: 'row', alignItems: 'center', margin: SPACING.md, backgroundColor: C.bgCard, borderRadius: RADIUS.md, borderWidth: 1, borderColor: C.border, paddingHorizontal: SPACING.md, height: 44 }}>
        <Ionicons name="search" size={16} color={C.textMuted} style={{ marginRight: SPACING.sm }} />
        <TextInput style={{ flex: 1, color: C.textPrimary, fontSize: FONT_SIZES.sm }} placeholder={`Search ${tab}...`} placeholderTextColor={C.textMuted} value={search} onChangeText={setSearch} />
        {!!search && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={C.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      {loading ? <ActivityIndicator color={C.adminPrimary} style={{ marginTop: 40 }} /> : (
        <FlatList data={currentData} keyExtractor={item => item._id} renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: SPACING.md, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.adminPrimary} />}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Ionicons name="people-outline" size={40} color={C.textMuted} />
              <Text style={{ color: C.textMuted, marginTop: SPACING.md }}>No {tab} found</Text>
            </View>
          }
        />
      )}

      {/* Modals */}
      <PatientModal patient={viewPatient} onClose={() => setViewPatient(null)} />
      {adminForm !== null && (
        <AdminFormModal admin={adminForm?._id ? adminForm : null} onSave={handleAdminSave} onClose={() => setAdminForm(null)} />
      )}
    </View>
  );
}
