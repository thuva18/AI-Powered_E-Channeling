// app/(patient)/payments.jsx
// Patient payment history with status filter tabs and receipt navigation
// Mirrors web PatientPaymentHistory.jsx feature-for-feature

import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl, ScrollView, Modal, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import useTheme from '../../hooks/useTheme';
import { FONT_SIZES, SPACING, RADIUS } from '../../constants/theme';

const STATUS_META = {
  SUCCESS: { label: 'Paid', icon: 'checkmark-circle', color: '#10B981' },
  APPROVED: { label: 'Approved', icon: 'checkmark-circle', color: '#10B981' },
  PENDING: { label: 'Pending', icon: 'time', color: '#F59E0B' },
  PENDING_APPROVAL: { label: 'Awaiting', icon: 'time', color: '#F59E0B' },
  FAILED: { label: 'Failed', icon: 'close-circle', color: '#EF4444' },
  REJECTED: { label: 'Rejected', icon: 'close-circle', color: '#EF4444' },
};

const METHOD_META = {
  PAYHERE: { label: 'PayHere', icon: '🏦' },
  BANK_TRANSFER: { label: 'Bank Transfer', icon: '🏛️' },
  PAYPAL: { label: 'PayPal', icon: '💳' },
};

const TABS = ['ALL', 'SUCCESS', 'APPROVED', 'PENDING_APPROVAL', 'FAILED', 'REJECTED'];
const TAB_LABELS = { ALL: 'All', SUCCESS: 'Paid', APPROVED: 'Approved', PENDING_APPROVAL: 'Pending', FAILED: 'Failed', REJECTED: 'Rejected' };

