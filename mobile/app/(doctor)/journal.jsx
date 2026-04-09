// app/(doctor)/journal.tsx
// Member 6 – Doctor Personal Journal (CRUD)

import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Modal, KeyboardAvoidingView,
  Platform, ScrollView, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

// Types removed

const MOODS = ['😊', '😐', '😔', '😤', '🤔', '😴', '💪', '😰'];

export default function DoctorJournalScreen() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', mood: '😊', tags: '' });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchEntries = useCallback(async () => {
    try {
      const res = await api.get('/doctors/journal');
      setEntries(res.data || []);
    } catch { Alert.alert('Error', 'Failed to load journal'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchEntries(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchEntries(); };

  const openCreate = () => {
    setEditEntry(null);
    setForm({ title: '', content: '', mood: '😊', tags: '' });
    setModalVisible(true);
  };

  const openEdit = (entry) => {
    setEditEntry(entry);
    setForm({
      title: entry.title,
      content: entry.content,
      mood: entry.mood ?? '😊',
      tags: entry.tags?.join(', ') ?? '',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { Alert.alert('Title required', 'Please enter a title for your journal entry.'); return; }
    if (form.title.trim().length > 100) { Alert.alert('Title too long', 'Title must be 100 characters or fewer.'); return; }
    if (!form.content.trim()) { Alert.alert('Content required', 'Please write something in your journal entry.'); return; }
    if (form.content.trim().length < 10) { Alert.alert('Too short', 'Entry content must be at least 10 characters.'); return; }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
      mood: form.mood,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    };
    try {
      if (editEntry) {
        const res = await api.put(`/doctors/journal/${editEntry._id}`, payload);
        setEntries((prev) => prev.map((e) => e._id === editEntry._id ? res.data : e));
      } else {
        const res = await api.post('/doctors/journal', payload);
        setEntries((prev) => [res.data, ...prev]);
      }
      setModalVisible(false);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message ?? 'Failed to save entry');
    } finally { setSaving(false); }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Entry', 'This will permanently delete this journal entry.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          setDeletingId(id);
          try {
            await api.delete(`/doctors/journal/${id}`);
            setEntries((prev) => prev.filter((e) => e._id !== id));
          } catch { Alert.alert('Error', 'Failed to delete'); }
          finally { setDeletingId(null); }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={[styles.card, { borderLeftColor: moodColor(item.mood) }]}>
      <View style={styles.cardHeader}>
        <Text style={styles.moodEmoji}>{item.mood ?? '📓'}</Text>
        <View style={styles.cardMeta}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.cardDate}>
            {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </Text>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: `${COLORS.primary}15` }]} onPress={() => openEdit(item)}>
            <Ionicons name="pencil-outline" size={17} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: `${COLORS.error}15` }]}
            onPress={() => handleDelete(item._id)}
            disabled={deletingId === item._id}
          >
            {deletingId === item._id
              ? <ActivityIndicator size="small" color={COLORS.error} />
              : <Ionicons name="trash-outline" size={17} color={COLORS.error} />
            }
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.cardContent} numberOfLines={3}>{item.content}</Text>
      {item.tags && item.tags.length > 0 && (
        <View style={styles.tagsRow}>
          {item.tags.map((tag) => (
            <View key={tag} style={[styles.tag, { backgroundColor: moodColor(item.mood) + '18' }]}>
              <Text style={[styles.tagText, { color: moodColor(item.mood) }]}>#{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const moodColor = (mood) => {
    const map = { '😊': '#22C9A0', '😐': '#4E9AF1', '😔': '#9B59F5', '😤': '#E84545', '🤔': '#F5A623', '😴': '#8A96B3', '💪': '#22C9A0', '😰': '#E84545' };
    return map[mood] || COLORS.doctorPrimary;
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Personal Journal</Text>
          <Text style={styles.subtitle}>{entries.length} entries</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate} activeOpacity={0.8}>
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator color={COLORS.doctorPrimary} style={{ marginTop: 40 }} /> : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.doctorPrimary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="book-outline" size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>Your journal is empty</Text>
              <TouchableOpacity onPress={openCreate} style={styles.emptyLink}>
                <Text style={{ color: COLORS.doctorPrimary, fontWeight: '600' }}>Write your first entry →</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Create/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editEntry ? 'Edit Entry' : 'New Journal Entry'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Mood */}
              <Text style={styles.fieldLabel}>How are you feeling?</Text>
              <View style={styles.moodRow}>
                {MOODS.map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.moodBtn, form.mood === m && styles.moodBtnActive]}
                    onPress={() => setForm((f) => ({ ...f, mood: m }))}
                  >
                    <Text style={{ fontSize: 22 }}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Title */}
              <View style={styles.fieldLabelRow}>
                <Text style={styles.fieldLabel}>Title</Text>
                <Text style={[styles.charCount, form.title.length > 90 && { color: COLORS.error }]}>{form.title.length}/100</Text>
              </View>
              <TextInput
                style={[styles.textInput, form.title.length > 100 && styles.inputError]}
                placeholder="Entry title..."
                placeholderTextColor={COLORS.textMuted}
                value={form.title}
                onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
                maxLength={105}
              />

              {/* Content */}
              <View style={styles.fieldLabelRow}>
                <Text style={styles.fieldLabel}>Content</Text>
                <Text style={[styles.charCount, form.content.length < 10 && form.content.length > 0 && { color: COLORS.warning }]}>{form.content.length} chars</Text>
              </View>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Write your thoughts, reflections, observations..."
                placeholderTextColor={COLORS.textMuted}
                value={form.content}
                onChangeText={(v) => setForm((f) => ({ ...f, content: v }))}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
              />

              {/* Tags */}
              <Text style={styles.fieldLabel}>Tags (comma separated)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="clinical, research, personal..."
                placeholderTextColor={COLORS.textMuted}
                value={form.tags}
                onChangeText={(v) => setForm((f) => ({ ...f, tags: v }))}
                autoCapitalize="none"
              />

              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.btnDisabled]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving
                  ? <ActivityIndicator color={COLORS.white} />
                  : <Text style={styles.saveBtnText}>{editEntry ? 'Save Changes' : 'Create Entry'}</Text>
                }
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  subtitle: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  addBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.doctorPrimary, justifyContent: 'center', alignItems: 'center', ...SHADOWS.md,
  },
  list: { padding: SPACING.lg, paddingBottom: 80 },
  card: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: SPACING.md,
    marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border,
    borderLeftWidth: 4, ...SHADOWS.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  moodEmoji: { fontSize: 28, marginRight: SPACING.md },
  cardMeta: { flex: 1 },
  cardTitle: { fontSize: FONT_SIZES.base, fontWeight: '700', color: COLORS.textPrimary },
  cardDate: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 2 },
  cardActions: { flexDirection: 'row', gap: SPACING.sm },
  iconBtn: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: `${COLORS.primary}11`,
    justifyContent: 'center', alignItems: 'center',
  },
  cardContent: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, lineHeight: 20 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: SPACING.sm, gap: SPACING.xs },
  tag: {
    paddingHorizontal: SPACING.sm, paddingVertical: 2,
    backgroundColor: `${COLORS.doctorPrimary}22`, borderRadius: RADIUS.full,
  },
  tagText: { color: COLORS.doctorPrimary, fontSize: FONT_SIZES.xs, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: COLORS.textMuted, marginTop: SPACING.md, fontSize: FONT_SIZES.base },
  emptyLink: { marginTop: SPACING.md },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: COLORS.bgCard, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg, maxHeight: '90%', ...SHADOWS.lg,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg,
  },
  modalTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textPrimary },
  fieldLabel: {
    fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, textTransform: 'uppercase',
    letterSpacing: 0.5, marginBottom: SPACING.sm, marginTop: SPACING.md, fontWeight: '700',
  },
  fieldLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.md, marginBottom: SPACING.sm },
  charCount: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted },
  inputError: { borderColor: COLORS.error },
  moodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.sm },
  moodBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.bgInput,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  moodBtnActive: { borderColor: COLORS.doctorPrimary, backgroundColor: `${COLORS.doctorPrimary}22` },
  textInput: {
    backgroundColor: COLORS.bgInput, borderRadius: RADIUS.md, borderWidth: 1,
    borderColor: COLORS.border, padding: SPACING.md, color: COLORS.textPrimary,
    fontSize: FONT_SIZES.base,
  },
  textArea: { minHeight: 140, textAlignVertical: 'top' },
  saveBtn: {
    backgroundColor: COLORS.doctorPrimary, borderRadius: RADIUS.md, height: 52,
    justifyContent: 'center', alignItems: 'center', marginTop: SPACING.lg, marginBottom: SPACING.xl,
    ...SHADOWS.md,
  },
  btnDisabled: { opacity: 0.7 },
  saveBtnText: { color: COLORS.white, fontSize: FONT_SIZES.base, fontWeight: '700' },
});
