// app/(admin)/payments.jsx
// Mobile Admin Payments Screen – theme aware
// Supports Admin approval/rejection of pending transactions

import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import useTheme from '../../hooks/useTheme';
import { FONT_SIZES, SPACING, RADIUS } from '../../constants/theme';

export default function AdminPaymentsScreen() {
  const { C, S, isDark } = useTheme();
  const [payments, setPayments] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ total: 0, count: 0, pending: 0 });
  const [activeTab, setActiveTab] = useState('PENDING'); // PENDING or ALL
  
  // Reject Modal State
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPayments = async () => {
    try {
      const [allRes, pendingRes] = await Promise.all([
        api.get('/payments/admin/all'),
        api.get('/payments/admin/pending')
      ]);
      const data = allRes.data || [];
      const pendingData = pendingRes.data || [];
      setPayments(data);
      setPendingPayments(pendingData);
      
      const totalAmount = data.reduce((acc, p) => (p.status === 'SUCCESS' || p.status === 'APPROVED') ? acc + (p.amount || 0) : acc, 0);
      setStats({ total: totalAmount, count: data.length, pending: pendingData.length });
    } catch (e) { console.error('Failed fetching payments'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchPayments(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchPayments(); };

  const handleApprove = async (txnId) => {
    setActionLoading(true);
    try {
      await api.patch(`/payments/admin/${txnId}/approve`);
      Alert.alert('Success', 'Payment approved successfully!');
      fetchPayments();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Approval failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedTxn) return;
    setActionLoading(true);
    try {
      await api.patch(`/payments/admin/${selectedTxn._id}/reject`, { adminNote: rejectNote });
      Alert.alert('Success', 'Payment rejected.');
      setRejectModalVisible(false);
      setRejectNote('');
      setSelectedTxn(null);
      fetchPayments();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Rejection failed');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'COMPLETED' || status === 'SUCCESS' || status === 'APPROVED') return C.success;
    if (status === 'PENDING' || status === 'PENDING_APPROVAL') return C.warning;
    return C.error;
  };

  const cardBg = isDark ? 'rgba(28, 36, 56, 0.6)' : C.bgCard;
  const cardBorder = isDark ? C.cardInnerBorder : C.border;

  const currentData = activeTab === 'PENDING' ? pendingPayments : payments;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ paddingHorizontal: SPACING.lg, paddingTop: 60, paddingBottom: SPACING.lg, backgroundColor: isDark ? 'rgba(19, 25, 41, 0.95)' : C.bgCard, borderBottomWidth: 1, borderBottomColor: cardBorder }}>
        <Text style={{ fontSize: FONT_SIZES.xl, fontWeight: '800', color: C.textPrimary }}>Payment Management</Text>
        <Text style={{ fontSize: FONT_SIZES.sm, color: C.textSecondary, marginTop: 4 }}>Review and approve patient payments</Text>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', paddingHorizontal: SPACING.lg, marginTop: SPACING.md }}>
        <TouchableOpacity 
          style={{ flex: 1, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: activeTab === 'PENDING' ? C.primary : 'transparent', alignItems: 'center' }}
          onPress={() => setActiveTab('PENDING')}
        >
          <Text style={{ fontWeight: '700', color: activeTab === 'PENDING' ? C.primary : C.textSecondary }}>Pending ({stats.pending})</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={{ flex: 1, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: activeTab === 'ALL' ? C.primary : 'transparent', alignItems: 'center' }}
          onPress={() => setActiveTab('ALL')}
        >
          <Text style={{ fontWeight: '700', color: activeTab === 'ALL' ? C.primary : C.textSecondary }}>All ({stats.count})</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.adminPrimary} />}>

        {/* Stats Row */}
        <View style={{ flexDirection: 'row', backgroundColor: cardBg, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.xl, borderWidth: 1, borderColor: cardBorder }}>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: C.textSecondary, textTransform: 'uppercase', fontWeight: '700', marginBottom: 4 }}>Total Revenue</Text>
            <Text style={{ fontSize: 22, fontWeight: '900', color: C.success }}>LKR {stats.total.toLocaleString()}</Text>
          </View>
          <View style={{ width: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : C.border }} />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: C.textSecondary, textTransform: 'uppercase', fontWeight: '700', marginBottom: 4 }}>Total TXNs</Text>
            <Text style={{ fontSize: 22, fontWeight: '900', color: C.primary }}>{stats.count}</Text>
          </View>
        </View>

        {loading ? <ActivityIndicator color={C.adminPrimary} style={{ marginTop: 40 }} /> : (
          currentData.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Ionicons name={activeTab === 'PENDING' ? "checkmark-circle-outline" : "receipt-outline"} size={48} color={activeTab === 'PENDING' ? C.success : C.textMuted} />
              <Text style={{ color: activeTab === 'PENDING' ? C.success : C.textMuted, marginTop: SPACING.md, fontWeight: '600' }}>
                {activeTab === 'PENDING' ? 'All caught up! No pending payments.' : 'No transactions found'}
              </Text>
            </View>
          ) : (
            currentData.map(p => (
              <View key={p._id} style={{ backgroundColor: cardBg, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: cardBorder, ...S.sm }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.sm }}>
                  <View>
                    <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: C.textPrimary, marginBottom: 2 }}>{p.patientId?.email || 'Unknown Patient'}</Text>
                    <Text style={{ fontSize: 12, color: C.textSecondary }}>Ref: {p.paymentReference || p.referenceId?.substring(0, 8) || p._id.substring(0, 8)}</Text>
                    <Text style={{ fontSize: 11, color: C.textMuted }}>{new Date(p.createdAt).toLocaleString()}</Text>
                  </View>
                  <Text style={{ fontSize: FONT_SIZES.md, fontWeight: '800', color: C.textPrimary }}>LKR {p.amount}</Text>
                </View>
                
                {p.paymentNote && (
                  <Text style={{ fontSize: 12, color: C.textMuted, fontStyle: 'italic', marginBottom: SPACING.sm }}>Note: {p.paymentNote}</Text>
                )}
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: cardBorder }}>
                  <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: `${getStatusColor(p.status)}20` }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: getStatusColor(p.status) }}>{p.status.replace('_', ' ')}</Text>
                  </View>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: C.adminPrimary }}>{p.method || 'Online'}</Text>
                </View>

                {activeTab === 'PENDING' && p.status === 'PENDING_APPROVAL' && (
                  <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md }}>
                    <TouchableOpacity 
                      style={{ flex: 1, backgroundColor: C.success, padding: SPACING.sm, borderRadius: RADIUS.sm, alignItems: 'center' }}
                      onPress={() => handleApprove(p._id)}
                      disabled={actionLoading}
                    >
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: FONT_SIZES.sm }}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={{ flex: 1, backgroundColor: C.error, padding: SPACING.sm, borderRadius: RADIUS.sm, alignItems: 'center' }}
                      onPress={() => { setSelectedTxn(p); setRejectModalVisible(true); }}
                      disabled={actionLoading}
                    >
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: FONT_SIZES.sm }}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )
        )}
      </ScrollView>

      {/* Reject Modal */}
      <Modal visible={rejectModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: SPACING.lg }}>
          <View style={{ backgroundColor: cardBg, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: cardBorder }}>
            <Text style={{ fontSize: FONT_SIZES.lg, fontWeight: '800', color: C.textPrimary, marginBottom: SPACING.sm }}>Reject Payment</Text>
            <Text style={{ fontSize: FONT_SIZES.sm, color: C.textSecondary, marginBottom: SPACING.md }}>Ref: {selectedTxn?.paymentReference || selectedTxn?._id?.substring(0, 8)}</Text>
            
            <TextInput
              style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#f3f4f6', color: C.textPrimary, borderRadius: RADIUS.sm, padding: SPACING.md, height: 80, textAlignVertical: 'top', marginBottom: SPACING.lg }}
              placeholder="Reason for rejection (optional)"
              placeholderTextColor={C.textMuted}
              multiline
              value={rejectNote}
              onChangeText={setRejectNote}
            />

            <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
              <TouchableOpacity 
                style={{ flex: 1, padding: SPACING.sm, alignItems: 'center', borderWidth: 1, borderColor: C.border, borderRadius: RADIUS.sm }}
                onPress={() => { setRejectModalVisible(false); setSelectedTxn(null); setRejectNote(''); }}
              >
                <Text style={{ color: C.textPrimary, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={{ flex: 1, backgroundColor: C.error, padding: SPACING.sm, alignItems: 'center', borderRadius: RADIUS.sm }}
                onPress={handleReject}
                disabled={actionLoading}
              >
                {actionLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Reject</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