// ── Receipt Modal ─────────────────────────────────────────────────────────────
function ReceiptModal({ transactionId, onClose }) {
  const { C } = useTheme();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!transactionId) return;
    setLoading(true); setError('');
    api.get(`/payments/${transactionId}/receipt`)
      .then(({ data }) => setReceipt(data))
      .catch(e => setError(e.response?.data?.message || 'Failed to load receipt'))
      .finally(() => setLoading(false));
  }, [transactionId]);

  if (!transactionId) return null;
  const method = receipt ? (METHOD_META[receipt.payment?.method] || { label: receipt.payment?.method || '—', icon: '💰' }) : null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: C.bgCard, borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl, maxHeight: '92%' }}>
          {/* Header */}
          <View style={{ backgroundColor: C.primary, padding: SPACING.lg, borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl, alignItems: 'center' }}>
            <TouchableOpacity onPress={onClose} style={{ position: 'absolute', top: SPACING.md, right: SPACING.md, width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="close" size={16} color="#fff" />
            </TouchableOpacity>
            <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm }}>
              <Ionicons name="receipt" size={24} color="#fff" />
            </View>
            <Text style={{ fontSize: FONT_SIZES.lg, fontWeight: '800', color: '#fff' }}>Payment Receipt</Text>
            <Text style={{ fontSize: FONT_SIZES.xs, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>Medicare E-Channeling Portal</Text>
            {receipt?.receiptNumber && (
              <View style={{ marginTop: SPACING.sm, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: RADIUS.md }}>
                <Text style={{ fontSize: FONT_SIZES.xs, color: '#fff', fontWeight: '700', fontFamily: Platform?.OS === 'ios' ? 'Menlo' : 'monospace' }}>
                  {receipt.receiptNumber}
                </Text>
              </View>
            )}
          </View>

          {loading ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator color={C.primary} size="large" />
              <Text style={{ color: C.textMuted, marginTop: SPACING.md, fontSize: FONT_SIZES.sm }}>Loading receipt…</Text>
            </View>
          ) : error ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Ionicons name="receipt-outline" size={36} color={C.textMuted} />
              <Text style={{ color: C.textSecondary, fontWeight: '600', marginTop: SPACING.md }}>{error}</Text>
            </View>
          ) : receipt ? (
            <ScrollView style={{ padding: SPACING.lg }}>
              {/* Status banner */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: '#10B98118', padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.md }}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '600', color: '#10B981' }}>
                  Payment {receipt.payment?.status === 'SUCCESS' ? 'Successful' : 'Approved'}
                </Text>
                <Text style={{ marginLeft: 'auto', fontSize: FONT_SIZES.xs, color: '#10B981' }}>
                  {receipt.issuedAt ? new Date(receipt.issuedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                </Text>
              </View>

              {/* Patient & Doctor */}
              <View style={{ flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md }}>
                <View style={{ flex: 1, backgroundColor: C.bgElevated, borderRadius: RADIUS.md, padding: SPACING.md }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SPACING.sm }}>
                    <Ionicons name="person" size={12} color={C.primary} />
                    <Text style={{ fontSize: 10, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase' }}>Patient</Text>
                  </View>
                  <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: C.textPrimary }}>{receipt.patient?.name || 'N/A'}</Text>
                  <Text style={{ fontSize: FONT_SIZES.xs, color: C.textSecondary, marginTop: 2 }}>{receipt.patient?.email}</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: C.bgElevated, borderRadius: RADIUS.md, padding: SPACING.md }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SPACING.sm }}>
                    <Ionicons name="medical" size={12} color={C.primary} />
                    <Text style={{ fontSize: 10, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase' }}>Doctor</Text>
                  </View>
                  <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: C.textPrimary }}>{receipt.doctor?.name}</Text>
                  <Text style={{ fontSize: FONT_SIZES.xs, color: C.textSecondary, marginTop: 2 }}>{receipt.doctor?.specialization}</Text>
                </View>
              </View>

              {/* Appointment */}
              <View style={{ backgroundColor: C.bgElevated, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', marginBottom: SPACING.sm }}>Appointment Details</Text>
                <View style={{ flexDirection: 'row', gap: SPACING.lg }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="calendar" size={14} color={C.primary} />
                    <View>
                      <Text style={{ fontSize: 10, color: C.textMuted }}>Date</Text>
                      <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '600', color: C.textPrimary }}>
                        {receipt.appointment?.date ? new Date(receipt.appointment.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}
                      </Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="time" size={14} color={C.primary} />
                    <View>
                      <Text style={{ fontSize: 10, color: C.textMuted }}>Time Slot</Text>
                      <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '600', color: C.textPrimary }}>{receipt.appointment?.timeSlot || '—'}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Payment */}
              <View style={{ backgroundColor: C.bgElevated, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', marginBottom: SPACING.sm }}>Payment Details</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm }}>
                  <Text style={{ fontSize: FONT_SIZES.sm, color: C.textSecondary }}>Method</Text>
                  <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '600', color: C.textPrimary }}>{method?.icon} {method?.label}</Text>
                </View>
                {receipt.payment?.reference && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm }}>
                    <Text style={{ fontSize: FONT_SIZES.sm, color: C.textSecondary }}>Reference</Text>
                    <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '600', color: C.textPrimary }}>{receipt.payment.reference}</Text>
                  </View>
                )}
                <View style={{ borderTopWidth: 1, borderTopColor: C.border, paddingTop: SPACING.sm, marginTop: SPACING.xs }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: FONT_SIZES.base, fontWeight: '700', color: C.textPrimary }}>Total Paid</Text>
                    <Text style={{ fontSize: FONT_SIZES.lg, fontWeight: '800', color: C.primary }}>
                      LKR {receipt.payment?.amount?.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Security footer */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: SPACING.md }}>
                <Ionicons name="shield-checkmark" size={13} color="#10B981" />
                <Text style={{ fontSize: FONT_SIZES.xs, color: C.textMuted }}>Digitally generated receipt. No signature required.</Text>
              </View>
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

