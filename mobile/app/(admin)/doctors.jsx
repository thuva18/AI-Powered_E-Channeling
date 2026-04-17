// app/(admin)/doctors.jsx
// Admin Doctor Management – theme aware

import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import useTheme from '../../hooks/useTheme';
import { FONT_SIZES, SPACING, RADIUS } from '../../constants/theme';

export default function AdminDoctorsScreen() {
  const { C, S, isDark } = useTheme();
  const [doctors, setDoctors] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [filter, setFilter] = useState('all');
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

  const updateApproval = async (id, status) => {
    setProcessingId(id);
    try {
      await api.patch(`/admin/doctors/${id}/approve`, { approvalStatus: status });
      setDoctors((prev) => prev.map((d) => d._id === id ? { ...d, approvalStatus: status } : d));
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message ?? 'Action failed');
    } finally { setProcessingId(null); }
  };

  const deleteDoctor = (id, name) => {
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

  const statusConfig = {
    approved: { color: C.success, icon: 'checkmark-circle' },
    pending: { color: C.warning, icon: 'time-outline' },
    rejected: { color: C.error, icon: 'close-circle' },
  };

  const cardBg = isDark ? C.bgCard : C.bgCard;
  const cardBorder = isDark ? C.border : C.border;

  const renderItem = ({ item }) => {
    const cfg = statusConfig[item.approvalStatus] ?? { color: C.textMuted, icon: 'help-circle' };
    const isProcessing = processingId === item._id;
    return (
      <View style={{ backgroundColor: cardBg, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: cardBorder, ...S.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.md }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: C.bgElevated, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md }}>
            <Text style={{ fontSize: 22 }}>👨‍⚕️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: FONT_SIZES.base, fontWeight: '700', color: C.textPrimary }}>Dr. {item.name}</Text>
            {item.specialization && <Text style={{ fontSize: FONT_SIZES.sm, color: C.adminPrimary, marginTop: 2 }}>{item.specialization}</Text>}
            {item.hospital && <Text style={{ fontSize: FONT_SIZES.xs, color: C.textSecondary, marginTop: 2 }}>🏥 {item.hospital}</Text>}
            {item.email && <Text style={{ fontSize: FONT_SIZES.xs, color: C.textMuted, marginTop: 2 }}>✉️ {item.email}</Text>}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full, backgroundColor: cfg.color + '22' }}>
            <Ionicons name={cfg.icon} size={14} color={cfg.color} />
            <Text style={{ fontSize: FONT_SIZES.xs, fontWeight: '700', textTransform: 'capitalize', color: cfg.color }}> {item.approvalStatus}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
          {item.approvalStatus === 'pending' && (
            <>
              <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 1, borderColor: C.success + '44', backgroundColor: C.success + '11' }}
                onPress={() => updateApproval(item._id, 'approved')} disabled={isProcessing}>
                {isProcessing ? <ActivityIndicator size="small" color={C.success} /> : <><Ionicons name="checkmark" size={16} color={C.success} /><Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: C.success }}> Approve</Text></>}
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 1, borderColor: C.warning + '44', backgroundColor: C.warning + '11' }}
                onPress={() => updateApproval(item._id, 'rejected')} disabled={isProcessing}>
                <Ionicons name="close" size={16} color={C.warning} /><Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: C.warning }}> Reject</Text>
              </TouchableOpacity>
            </>
          )}
          {item.approvalStatus === 'rejected' && (
            <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 1, borderColor: C.success + '44', backgroundColor: C.success + '11' }}
              onPress={() => updateApproval(item._id, 'approved')} disabled={isProcessing}>
              <Ionicons name="checkmark" size={16} color={C.success} /><Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: C.success }}> Approve</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 1, borderColor: C.error + '44', backgroundColor: C.error + '11' }}
            onPress={() => deleteDoctor(item._id, item.name)} disabled={isProcessing}>
            <Ionicons name="trash-outline" size={16} color={C.error} /><Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: C.error }}> Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.md, backgroundColor: C.bgCard, borderBottomWidth: 1, borderBottomColor: C.border }}>
        <Text style={{ fontSize: FONT_SIZES.xl, fontWeight: '700', color: C.textPrimary }}>Manage Doctors</Text>
        <Text style={{ fontSize: FONT_SIZES.sm, color: C.textSecondary }}>{doctors.length} total | {doctors.filter((d) => d.approvalStatus === 'pending').length} pending</Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', margin: SPACING.lg, marginBottom: 0, backgroundColor: C.bgCard, borderRadius: RADIUS.md, borderWidth: 1, borderColor: C.border, paddingHorizontal: SPACING.md, height: 48 }}>
        <Ionicons name="search" size={18} color={C.textSecondary} style={{ marginRight: SPACING.sm }} />
        <TextInput style={{ flex: 1, color: C.textPrimary, fontSize: FONT_SIZES.base }} placeholder="Search doctors..." placeholderTextColor={C.textMuted} value={search} onChangeText={setSearch} />
      </View>

      <View style={{ flexDirection: 'row', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, gap: SPACING.sm }}>
        {['all', 'pending', 'approved', 'rejected'].map((f) => (
          <TouchableOpacity key={f} style={{
            paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.full,
            backgroundColor: filter === f ? C.adminPrimary : C.bgCard,
            borderWidth: 1, borderColor: filter === f ? C.adminPrimary : C.border,
          }} onPress={() => setFilter(f)}>
            <Text style={{ fontSize: FONT_SIZES.xs, fontWeight: '600', color: filter === f ? C.white : C.textSecondary }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? <ActivityIndicator color={C.adminPrimary} style={{ marginTop: 40 }} /> : (
        <FlatList data={filtered} keyExtractor={(item) => item._id} renderItem={renderItem}
          contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 80 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.adminPrimary} />}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Ionicons name="medical-outline" size={40} color={C.textMuted} />
              <Text style={{ color: C.textMuted, marginTop: SPACING.md }}>No doctors found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
