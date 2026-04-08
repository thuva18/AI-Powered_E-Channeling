// app/(admin)/doctors.tsx
// Member 4 – Admin Module: Doctor Management
// Approve, reject, delete doctors

import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

interface Doctor {
  _id: string;
  name: string;
  email?: string;
  specialization?: string;
  hospital?: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  isActive?: boolean;
}

export default function AdminDoctorsScreen() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filtered, setFiltered] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [search, setSearch] = useState('');

  const fetchDoctors = useCallback(async () => {
    try {
      const res = await api.get('/admin/doctors');
      setDoctors(res.data || []);
    } catch { Alert.alert('Error', 'Failed to load doctors'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchDoctors(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchDoctors(); };

  useEffect(() => {
    let data = filter === 'all' ? doctors : doctors.filter((d) => d.approvalStatus === filter);
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((d) => d.name.toLowerCase().includes(q) || d.specialization?.toLowerCase().includes(q));
    }
    setFiltered(data);
  }, [filter, search, doctors]);

  const updateApproval = async (id: string, status: 'approved' | 'rejected') => {
    setProcessingId(id);
    try {
      await api.patch(`/admin/doctors/${id}/approve`, { approvalStatus: status });
      setDoctors((prev) =>
        prev.map((d) => d._id === id ? { ...d, approvalStatus: status } : d),
      );
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message ?? 'Action failed');
    } finally { setProcessingId(null); }
  };

  const deleteDoctor = (id: string, name: string) => {
    Alert.alert(`Delete Dr. ${name}?`, 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          setProcessingId(id);
          try {
            await api.delete(`/admin/doctors/${id}`);
            setDoctors((prev) => prev.filter((d) => d._id !== id));
          } catch { Alert.alert('Error', 'Failed to delete doctor'); }
          finally { setProcessingId(null); }
        },
      },
    ]);
  };

  const statusConfig: Record<string, { color: string; icon: string }> = {
    approved: { color: COLORS.success, icon: 'checkmark-circle' },
    pending: { color: COLORS.warning, icon: 'time-outline' },
    rejected: { color: COLORS.error, icon: 'close-circle' },
  };

  const renderItem = ({ item }: { item: Doctor }) => {
    const cfg = statusConfig[item.approvalStatus] ?? { color: COLORS.textMuted, icon: 'help-circle' };
    const isProcessing = processingId === item._id;
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.avatar}><Text style={{ fontSize: 22 }}>👨‍⚕️</Text></View>
          <View style={styles.info}>
            <Text style={styles.docName}>Dr. {item.name}</Text>
            {item.specialization && <Text style={styles.spec}>{item.specialization}</Text>}
            {item.hospital && <Text style={styles.hospital}>🏥 {item.hospital}</Text>}
            {item.email && <Text style={styles.email}>✉️ {item.email}</Text>}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: cfg.color + '22' }]}>
            <Ionicons name={cfg.icon as any} size={14} color={cfg.color} />
            <Text style={[styles.statusText, { color: cfg.color }]}> {item.approvalStatus}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          {item.approvalStatus === 'pending' && (
            <>
              <TouchableOpacity
                style={[styles.actionBtn, styles.approveBtn]}
                onPress={() => updateApproval(item._id, 'approved')}
                disabled={isProcessing}
              >
                {isProcessing
                  ? <ActivityIndicator size="small" color={COLORS.success} />
                  : <><Ionicons name="checkmark" size={16} color={COLORS.success} /><Text style={[styles.actionBtnText, { color: COLORS.success }]}> Approve</Text></>
                }
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.rejectBtn]}
                onPress={() => updateApproval(item._id, 'rejected')}
                disabled={isProcessing}
              >
                <Ionicons name="close" size={16} color={COLORS.warning} />
                <Text style={[styles.actionBtnText, { color: COLORS.warning }]}> Reject</Text>
              </TouchableOpacity>
            </>
          )}
          {item.approvalStatus === 'rejected' && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.approveBtn]}
              onPress={() => updateApproval(item._id, 'approved')}
              disabled={isProcessing}
            >
              <Ionicons name="checkmark" size={16} color={COLORS.success} />
              <Text style={[styles.actionBtnText, { color: COLORS.success }]}> Approve</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={() => deleteDoctor(item._id, item.name)}
            disabled={isProcessing}
          >
            <Ionicons name="trash-outline" size={16} color={COLORS.error} />
            <Text style={[styles.actionBtnText, { color: COLORS.error }]}> Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Manage Doctors</Text>
        <Text style={styles.subtitle}>{doctors.length} total | {doctors.filter((d) => d.approvalStatus === 'pending').length} pending</Text>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={COLORS.textSecondary} style={{ marginRight: SPACING.sm }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search doctors..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter */}
      <View style={styles.filterRow}>
        {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
          <TouchableOpacity
            key={f} style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? <ActivityIndicator color={COLORS.adminPrimary} style={{ marginTop: 40 }} /> : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.adminPrimary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="medical-outline" size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No doctors found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.md,
    backgroundColor: COLORS.bgCard, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  title: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.textPrimary },
  subtitle: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', margin: SPACING.lg,
    marginBottom: 0, backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md, height: 48,
  },
  searchInput: { flex: 1, color: COLORS.textPrimary, fontSize: FONT_SIZES.base },
  filterRow: { flexDirection: 'row', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, gap: SPACING.sm },
  filterTab: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full, backgroundColor: COLORS.bgCard,
    borderWidth: 1, borderColor: COLORS.border,
  },
  filterTabActive: { backgroundColor: COLORS.adminPrimary, borderColor: COLORS.adminPrimary },
  filterText: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, fontWeight: '600' },
  filterTextActive: { color: COLORS.white },
  list: { padding: SPACING.lg, paddingBottom: 80 },
  card: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: SPACING.md,
    marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.md },
  avatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.bgElevated,
    justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md,
  },
  info: { flex: 1 },
  docName: { fontSize: FONT_SIZES.base, fontWeight: '700', color: COLORS.textPrimary },
  spec: { fontSize: FONT_SIZES.sm, color: COLORS.adminPrimary, marginTop: 2 },
  hospital: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  email: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full },
  statusText: { fontSize: FONT_SIZES.xs, fontWeight: '700', textTransform: 'capitalize' },
  actionsRow: { flexDirection: 'row', gap: SPACING.sm },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 1,
  },
  approveBtn: { borderColor: COLORS.success + '44', backgroundColor: COLORS.success + '11' },
  rejectBtn: { borderColor: COLORS.warning + '44', backgroundColor: COLORS.warning + '11' },
  deleteBtn: { borderColor: COLORS.error + '44', backgroundColor: COLORS.error + '11' },
  actionBtnText: { fontSize: FONT_SIZES.sm, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: COLORS.textMuted, marginTop: SPACING.md },
});
