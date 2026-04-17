// app/(patient)/journal.jsx
// Premium Patient Health Journal (Matches Web Feature-for-Feature)

import { useState, useEffect, useCallback } from 'react';
import useStyles from '../../hooks/useStyles';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  Modal, ScrollView, Alert, ActivityIndicator, RefreshControl,
  KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { COLORS as C, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

const MOOD_STATUSES = ['Improving', 'Stable', 'Worsening'];

const MOOD_CONFIG = {
  Improving: { color: C.success, icon: 'happy' },
  Stable: { color: C.warning, icon: 'meh' },
  Worsening: { color: C.error, icon: 'sad' },
};

const PAIN_COLOR = (level) => {
  const styles = useStyles(getStyles);
  if (level <= 3) return C.success;
  if (level <= 6) return C.warning;
  return C.error;
};

const PAIN_LABEL = (level) => {
  const styles = useStyles(getStyles);
  if (level <= 3) return 'Mild';
  if (level <= 6) return 'Moderate';
  return 'Severe';
};

export default function PatientJournalScreen() {
  const styles = useStyles(getStyles);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterMood, setFilterMood] = useState('ALL');
  
  const [modal, setModal] = useState(null); // null | 'new' | entryObj

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/patients/journals');
      setEntries(data.data || []);
    } catch (e) {
      console.error('Journal load error', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  
  const onRefresh = () => { setRefreshing(true); load(); };

  const handleDelete = (id) => {
    Alert.alert('Delete Entry?', 'This entry will be permanently deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/patients/journals/${id}`);
            setEntries(prev => prev.filter(e => e._id !== id));
          } catch {
            Alert.alert('Error', 'Failed to delete entry.');
          }
        },
      },
    ]);
  };

  const filtered = entries.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !q || e.title?.toLowerCase().includes(q) || e.symptoms?.toLowerCase().includes(q);
    const matchStatus = filterMood === 'ALL' || e.moodStatus === filterMood;
    return matchSearch && matchStatus;
  });

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.pageTitle}>Health Journal</Text>
          <Text style={styles.pageSubtitle}>Track your daily health</Text>
        </View>
        <TouchableOpacity style={styles.newBtn} onPress={() => setModal('new')} activeOpacity={0.85}>
          <Ionicons name="add" size={22} color={C.white} />
        </TouchableOpacity>
      </View>

      {/* Search & Filter */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={16} color={C.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by title or symptom..."
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

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={{ paddingHorizontal: SPACING.lg, gap: SPACING.sm }}>
        {['ALL', ...MOOD_STATUSES].map(s => {
          const count = s === 'ALL' ? entries.length : entries.filter(e => e.moodStatus === s).length;
          const isActive = filterMood === s;
          const color = s === 'ALL' ? C.primary : MOOD_CONFIG[s].color;
          return (
            <TouchableOpacity
              key={s}
              style={[styles.filterChip, isActive && { backgroundColor: color, borderColor: color }]}
              onPress={() => setFilterMood(s)}
            >
              <Text style={[styles.filterChipText, isActive && { color: C.white }]}>
                {s} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* List */}
      {loading ? (
        <ActivityIndicator color={C.patientPrimary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.patientPrimary} />}
          renderItem={({ item }) => (
            <JournalCard entry={item} onEdit={setModal} onDelete={handleDelete} />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="book-outline" size={32} color={C.patientPrimary} />
              </View>
              <Text style={styles.emptyTitle}>
                {search || filterMood !== 'ALL' ? 'No matching records' : 'No entries yet'}
              </Text>
              <Text style={styles.emptyText}>
                {search || filterMood !== 'ALL' ? 'Try a different search or filter.' : "Tap '+' to create your first entry."}
              </Text>
            </View>
          }
        />
      )}

      {modal !== null && (
        <JournalModal
          visible={modal !== null}
          entry={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load(); }}
        />
      )}
    </View>
  );
}

// ─── Journal Entry Card Component ──────────────────────────────────────────────
function JournalCard({ entry, onEdit, onDelete }) {
  const styles = useStyles(getStyles);
  const [expanded, setExpanded] = useState(false);
  const moodCfg = MOOD_CONFIG[entry.moodStatus] || MOOD_CONFIG.Stable;
  const formattedDate = new Date(entry.entryDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.cardHead} onPress={() => setExpanded(!expanded)} activeOpacity={0.8}>
        <View style={[styles.moodDot, { backgroundColor: moodCfg.color + '22', borderColor: moodCfg.color }]}>
          <Ionicons name={moodCfg.icon} size={20} color={moodCfg.color} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{entry.title || 'Untitled'}</Text>
          <View style={styles.cardMeta}>
            <Text style={styles.metaText}><Ionicons name="calendar" size={10} /> {formattedDate}</Text>
            {entry.painLevel && (
              <Text style={[styles.painBadge, { backgroundColor: PAIN_COLOR(entry.painLevel) }]}>
                Pain {entry.painLevel}/10
              </Text>
            )}
            <Text style={styles.metaText}>{entry.visibility === 'PRIVATE' ? '🔒 Private' : '🌐 Shared'}</Text>
          </View>
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={C.textMuted} />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expanded}>
          {entry.painLevel ? (
             <View style={styles.expandSection}>
                <Text style={styles.expandLabel}>Pain Level: {PAIN_LABEL(entry.painLevel)}</Text>
                <View style={styles.painBarBg}>
                   <View style={[styles.painBarFill, { backgroundColor: PAIN_COLOR(entry.painLevel), width: `${(entry.painLevel / 10) * 100}%` }]} />
                </View>
             </View>
          ) : null}
          {entry.symptoms ? (
             <View style={styles.expandSection}>
                <Text style={styles.expandLabel}>Symptoms</Text>
                <Text style={styles.textBlock}>{entry.symptoms}</Text>
             </View>
          ) : null}
          {entry.medications ? (
             <View style={styles.expandSection}>
                <Text style={styles.expandLabel}>Medications</Text>
                <Text style={[styles.textBlock, { backgroundColor: 'rgba(78,154,241,0.08)' }]}>{entry.medications}</Text>
             </View>
          ) : null}
          {entry.notes ? (
             <View style={styles.expandSection}>
                <Text style={styles.expandLabel}>Notes</Text>
                <Text style={styles.textBlock}>{entry.notes}</Text>
             </View>
          ) : null}
          
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

// ─── Modal Component ─────────────────────────────────────────────────────────
function JournalModal({ visible, entry, onClose, onSave }) {
  const styles = useStyles(getStyles);
  const isEdit = !!entry?._id;
  
  const [form, setForm] = useState({
    title: '', entryDate: new Date().toISOString().slice(0, 10),
    symptoms: '', medications: '', moodStatus: 'Stable',
    painLevel: '', notes: '', visibility: 'PRIVATE'
  });
  
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      if (isEdit) {
        setForm({
          title: entry.title || '',
          entryDate: entry.entryDate ? entry.entryDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
          symptoms: entry.symptoms || '', medications: entry.medications || '',
          moodStatus: entry.moodStatus || 'Stable', painLevel: entry.painLevel ?? '',
          notes: entry.notes || '', visibility: entry.visibility || 'PRIVATE'
        });
      } else {
        setForm({
          title: '', entryDate: new Date().toISOString().slice(0, 10),
          symptoms: '', medications: '', moodStatus: 'Stable',
          painLevel: '', notes: '', visibility: 'PRIVATE'
        });
      }
    }
  }, [visible, entry]);

  const handleSave = async () => {
    if (!form.title.trim()) { Alert.alert('Error', 'Title is required'); return; }
    if (!form.entryDate) { Alert.alert('Error', 'Entry date is required'); return; }

    const payload = { ...form };
    if (payload.painLevel === '') delete payload.painLevel;
    else payload.painLevel = Number(payload.painLevel);

    setSaving(true);
    try {
      if (isEdit) await api.put(`/patients/journals/${entry._id}`, payload);
      else await api.post('/patients/journals', payload);
      onSave();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to save entry.');
    } finally {
      setSaving(false);
    }
  };

  const setF = (key) => (v) => setForm(f => ({ ...f, [key]: v }));

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{isEdit ? 'Edit Entry' : 'New Journal Entry'}</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={C.textMuted} /></TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalBody}>
            <Text style={styles.label}>Title *</Text>
            <TextInput style={styles.inputField} placeholder="e.g. Morning Health Check" placeholderTextColor={C.textMuted} value={form.title} onChangeText={setF('title')} />
            
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Date *</Text>
                <TextInput style={styles.inputField} placeholder="YYYY-MM-DD" placeholderTextColor={C.textMuted} value={form.entryDate} onChangeText={setF('entryDate')} />
              </View>
              <View style={{ flex: 1, marginLeft: SPACING.md }}>
                <Text style={styles.label}>Visibility</Text>
                <TouchableOpacity style={styles.inputField} onPress={() => setF('visibility')(form.visibility === 'PRIVATE' ? 'SHARED' : 'PRIVATE')}>
                  <Text style={{ color: C.textPrimary, marginTop: 12 }}>
                    {form.visibility === 'PRIVATE' ? '🔒 Private' : '🌐 Shared'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.label}>Mood Status</Text>
            <View style={styles.moodRow}>
              {MOOD_STATUSES.map(m => (
                <TouchableOpacity key={m} style={[styles.moodBtn, form.moodStatus === m && { backgroundColor: MOOD_CONFIG[m].color + '33', borderColor: MOOD_CONFIG[m].color }]} onPress={() => setF('moodStatus')(m)}>
                  <Text style={[styles.moodBtnText, form.moodStatus === m && { color: MOOD_CONFIG[m].color }]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Pain Level: {form.painLevel === '' ? 'None' : `${form.painLevel}/10`}</Text>
            <View style={styles.painRow}>
              <TouchableOpacity style={[styles.painBtn, form.painLevel === '' && styles.painBtnActive]} onPress={() => setF('painLevel')('')}>
                <Text style={styles.painBtnText}>No Pain</Text>
              </TouchableOpacity>
              {[2, 5, 8, 10].map(v => (
                <TouchableOpacity key={v} style={[styles.painBtn, form.painLevel === String(v) && styles.painBtnActive]} onPress={() => setF('painLevel')(String(v))}>
                  <Text style={styles.painBtnText}>{v}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.label}>Symptoms</Text>
            <TextInput style={styles.textArea} placeholder="Describe any symptoms..." placeholderTextColor={C.textMuted} value={form.symptoms} onChangeText={setF('symptoms')} multiline />
            
            <Text style={styles.label}>Medications</Text>
            <TextInput style={styles.textArea} placeholder="List medications taken..." placeholderTextColor={C.textMuted} value={form.medications} onChangeText={setF('medications')} multiline />
            
            <Text style={styles.label}>Notes</Text>
            <TextInput style={styles.textArea} placeholder="Additional notes..." placeholderTextColor={C.textMuted} value={form.notes} onChangeText={setF('notes')} multiline />

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving} activeOpacity={0.8}>
              {saving ? <ActivityIndicator color={C.white} /> : <Text style={styles.saveBtnText}>{isEdit ? 'Update Entry' : 'Save Entry'}</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const getStyles = (C, isDark) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.md, backgroundColor: C.headerBg, borderBottomWidth: 1, borderBottomColor: C.headerBorder },
  pageTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: C.textPrimary },
  pageSubtitle: { fontSize: FONT_SIZES.xs, color: C.textSecondary, marginTop: 2 },
  newBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.patientPrimary, justifyContent: 'center', alignItems: 'center', ...SHADOWS.glowBlue },
  
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.cardBgTranslucent, borderRadius: RADIUS.md, borderWidth: 1, borderColor: C.cardInnerBorder, marginHorizontal: SPACING.lg, marginTop: SPACING.md, paddingHorizontal: SPACING.md, height: 44 },
  searchInput: { flex: 1, color: C.textPrimary, fontSize: FONT_SIZES.sm },
  filterScroll: { marginTop: SPACING.sm, marginBottom: SPACING.sm, maxHeight: 44 },
  filterChip: { paddingHorizontal: SPACING.md, paddingVertical: 7, borderRadius: RADIUS.full, borderWidth: 1, borderColor: C.border, backgroundColor: C.bgElevated },
  filterChipText: { fontSize: FONT_SIZES.xs, color: C.textSecondary, fontWeight: '600' },
  
  list: { padding: SPACING.lg, paddingBottom: 100 },
  card: { backgroundColor: C.cardBgTranslucent, borderRadius: RADIUS.lg, marginBottom: SPACING.sm, borderWidth: 1, borderColor: C.cardInnerBorder2, overflow: 'hidden' },
  cardHead: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md },
  moodDot: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, marginRight: SPACING.md },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: FONT_SIZES.base, fontWeight: '700', color: C.textPrimary },
  cardMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  metaText: { fontSize: FONT_SIZES.xs, color: C.textSecondary },
  painBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, color: '#fff', fontSize: 9, fontWeight: '800' },
  
  expanded: { borderTopWidth: 1, borderTopColor: C.cardInnerBorder2, padding: SPACING.md, backgroundColor: C.subtleBg },
  expandSection: { marginBottom: SPACING.sm },
  expandLabel: { fontSize: 11, fontWeight: '800', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  textBlock: { fontSize: FONT_SIZES.sm, color: C.textSecondary, backgroundColor: C.subtleBg, padding: SPACING.sm, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: C.cardInnerBorder },
  painBarBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' },
  painBarFill: { height: '100%', borderRadius: 3 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: SPACING.sm, paddingTop: SPACING.sm, marginTop: SPACING.sm, borderTopWidth: 1, borderTopColor: C.cardInnerBorder },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: SPACING.md, paddingVertical: 7, borderRadius: RADIUS.md, backgroundColor: `${C.primary}15` },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: SPACING.md, paddingVertical: 7, borderRadius: RADIUS.md, backgroundColor: `${C.error}15` },
  actionBtnText: { fontSize: FONT_SIZES.xs, fontWeight: '700' },
  
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(78, 154, 241, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md },
  emptyTitle: { fontSize: FONT_SIZES.base, fontWeight: '700', color: C.textPrimary },
  emptyText: { fontSize: FONT_SIZES.sm, color: C.textMuted, marginTop: 4, textAlign: 'center' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: C.modalBg, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: C.cardInnerBorder },
  modalTitle: { fontSize: FONT_SIZES.md, fontWeight: '800', color: C.textPrimary },
  modalScroll: { padding: SPACING.lg },
  modalBody: { paddingBottom: 60 },
  label: { fontSize: 12, fontWeight: '800', color: C.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: SPACING.sm },
  inputField: { backgroundColor: C.inputBgAlt, borderWidth: 1, borderColor: C.border, borderRadius: RADIUS.md, height: 48, paddingHorizontal: SPACING.md, color: C.textPrimary, fontSize: FONT_SIZES.base },
  row: { flexDirection: 'row' },
  moodRow: { flexDirection: 'row', gap: SPACING.sm },
  moodBtn: { flex: 1, borderWidth: 1, borderColor: C.border, backgroundColor: C.inputBgAlt, paddingVertical: 10, borderRadius: RADIUS.md, alignItems: 'center' },
  moodBtnText: { color: C.textSecondary, fontSize: 11, fontWeight: '700' },
  painRow: { flexDirection: 'row', gap: SPACING.sm },
  painBtn: { flex: 1, borderWidth: 1, borderColor: C.border, backgroundColor: C.inputBgAlt, paddingVertical: 10, borderRadius: RADIUS.md, alignItems: 'center' },
  painBtnActive: { borderColor: C.patientPrimary, backgroundColor: 'rgba(78, 154, 241, 0.15)' },
  painBtnText: { color: C.textSecondary, fontSize: 11, fontWeight: '600' },
  textArea: { backgroundColor: C.inputBgAlt, borderWidth: 1, borderColor: C.border, borderRadius: RADIUS.md, padding: SPACING.md, color: C.textPrimary, fontSize: FONT_SIZES.base, minHeight: 80, textAlignVertical: 'top' },
  saveBtn: { backgroundColor: C.patientPrimary, borderRadius: RADIUS.md, height: 50, justifyContent: 'center', alignItems: 'center', marginTop: SPACING.xl, ...SHADOWS.glowBlue },
  saveBtnText: { color: '#000', fontSize: FONT_SIZES.base, fontWeight: '800' }
});
