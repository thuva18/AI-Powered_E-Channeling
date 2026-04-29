// app/(doctor)/journal.jsx
// Doctor's Personal Journal — patient records, diagnosis, prescriptions
// Matches web PersonalJournal.jsx feature-for-feature

import { useState, useEffect, useCallback } from 'react';
import useStyles from '../../hooks/useStyles';
import useTheme from '../../hooks/useTheme';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  Modal, ScrollView, Alert, ActivityIndicator, RefreshControl,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { FONT_SIZES, SPACING, RADIUS } from '../../constants/theme';

const STATUSES = ['Active', 'Recovered', 'Follow-up', 'Referred', 'Chronic'];
const GENDERS = ['Male', 'Female', 'Other'];

const getStatusColor = (C) => ({
  Active: C.primary,
  Recovered: C.success,
  'Follow-up': C.warning,
  Referred: '#9B59F5',
  Chronic: C.error,
});

const emptyRx = () => ({ medication: '', dosage: '', frequency: '', duration: '' });

const BLANK_FORM = {
  patientId: '', patientName: '', patientAge: '', patientGender: '',
  contactNumber: '', visitDate: new Date().toISOString().slice(0, 10),
  diagnosis: '', notes: '', followUpDate: '', status: 'Active',
  prescription: [emptyRx()],
};

// ─── Prescription Row ────────────────────────────────────────────────────────
function RxRow({ rx, index, total, onChange, onRemove }) {
  const styles = useStyles(getStyles);
  const { C } = useTheme();
  return (
    <View style={styles.rxCard}>
      <View style={styles.rxHeader}>
        <Text style={styles.rxLabel}>Medication #{index + 1}</Text>
        {total > 1 && (
          <TouchableOpacity onPress={onRemove}>
            <Ionicons name="trash-outline" size={16} color={C.error} />
          </TouchableOpacity>
        )}
      </View>
      <TextInput style={styles.rxInput} placeholder="Medication name *" placeholderTextColor={C.textMuted}
        value={rx.medication} onChangeText={(v) => onChange('medication', v)} />
      <View style={styles.rxRow}>
        <TextInput style={[styles.rxInput, { flex: 1 }]} placeholder="Dosage (e.g. 500mg)"
          placeholderTextColor={C.textMuted} value={rx.dosage} onChangeText={(v) => onChange('dosage', v)} />
        <TextInput style={[styles.rxInput, { flex: 1, marginLeft: SPACING.sm }]} placeholder="Frequency"
          placeholderTextColor={C.textMuted} value={rx.frequency} onChangeText={(v) => onChange('frequency', v)} />
      </View>
      <TextInput style={styles.rxInput} placeholder="Duration (e.g. 7 days)"
        placeholderTextColor={C.textMuted} value={rx.duration} onChangeText={(v) => onChange('duration', v)} />
    </View>
  );
}