// ── Main Screen ──────────────────────────────────────────────────────────────
export default function PatientPaymentsScreen() {
  const { C, S } = useTheme();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL');
  const [receiptId, setReceiptId] = useState(null);

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await api.get('/payments/my-transactions');
      setTransactions(res.data || []);
    } catch {
      Alert.alert('Error', 'Failed to load payment history');
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchTransactions(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchTransactions(); };

  const filtered = activeTab === 'ALL' ? transactions : transactions.filter(t => t.status === activeTab);

  const totalPaid = transactions.filter(t => t.status === 'SUCCESS' || t.status === 'APPROVED').reduce((s, t) => s + (t.amount || 0), 0);
  const pendingCount = transactions.filter(t => t.status === 'PENDING_APPROVAL').length;
  const paidCount = transactions.filter(t => t.status === 'SUCCESS' || t.status === 'APPROVED').length;

  const canViewReceipt = (status) => status === 'SUCCESS' || status === 'APPROVED';

  const renderItem = ({ item }) => {
    const apt = item.appointmentId;
    const doctor = apt?.doctorId;
    const doctorName = doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : 'Doctor unavailable';
    const sm = STATUS_META[item.status] || STATUS_META.PENDING;
    const mm = METHOD_META[item.method] || { label: item.method || '—', icon: '💰' };

    return (
      <View style={{
        backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: SPACING.md,
        marginBottom: SPACING.sm, borderWidth: 1, borderColor: C.border, ...S.sm,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <View style={{
            width: 46, height: 46, borderRadius: 15,
            backgroundColor: sm.color + '22', justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md,
          }}>
            <Ionicons name={sm.icon} size={22} color={sm.color} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1, marginRight: SPACING.sm }}>
                <Text style={{ fontSize: FONT_SIZES.base, fontWeight: '700', color: C.textPrimary }}>{doctorName}</Text>
                <Text style={{ fontSize: FONT_SIZES.xs, color: C.textSecondary }}>{doctor?.specialization || 'Specialist'}</Text>
              </View>
              <Text style={{ fontSize: FONT_SIZES.base, fontWeight: '800', color: C.textPrimary }}>LKR {item.amount?.toLocaleString()}</Text>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: SPACING.sm }}>
              {apt?.appointmentDate && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="calendar" size={11} color={C.primary} />
                  <Text style={{ fontSize: FONT_SIZES.xs, color: C.textSecondary }}>
                    {new Date(apt.appointmentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
              )}
              <View style={{ backgroundColor: sm.color + '22', paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.full }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: sm.color }}>{sm.label}</Text>
              </View>
              <View style={{ backgroundColor: `${C.primary}15`, paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.full }}>
                <Text style={{ fontSize: 10, fontWeight: '600', color: C.primary }}>{mm.icon} {mm.label}</Text>
              </View>
            </View>

            {item.paymentReference && (
              <Text style={{ fontSize: FONT_SIZES.xs, color: C.textMuted, marginTop: 4 }}>Ref: {item.paymentReference}</Text>
            )}

            {canViewReceipt(item.status) && (
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: SPACING.sm }}
                onPress={() => setReceiptId(item._id)}>
                <Ionicons name="receipt" size={12} color={C.primary} />
                <Text style={{ fontSize: FONT_SIZES.xs, fontWeight: '700', color: C.primary }}>View Receipt</Text>
              </TouchableOpacity>
            )}

            {item.status === 'PENDING_APPROVAL' && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: SPACING.sm }}>
                <Ionicons name="alert-circle" size={11} color="#F59E0B" />
                <Text style={{ fontSize: FONT_SIZES.xs, color: '#F59E0B' }}>Awaiting admin verification (1-2 hours)</Text>
              </View>
            )}

            {item.status === 'REJECTED' && item.adminNote && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: SPACING.sm }}>
                <Ionicons name="close-circle" size={11} color="#EF4444" />
                <Text style={{ fontSize: FONT_SIZES.xs, color: '#EF4444' }}>{item.adminNote}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View style={{ paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.md, backgroundColor: C.bgCard, borderBottomWidth: 1, borderBottomColor: C.border }}>
        <Text style={{ fontSize: FONT_SIZES.xl, fontWeight: '700', color: C.textPrimary }}>Payment History</Text>
        <Text style={{ fontSize: FONT_SIZES.sm, color: C.textSecondary }}>Your consultation payment records</Text>
      </View>

      {/* Stats */}
      {!loading && transactions.length > 0 && (
        <View style={{
          margin: SPACING.md, flexDirection: 'row', gap: SPACING.sm,
        }}>
          <View style={{ flex: 1, backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: C.border, ...S.sm }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#10B98118', justifyContent: 'center', alignItems: 'center', marginBottom: 6 }}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
            </View>
            <Text style={{ fontSize: 10, color: C.textMuted }}>Total Paid</Text>
            <Text style={{ fontSize: FONT_SIZES.base, fontWeight: '800', color: '#10B981' }}>LKR {totalPaid.toLocaleString()}</Text>
            <Text style={{ fontSize: 10, color: C.textMuted }}>{paidCount} txns</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: C.border, ...S.sm }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#F59E0B18', justifyContent: 'center', alignItems: 'center', marginBottom: 6 }}>
              <Ionicons name="time" size={18} color="#F59E0B" />
            </View>
            <Text style={{ fontSize: 10, color: C.textMuted }}>Pending</Text>
            <Text style={{ fontSize: FONT_SIZES.base, fontWeight: '800', color: '#F59E0B' }}>{pendingCount}</Text>
            <Text style={{ fontSize: 10, color: C.textMuted }}>awaiting</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: C.border, ...S.sm }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${C.primary}18`, justifyContent: 'center', alignItems: 'center', marginBottom: 6 }}>
              <Ionicons name="bar-chart" size={18} color={C.primary} />
            </View>
            <Text style={{ fontSize: 10, color: C.textMuted }}>Total</Text>
            <Text style={{ fontSize: FONT_SIZES.base, fontWeight: '800', color: C.textPrimary }}>{transactions.length}</Text>
            <Text style={{ fontSize: 10, color: C.textMuted }}>all txns</Text>
          </View>
        </View>
      )}

      {/* Tab filter */}
      {!loading && transactions.length > 0 && (
        <View style={{ marginBottom: SPACING.md }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: SPACING.md, gap: 8, paddingVertical: 4 }}>
          {TABS.map(t => {
            const count = t === 'ALL' ? transactions.length : transactions.filter(tx => tx.status === t).length;
            const active = activeTab === t;
            return (
              <TouchableOpacity key={t} onPress={() => setActiveTab(t)} style={{
                flexDirection: 'row', alignItems: 'center', gap: 6,
                paddingHorizontal: SPACING.md, paddingVertical: 7, borderRadius: RADIUS.full,
                backgroundColor: active ? C.primary : C.bgCard,
                borderWidth: 1, borderColor: active ? C.primary : C.border,
              }}>
                <Text style={{ fontSize: FONT_SIZES.xs, fontWeight: '700', color: active ? '#fff' : C.textSecondary }}>
                  {TAB_LABELS[t]}
                </Text>
                <View style={{ backgroundColor: active ? 'rgba(255,255,255,0.25)' : C.bgElevated, paddingHorizontal: 6, paddingVertical: 1, borderRadius: RADIUS.full }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: active ? '#fff' : C.textMuted }}>{count}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
          </ScrollView>
        </View>
      )}

      {/* Content */}
      {loading ? (
        <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: SPACING.md, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Ionicons name="card-outline" size={40} color={C.textMuted} />
              <Text style={{ color: C.textSecondary, fontWeight: '600', marginTop: SPACING.md }}>
                {activeTab !== 'ALL' ? 'No transactions in this category' : 'No payment records yet'}
              </Text>
              {activeTab === 'ALL' && (
                <Text style={{ color: C.textMuted, fontSize: FONT_SIZES.sm, marginTop: 4 }}>
                  Book an appointment to see payment records here
                </Text>
              )}
            </View>
          }
        />
      )}

      {/* Receipt Modal */}
      <ReceiptModal transactionId={receiptId} onClose={() => setReceiptId(null)} />
    </View>
  );
}
