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
    // Backend returns UPPERCASE statuses: PENDING, APPROVED, REJECTED
    let data = filter === 'all'
      ? doctors
      : doctors.filter((d) => d.approvalStatus?.toUpperCase() === filter.toUpperCase());

    if (search) {
      const q = search.toLowerCase();
      const getName = (d) => `${d.firstName || ''} ${d.lastName || ''}`.toLowerCase();
      data = data.filter((d) =>
        getName(d).includes(q) ||
        d.specialization?.toLowerCase().includes(q) ||
        d.userId?.email?.toLowerCase().includes(q)
      );
    }
    setFiltered(data);
  }, [filter, search, doctors]);

  const updateApproval = async (id, status) => {
    setProcessingId(id);
    try {
      // Backend expects { status } not { approvalStatus }
      await api.patch(`/admin/doctors/${id}/approve`, { status });
      setDoctors((prev) =>
        prev.map((d) => d._id === id ? { ...d, approvalStatus: status } : d)
      );
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

  // Backend statuses are UPPERCASE
  const statusConfig = {
    APPROVED: { color: C.success, icon: 'checkmark-circle', label: 'Approved' },
    PENDING:  { color: C.warning, icon: 'time-outline',     label: 'Pending' },
    REJECTED: { color: C.error,   icon: 'close-circle',     label: 'Rejected' },
  };

  const renderItem = ({ item }) => {
    const status = item.approvalStatus?.toUpperCase() ?? 'PENDING';
    const cfg = statusConfig[status] ?? { color: C.textMuted, icon: 'help-circle', label: status };
    const isProcessing = processingId === item._id;
    const doctorName = `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Unknown';
    const email = item.userId?.email || item.email || '';

    return (
      <View style={{
        backgroundColor: C.bgCard,
        borderRadius: RADIUS.lg,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: C.border,
        ...S.sm,
      }}>
        {/* Doctor Info Row */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.md }}>
          <View style={{
            width: 48, height: 48, borderRadius: 24,
            backgroundColor: C.bgElevated,
            justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md,
          }}>
            <Text style={{ fontSize: 22 }}>👨‍⚕️</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: FONT_SIZES.base, fontWeight: '700', color: C.textPrimary }}>
              Dr. {doctorName}
            </Text>
            {item.specialization && (
              <Text style={{ fontSize: FONT_SIZES.sm, color: C.adminPrimary, marginTop: 2 }}>
                {item.specialization}
              </Text>
            )}
            {item.slmcNumber && (
              <Text style={{ fontSize: FONT_SIZES.xs, color: C.textSecondary, marginTop: 2 }}>
                🪪 SLMC: {item.slmcNumber}
              </Text>
            )}
            {email ? (
              <Text style={{ fontSize: FONT_SIZES.xs, color: C.textMuted, marginTop: 2 }}>
                ✉️ {email}
              </Text>
            ) : null}
          </View>

          {/* Status Badge */}
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            paddingHorizontal: SPACING.sm, paddingVertical: 4,
            borderRadius: RADIUS.full,
            backgroundColor: cfg.color + '22',
          }}>
            <Ionicons name={cfg.icon} size={14} color={cfg.color} />
            <Text style={{
              fontSize: FONT_SIZES.xs, fontWeight: '700',
              color: cfg.color, marginLeft: 3,
            }}>
              {cfg.label}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' }}>
          {/* PENDING: show Approve + Reject */}
          {status === 'PENDING' && (
            <>
              <TouchableOpacity
                style={{
                  flex: 1, flexDirection: 'row', alignItems: 'center',
                  justifyContent: 'center', paddingVertical: 10,
                  borderRadius: RADIUS.md, borderWidth: 1.5,
                  borderColor: C.success, backgroundColor: C.success + '18',
                  minWidth: 100,
                }}
                onPress={() => updateApproval(item._id, 'APPROVED')}
                disabled={isProcessing}
              >
                {isProcessing
                  ? <ActivityIndicator size="small" color={C.success} />
                  : <>
                      <Ionicons name="checkmark-circle" size={16} color={C.success} />
                      <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: C.success, marginLeft: 5 }}>
                        Approve
                      </Text>
                    </>
                }
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1, flexDirection: 'row', alignItems: 'center',
                  justifyContent: 'center', paddingVertical: 10,
                  borderRadius: RADIUS.md, borderWidth: 1.5,
                  borderColor: C.error, backgroundColor: C.error + '18',
                  minWidth: 100,
                }}
                onPress={() => updateApproval(item._id, 'REJECTED')}
                disabled={isProcessing}
              >
                <Ionicons name="close-circle" size={16} color={C.error} />
                <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: C.error, marginLeft: 5 }}>
                  Reject
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* REJECTED: show Re-Approve */}
          {status === 'REJECTED' && (
            <TouchableOpacity
              style={{
                flex: 1, flexDirection: 'row', alignItems: 'center',
                justifyContent: 'center', paddingVertical: 10,
                borderRadius: RADIUS.md, borderWidth: 1.5,
                borderColor: C.success, backgroundColor: C.success + '18',
              }}
              onPress={() => updateApproval(item._id, 'APPROVED')}
              disabled={isProcessing}
            >
              <Ionicons name="checkmark-circle" size={16} color={C.success} />
              <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: C.success, marginLeft: 5 }}>
                Approve
              </Text>
            </TouchableOpacity>
          )}

          {/* APPROVED: show Revoke */}
          {status === 'APPROVED' && (
            <TouchableOpacity
              style={{
                flex: 1, flexDirection: 'row', alignItems: 'center',
                justifyContent: 'center', paddingVertical: 10,
                borderRadius: RADIUS.md, borderWidth: 1.5,
                borderColor: C.warning, backgroundColor: C.warning + '18',
              }}
              onPress={() => updateApproval(item._id, 'REJECTED')}
              disabled={isProcessing}
            >
              <Ionicons name="ban-outline" size={16} color={C.warning} />
              <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: C.warning, marginLeft: 5 }}>
                Revoke
              </Text>
            </TouchableOpacity>
          )}

          {/* Delete — always visible */}
          <TouchableOpacity
            style={{
              flex: 1, flexDirection: 'row', alignItems: 'center',
              justifyContent: 'center', paddingVertical: 10,
              borderRadius: RADIUS.md, borderWidth: 1.5,
              borderColor: C.error, backgroundColor: C.error + '11',
            }}
            onPress={() => deleteDoctor(item._id, doctorName)}
            disabled={isProcessing}
          >
            <Ionicons name="trash-outline" size={16} color={C.error} />
            <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: C.error, marginLeft: 5 }}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View style={{
        paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.md,
        backgroundColor: C.bgCard, borderBottomWidth: 1, borderBottomColor: C.border,
      }}>
        <Text style={{ fontSize: FONT_SIZES.xl, fontWeight: '700', color: C.textPrimary }}>
          Manage Doctors
        </Text>
        <Text style={{ fontSize: FONT_SIZES.sm, color: C.textSecondary }}>
          {doctors.length} total | {doctors.filter((d) => d.approvalStatus?.toUpperCase() === 'PENDING').length} pending
        </Text>
      </View>

      {/* Search */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        margin: SPACING.lg, marginBottom: 0,
        backgroundColor: C.bgCard, borderRadius: RADIUS.md,
        borderWidth: 1, borderColor: C.border,
        paddingHorizontal: SPACING.md, height: 48,
      }}>
        <Ionicons name="search" size={18} color={C.textSecondary} style={{ marginRight: SPACING.sm }} />
        <TextInput
          style={{ flex: 1, color: C.textPrimary, fontSize: FONT_SIZES.base }}
          placeholder="Search by name, specialization..."
          placeholderTextColor={C.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={C.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter Pills */}
      <View style={{
        flexDirection: 'row', paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md, gap: SPACING.sm,
      }}>
        {['all', 'pending', 'approved', 'rejected'].map((f) => (
          <TouchableOpacity
            key={f}
            style={{
              paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs,
              borderRadius: RADIUS.full,
              backgroundColor: filter === f ? C.adminPrimary : C.bgCard,
              borderWidth: 1,
              borderColor: filter === f ? C.adminPrimary : C.border,
            }}
            onPress={() => setFilter(f)}
          >
            <Text style={{
              fontSize: FONT_SIZES.xs, fontWeight: '600',
              color: filter === f ? C.white : C.textSecondary,
            }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={C.adminPrimary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 80 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.adminPrimary} />
          }
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Ionicons name="medical-outline" size={40} color={C.textMuted} />
              <Text style={{ color: C.textMuted, marginTop: SPACING.md, fontSize: FONT_SIZES.base }}>
                No doctors found
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