// ─── Journal Entry Card ──────────────────────────────────────────────────────
function JournalCard({ entry, onEdit, onDelete }) {
  const styles = useStyles(getStyles);
  const { C } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const STATUS_COLOR = getStatusColor(C);
  const sc = STATUS_COLOR[entry.status] || C.textSecondary;
  const initials = (entry.patientName?.[0] || 'P').toUpperCase();
  return (
    <View style={[styles.card, { borderLeftColor: sc }]}>
      <TouchableOpacity style={styles.cardHead} onPress={() => setExpanded(e => !e)} activeOpacity={0.8}>
        <View style={[styles.avatar, { backgroundColor: sc + '22' }]}>
          <Text style={[styles.avatarText, { color: sc }]}>{initials}</Text>
          {entry.patientId && (
            <View style={styles.linkedDot}>
              <Ionicons name="checkmark" size={8} color={C.white} />
            </View>
          )}
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.patientName}>{entry.patientName}</Text>
          <Text style={styles.metaText}>
            {entry.patientAge ? `${entry.patientAge} yrs · ` : ''}{entry.patientGender || ''} ·{' '}
            {new Date(entry.visitDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
          </Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: sc + '20' }]}>
          <Text style={[styles.statusPillText, { color: sc }]}>{entry.status}</Text>
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={C.textMuted} style={{ marginLeft: 4 }} />
      </TouchableOpacity>

      {/* Diagnosis preview always visible */}
      <View style={styles.diagRow}>
        <Ionicons name="medkit-outline" size={13} color={C.textMuted} />
        <Text style={styles.diagText} numberOfLines={expanded ? undefined : 2}>{entry.diagnosis}</Text>
      </View>

      {/* Expanded details */}
      {expanded && (
        <View style={styles.expanded}>
          {/* Prescriptions */}
          {entry.prescription?.length > 0 && (
            <View style={styles.expandSection}>
              <Text style={styles.expandLabel}>💊 Prescription</Text>
              {entry.prescription.map((rx, i) => (
                <View key={i} style={styles.rxViewCard}>
                  <Text style={styles.rxMed}>{rx.medication || '—'}</Text>
                  <Text style={styles.rxDetail}>
                    {[rx.dosage, rx.frequency, rx.duration].filter(Boolean).join(' · ')}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Notes */}
          {!!entry.notes && (
            <View style={styles.expandSection}>
              <Text style={styles.expandLabel}>📋 Notes</Text>
              <Text style={styles.notesText}>{entry.notes}</Text>
            </View>
          )}

          {/* Follow-up / contact */}
          <View style={styles.metaRow}>
            {!!entry.contactNumber && (
              <View style={styles.metaPill}>
                <Ionicons name="call-outline" size={12} color={C.textMuted} />
                <Text style={styles.metaPillText}>{entry.contactNumber}</Text>
              </View>
            )}
            {!!entry.followUpDate && (
              <View style={styles.metaPill}>
                <Ionicons name="calendar-outline" size={12} color={C.textMuted} />
                <Text style={styles.metaPillText}>
                  Follow-up: {new Date(entry.followUpDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}
                </Text>
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(entry)}>
              <Ionicons name="pencil-outline" size={15} color={C.primary} />
              <Text style={[styles.actionBtnText, { color: C.primary }]}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(entry._id)}>
              <Ionicons name="trash-outline" size={15} color={C.error} />
              <Text style={[styles.actionBtnText, { color: C.error }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Journal Modal ───────────────────────────────────────────────────────────
function JournalModal({ visible, entry, patients, onClose, onSave }) {
  const styles = useStyles(getStyles);
  const { C } = useTheme();
  const STATUS_COLOR = getStatusColor(C);
  const isEdit = !!entry?._id;
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPatientPicker, setShowPatientPicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);

  useEffect(() => {
    if (visible) {
      if (entry?._id) {
        setForm({
          patientId: entry.patientId ? (typeof entry.patientId === 'object' ? entry.patientId._id : entry.patientId) : '',
          patientName: entry.patientName || '',
          patientAge: entry.patientAge ? String(entry.patientAge) : '',
          patientGender: entry.patientGender || '',
          contactNumber: entry.contactNumber || '',
          visitDate: entry.visitDate ? entry.visitDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
          diagnosis: entry.diagnosis || '',
          notes: entry.notes || '',
          followUpDate: entry.followUpDate ? entry.followUpDate.slice(0, 10) : '',
          status: entry.status || 'Active',
          prescription: entry.prescription?.length ? entry.prescription : [emptyRx()],
        });
      } else {
        setForm({ ...BLANK_FORM, visitDate: new Date().toISOString().slice(0, 10), prescription: [emptyRx()] });
      }
      setError('');
    }
  }, [visible, entry]);

  const setF = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const setRx = (idx, field, val) => setForm(f => {
    const rx = [...f.prescription];
    rx[idx] = { ...rx[idx], [field]: val };
    return { ...f, prescription: rx };
  });

  const addRx = () => setForm(f => ({ ...f, prescription: [...f.prescription, emptyRx()] }));
  const removeRx = (idx) => setForm(f => ({ ...f, prescription: f.prescription.filter((_, i) => i !== idx) }));

  const handleSave = async () => {
    if (!form.patientName.trim()) { setError('Patient name is required'); return; }
    if (form.patientName.trim().length < 2) { setError('Patient name must be at least 2 characters'); return; }
    
    if (form.patientAge !== '') {
      const ageNum = Number(form.patientAge);
      if (isNaN(ageNum) || ageNum < 0 || ageNum > 150) {
        setError('Please enter a valid age between 0 and 150');
        return;
      }
    }

    if (form.contactNumber.trim()) {
      const phoneRegex = /^(07\d{8}|\+94\d{9})$/;
      if (!phoneRegex.test(form.contactNumber.trim())) {
        setError('Contact number must be a valid Sri Lankan number (e.g., 07XXXXXXXX or +94XXXXXXXXX)');
        return;
      }
    }

    if (!form.visitDate) { setError('Visit date is required'); return; }
    
    if (form.followUpDate) {
      const visitD = new Date(form.visitDate);
      const followD = new Date(form.followUpDate);
      if (isNaN(followD.getTime())) {
        setError('Invalid follow-up date format');
        return;
      }
      if (followD < visitD) {
        setError('Follow-up date cannot be earlier than the visit date');
        return;
      }
    }

    if (!form.diagnosis.trim()) { setError('Diagnosis is required'); return; }
    
    const hasIncompleteRx = form.prescription.some(r => 
      (!r.medication.trim() && (r.dosage.trim() || r.frequency.trim() || r.duration.trim()))
    );
    if (hasIncompleteRx) {
      setError('Medication name is required for filled prescription details'); 
      return;
    }

    const pres = form.prescription.map(r => ({
      medication: r.medication.trim(), dosage: r.dosage.trim(),
      frequency: r.frequency.trim(), duration: r.duration.trim(),
    })).filter(r => r.medication.trim() !== '');

    setSaving(true); setError('');
    const payload = {
      patientId: form.patientId || null,
      patientName: form.patientName.trim(),
      patientAge: form.patientAge !== '' ? Number(form.patientAge) : undefined,
      patientGender: form.patientGender || null,
      contactNumber: form.contactNumber.trim(),
      visitDate: form.visitDate,
      diagnosis: form.diagnosis.trim(),
      prescription: pres,
      notes: form.notes.trim(),
      followUpDate: form.followUpDate || null,
      status: form.status,
    };
    try {
      if (isEdit) await api.put(`/doctors/journal/${entry._id}`, payload);
      else await api.post('/doctors/journal', payload);
      onSave();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to save. Please try again.');
    } finally { setSaving(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.modalSheet}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleRow}>
              <View style={styles.modalIcon}>
                <Ionicons name="book-outline" size={18} color={C.white} />
              </View>
              <View>
                <Text style={styles.modalTitle}>{isEdit ? 'Edit Entry' : 'New Journal Entry'}</Text>
                <Text style={styles.modalSubtitle}>Patient record & prescription</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={C.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.modalBody}>
              {!!error && (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={14} color={C.error} />
                  <Text style={styles.errorBannerText}>{error}</Text>
                </View>
              )}

              {/* ── Patient Info ─────────────────────────────── */}
              <Text style={styles.sectionLabel}>👤 Patient Information</Text>

              {/* Link to registered patient */}
              <Text style={styles.fieldLabel}>Link to Registered Patient (Optional)</Text>
              <TouchableOpacity
                style={styles.picker}
                onPress={() => setShowPatientPicker(!showPatientPicker)}
                activeOpacity={0.8}
              >
                <Ionicons name="people-outline" size={16} color={C.textSecondary} style={{ marginRight: 8 }} />
                <Text style={[styles.pickerText, !form.patientId && { color: C.textMuted }]}>
                  {form.patientId
                    ? (patients.find(p => p._id === form.patientId)?.name || 'Linked patient')
                    : '-- External / unregistered patient --'}
                </Text>
                <Ionicons name={showPatientPicker ? 'chevron-up' : 'chevron-down'} size={14} color={C.textMuted} />
              </TouchableOpacity>
              {showPatientPicker && (
                <View style={styles.dropdownList}>
                  <TouchableOpacity style={styles.dropdownItem} onPress={() => { setF('patientId', ''); setShowPatientPicker(false); }}>
                    <Text style={styles.dropdownItemText}>-- No link --</Text>
                  </TouchableOpacity>
                  {patients.map(p => (
                    <TouchableOpacity key={p._id} style={[styles.dropdownItem, form.patientId === p._id && styles.dropdownItemActive]}
                      onPress={() => {
                        const age = p.dob ? Math.floor((Date.now() - new Date(p.dob)) / 31557600000) : '';
                        setForm(f => ({
                          ...f, patientId: p._id, patientName: p.name,
                          contactNumber: p.phone || f.contactNumber,
                          patientGender: p.gender || f.patientGender,
                          patientAge: age ? String(age) : f.patientAge,
                        }));
                        setShowPatientPicker(false);
                      }}>
                      <Text style={[styles.dropdownItemText, form.patientId === p._id && { color: C.doctorPrimary, fontWeight: '700' }]}>
                        {p.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <InputField label="Patient Name *" value={form.patientName} onChange={(v) => setF('patientName', v)} placeholder="Full name" />

              <View style={styles.twoCol}>
                <View style={{ flex: 1 }}>
                  <InputField label="Age" value={form.patientAge} onChange={(v) => setF('patientAge', v)} placeholder="e.g. 45" extra={{ keyboardType: 'numeric' }} />
                </View>
                <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                  <Text style={styles.fieldLabel}>Gender</Text>
                  <TouchableOpacity style={styles.picker} onPress={() => setShowGenderPicker(!showGenderPicker)}>
                    <Text style={[styles.pickerText, !form.patientGender && { color: C.textMuted }]}>
                      {form.patientGender || 'Select...'}
                    </Text>
                    <Ionicons name="chevron-down" size={14} color={C.textMuted} />
                  </TouchableOpacity>
                  {showGenderPicker && (
                    <View style={styles.dropdownList}>
                      {GENDERS.map(g => (
                        <TouchableOpacity key={g} style={styles.dropdownItem} onPress={() => { setF('patientGender', g); setShowGenderPicker(false); }}>
                          <Text style={styles.dropdownItemText}>{g}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>

              <InputField label="Contact Number" value={form.contactNumber} onChange={(v) => setF('contactNumber', v)} placeholder="07XXXXXXXX" extra={{ keyboardType: 'phone-pad' }} />
              <InputField label="Visit Date *" value={form.visitDate} onChange={(v) => setF('visitDate', v)} placeholder="YYYY-MM-DD" />

              {/* ── Diagnosis ───────────────────────────────── */}
              <Text style={[styles.sectionLabel, { marginTop: SPACING.md }]}>🏥 Diagnosis & Status</Text>
              <Text style={styles.fieldLabel}>Diagnosis *</Text>
              <TextInput
                style={[styles.textArea]}
                placeholder="Primary diagnosis / clinical findings…"
                placeholderTextColor={C.textMuted}
                value={form.diagnosis}
                onChangeText={(v) => setF('diagnosis', v)}
                multiline numberOfLines={4} textAlignVertical="top"
              />

              <Text style={styles.fieldLabel}>Case Status</Text>
              <View style={styles.statusRow}>
                {STATUSES.map(s => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.statusChip, form.status === s && { backgroundColor: STATUS_COLOR[s] + '20', borderColor: STATUS_COLOR[s] }]}
                    onPress={() => setF('status', s)}
                  >
                    <Text style={[styles.statusChipText, form.status === s && { color: STATUS_COLOR[s], fontWeight: '700' }]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* ── Prescriptions ───────────────────────────── */}
              <View style={styles.rxHeaderRow}>
                <Text style={[styles.sectionLabel, { marginBottom: 0 }]}>💊 Prescription</Text>
                <TouchableOpacity style={styles.addRxBtn} onPress={addRx}>
                  <Ionicons name="add" size={14} color={C.primary} />
                  <Text style={styles.addRxText}>Add</Text>
                </TouchableOpacity>
              </View>
              {form.prescription.map((rx, i) => (
                <RxRow key={i} rx={rx} index={i} total={form.prescription.length}
                  onChange={(field, val) => setRx(i, field, val)}
                  onRemove={() => removeRx(i)} />
              ))}

              {/* ── Notes & Follow-up ───────────────────────── */}
              <Text style={[styles.sectionLabel, { marginTop: SPACING.md }]}>📋 Notes & Follow-up</Text>
              <Text style={styles.fieldLabel}>Clinical Notes</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Observations, test results, treatment plan…"
                placeholderTextColor={C.textMuted}
                value={form.notes}
                onChangeText={(v) => setF('notes', v)}
                multiline numberOfLines={3} textAlignVertical="top"
              />
              <InputField label="Follow-up Date" value={form.followUpDate} onChange={(v) => setF('followUpDate', v)} placeholder="YYYY-MM-DD (optional)" />

              {/* Save */}
              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.65 }]}
                onPress={handleSave} disabled={saving} activeOpacity={0.85}
              >
                {saving ? <ActivityIndicator color={C.white} /> : (
                  <>
                    <Ionicons name="save-outline" size={17} color={C.white} style={{ marginRight: 6 }} />
                    <Text style={styles.saveBtnText}>{isEdit ? 'Update Entry' : 'Save Entry'}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Field helper ────────────────────────────────────────────────────────────
function InputField({ label, value, onChange, placeholder, extra = {} }) {
  const styles = useStyles(getStyles);
  const { C } = useTheme();
  return (
    <>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.inputField}
        placeholder={placeholder}
        placeholderTextColor={C.textMuted}
        value={value}
        onChangeText={onChange}
        {...extra}
      />
    </>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function DoctorJournalScreen() {
  const styles = useStyles(getStyles);
  const { C } = useTheme();
  const STATUS_COLOR = getStatusColor(C);
  const [entries, setEntries] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [modal, setModal] = useState(null); // null | 'new' | entryObj
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(async () => {
    try {
      const [jRes, pRes] = await Promise.all([
        api.get('/doctors/journal'),
        api.get('/doctors/patients'),
      ]);
      setEntries(jRes.data || []);
      setPatients(pRes.data || []);
    } catch (e) { console.error('Journal load error', e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  const handleDelete = (id) => {
    Alert.alert('Delete Entry?', 'This journal entry will be permanently deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          setDeletingId(id);
          try {
            await api.delete(`/doctors/journal/${id}`);
            setEntries(prev => prev.filter(e => e._id !== id));
          } catch { Alert.alert('Error', 'Failed to delete entry.'); }
          finally { setDeletingId(null); }
        },
      },
    ]);
  };

  const filtered = entries.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !q || e.patientName?.toLowerCase().includes(q) || e.diagnosis?.toLowerCase().includes(q);
    const matchStatus = filterStatus === 'ALL' || e.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const counts = STATUSES.reduce((acc, s) => { acc[s] = entries.filter(e => e.status === s).length; return acc; }, {});

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.pageTitle}>Patient Journal</Text>
          <Text style={styles.pageSubtitle}>{entries.length} records</Text>
        </View>
        <TouchableOpacity style={styles.newBtn} onPress={() => setModal('new')} activeOpacity={0.85}>
          <Ionicons name="add" size={22} color={C.white} />
        </TouchableOpacity>
      </View>

      {/* Search + Status filter */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={16} color={C.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by patient name or diagnosis…"
          placeholderTextColor={C.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {!!search && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={C.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Status filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={{ paddingHorizontal: SPACING.lg, gap: SPACING.sm }}>
        {['ALL', ...STATUSES].map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.filterChip, filterStatus === s && { backgroundColor: s === 'ALL' ? C.doctorPrimary : STATUS_COLOR[s], borderColor: s === 'ALL' ? C.doctorPrimary : STATUS_COLOR[s] }]}
            onPress={() => setFilterStatus(s)}
          >
            <Text style={[styles.filterChipText, filterStatus === s && { color: C.white }]}>
              {s}{s !== 'ALL' && counts[s] > 0 ? ` (${counts[s]})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color={C.doctorPrimary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <JournalCard
              entry={item}
              onEdit={setModal}
              onDelete={handleDelete}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.doctorPrimary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="book-outline" size={32} color={C.doctorPrimary} />
              </View>
              <Text style={styles.emptyTitle}>
                {search || filterStatus !== 'ALL' ? 'No matching records' : 'No journal entries yet'}
              </Text>
              <Text style={styles.emptyText}>
                {search || filterStatus !== 'ALL' ? 'Try a different search or filter.' : "Tap '+' to record your first patient visit."}
              </Text>
            </View>
          }
        />
      )}

      <JournalModal
        visible={modal !== null}
        entry={modal === 'new' ? null : modal}
        patients={patients}
        onClose={() => setModal(null)}
        onSave={() => { setModal(null); load(); }}
      />
    </View>
  );
}

const getStyles = (C, isDark, S) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.md,
    backgroundColor: C.headerBg, borderBottomWidth: 1, borderBottomColor: C.headerBorder,
  },
  pageTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: C.textPrimary },
  pageSubtitle: { fontSize: FONT_SIZES.xs, color: C.textSecondary, marginTop: 2 },
  newBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: C.doctorPrimary,
    justifyContent: 'center', alignItems: 'center', ...S.glowGreen,
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.inputBgAlt, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: C.border,
    marginHorizontal: SPACING.lg, marginTop: SPACING.md,
    paddingHorizontal: SPACING.md, height: 44,
  },
  searchInput: { flex: 1, color: C.textPrimary, fontSize: FONT_SIZES.sm },
  filterScroll: { marginTop: SPACING.sm, marginBottom: SPACING.sm, maxHeight: 44 },
  filterChip: {
    paddingHorizontal: SPACING.md, paddingVertical: 7, borderRadius: RADIUS.full,
    borderWidth: 1, borderColor: C.border, backgroundColor: C.inputBgAlt,
  },
  filterChipText: { fontSize: FONT_SIZES.xs, color: C.textSecondary, fontWeight: '600' },
  list: { padding: SPACING.lg, paddingBottom: 100 },
  card: {
    backgroundColor: C.cardBgTranslucent, borderRadius: RADIUS.lg,
    marginBottom: SPACING.sm, borderWidth: 1, borderColor: C.cardInnerBorder2,
    borderLeftWidth: 4, overflow: 'hidden',
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md,
  },
  avatarText: { fontSize: FONT_SIZES.md, fontWeight: '800' },
  linkedDot: {
    position: 'absolute', bottom: -2, right: -2,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: C.success, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: C.bg,
  },
  cardInfo: { flex: 1 },
  patientName: { fontSize: FONT_SIZES.base, fontWeight: '700', color: C.textPrimary },
  metaText: { fontSize: FONT_SIZES.xs, color: C.textSecondary, marginTop: 2 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.full },
  statusPillText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  diagRow: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm, gap: 4 },
  diagText: { flex: 1, fontSize: FONT_SIZES.sm, color: C.textSecondary },
  expanded: { borderTopWidth: 1, borderTopColor: C.cardInnerBorder2, padding: SPACING.md },
  expandSection: { marginBottom: SPACING.sm },
  expandLabel: { fontSize: 11, fontWeight: '800', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  rxViewCard: { backgroundColor: `${C.primary}10`, borderRadius: RADIUS.sm, padding: SPACING.sm, marginBottom: 4, borderWidth: 1, borderColor: `${C.primary}18` },
  rxMed: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: C.textPrimary },
  rxDetail: { fontSize: FONT_SIZES.xs, color: C.textSecondary, marginTop: 2 },
  notesText: { fontSize: FONT_SIZES.sm, color: C.textSecondary, lineHeight: 20 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.sm },
  metaPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.bgElevated, paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full },
  metaPillText: { fontSize: 11, color: C.textSecondary },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: C.cardInnerBorder },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: SPACING.md, paddingVertical: 7, borderRadius: RADIUS.md, backgroundColor: `${C.primary}15` },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: SPACING.md, paddingVertical: 7, borderRadius: RADIUS.md, backgroundColor: `${C.error}15` },
  actionBtnText: { fontSize: FONT_SIZES.xs, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: `${C.doctorPrimary}18`, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md },
  emptyTitle: { fontSize: FONT_SIZES.base, fontWeight: '700', color: C.textPrimary },
  emptyText: { fontSize: FONT_SIZES.sm, color: C.textMuted, marginTop: 4, textAlign: 'center' },

  // ── Modal ────────────────────────────────────────────────────────────────────
  modalOverlay: { flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: C.modalBg, borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl,
    maxHeight: '92%', borderTopWidth: 1, borderColor: C.cardInnerBorder,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: C.cardInnerBorder2,
  },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  modalIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.doctorPrimary, justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontSize: FONT_SIZES.base, fontWeight: '800', color: C.textPrimary },
  modalSubtitle: { fontSize: FONT_SIZES.xs, color: C.textSecondary },
  closeBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.bgElevated, justifyContent: 'center', alignItems: 'center' },
  modalBody: { padding: SPACING.lg },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: `${C.error}15`,
    borderRadius: RADIUS.md, padding: SPACING.sm, marginBottom: SPACING.md,
    borderLeftWidth: 3, borderLeftColor: C.error,
  },
  errorBannerText: { flex: 1, color: C.error, fontSize: FONT_SIZES.xs },
  sectionLabel: { fontSize: 12, fontWeight: '800', color: C.doctorPrimary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: SPACING.sm },
  fieldLabel: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: C.textSecondary, marginBottom: 6, marginTop: SPACING.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputField: {
    backgroundColor: C.inputBgAlt, borderWidth: 1, borderColor: C.border,
    borderRadius: RADIUS.md, height: 48, paddingHorizontal: SPACING.md,
    color: C.textPrimary, fontSize: FONT_SIZES.base, marginBottom: 2,
  },
  textArea: {
    backgroundColor: C.inputBgAlt, borderWidth: 1, borderColor: C.border,
    borderRadius: RADIUS.md, padding: SPACING.md, color: C.textPrimary,
    fontSize: FONT_SIZES.base, minHeight: 90, marginBottom: 2,
  },
  twoCol: { flexDirection: 'row' },
  picker: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.inputBgAlt, borderWidth: 1, borderColor: C.border,
    borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, height: 48,
    marginBottom: 2,
  },
  pickerText: { flex: 1, color: C.textPrimary, fontSize: FONT_SIZES.sm },
  dropdownList: {
    backgroundColor: C.bgCard, borderRadius: RADIUS.md, borderWidth: 1,
    borderColor: C.border, marginBottom: SPACING.sm, overflow: 'hidden',
  },
  dropdownItem: { paddingHorizontal: SPACING.md, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.cardInnerBorder },
  dropdownItemActive: { backgroundColor: `${C.doctorPrimary}15` },
  dropdownItemText: { color: C.textSecondary, fontSize: FONT_SIZES.sm },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.sm },
  statusChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full, borderWidth: 1, borderColor: C.border, backgroundColor: C.inputBgAlt },
  statusChipText: { fontSize: FONT_SIZES.xs, color: C.textSecondary, fontWeight: '600' },
  rxHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.md, marginBottom: SPACING.sm },
  addRxBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.md, backgroundColor: `${C.primary}15`, borderWidth: 1, borderColor: `${C.primary}33` },
  addRxText: { fontSize: FONT_SIZES.xs, color: C.primary, fontWeight: '700' },
  rxCard: { backgroundColor: isDark ? 'rgba(26,34,53,0.6)' : 'rgba(78,154,241,0.05)', borderRadius: RADIUS.md, padding: SPACING.sm, marginBottom: SPACING.sm, borderWidth: 1, borderColor: C.cardInnerBorder2 },
  rxHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  rxLabel: { fontSize: 11, fontWeight: '700', color: C.textMuted },
  rxInput: { backgroundColor: isDark ? 'rgba(8,12,24,0.5)' : C.bg, borderWidth: 1, borderColor: C.border, borderRadius: RADIUS.sm, height: 38, paddingHorizontal: SPACING.sm, color: C.textPrimary, fontSize: FONT_SIZES.sm, marginBottom: 4 },
  rxRow: { flexDirection: 'row' },
  saveBtn: {
    backgroundColor: C.doctorPrimary, borderRadius: RADIUS.md, height: 52,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    marginTop: SPACING.md, ...S.glowGreen,
  },
  saveBtnText: { color: C.white, fontSize: FONT_SIZES.base, fontWeight: '800' },
});
