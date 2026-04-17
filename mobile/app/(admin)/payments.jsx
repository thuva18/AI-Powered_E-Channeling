// app/(admin)/payments.jsx
// Mobile Admin Payments Screen – theme aware

import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import useTheme from '../../hooks/useTheme';
import { FONT_SIZES, SPACING, RADIUS } from '../../constants/theme';

export default function AdminPaymentsScreen() {
  const { C, S, isDark } = useTheme();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ total: 0, count: 0, pending: 0 });

  const fetchPayments = async () => {
    try {
      const { data } = await api.get('/payments/admin/all');
      setPayments(data || []);
      const totalAmount = data.reduce((acc, p) => p.status === 'COMPLETED' ? acc + p.amount : acc, 0);
      const pendingCount = data.filter(p => p.status === 'PENDING').length;
      setStats({ total: totalAmount, count: data.length, pending: pendingCount });
    } catch (e) { console.error('Failed fetching payments'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchPayments(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchPayments(); };

  const getStatusColor = (status) => {
    if (status === 'COMPLETED') return C.success;
    if (status === 'PENDING') return C.warning;
    return C.error;
  };

  const cardBg = isDark ? 'rgba(28, 36, 56, 0.6)' : C.bgCard;
  const cardBorder = isDark ? C.cardInnerBorder : C.border;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ paddingHorizontal: SPACING.lg, paddingTop: 60, paddingBottom: SPACING.lg, backgroundColor: isDark ? 'rgba(19, 25, 41, 0.95)' : C.bgCard, borderBottomWidth: 1, borderBottomColor: cardBorder }}>
        <Text style={{ fontSize: FONT_SIZES.xl, fontWeight: '800', color: C.textPrimary }}>Transactions</Text>
        <Text style={{ fontSize: FONT_SIZES.sm, color: C.textSecondary, marginTop: 4 }}>Manage all system payments</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.adminPrimary} />}>

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

        <Text style={{ fontSize: FONT_SIZES.md, fontWeight: '800', color: C.textPrimary, marginBottom: SPACING.md }}>Recent Transactions</Text>

        {loading ? <ActivityIndicator color={C.adminPrimary} style={{ marginTop: 40 }} /> : (
          payments.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Ionicons name="receipt-outline" size={48} color={C.textMuted} />
              <Text style={{ color: C.textMuted, marginTop: SPACING.md, fontWeight: '600' }}>No transactions found</Text>
            </View>
          ) : (
            payments.map(p => (
              <View key={p._id} style={{ backgroundColor: cardBg, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: cardBorder, ...S.sm }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.sm }}>
                  <View>
                    <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: C.textPrimary, marginBottom: 2 }}>#{p.referenceId?.substring(0, 8) || p._id.substring(0, 8)}</Text>
                    <Text style={{ fontSize: 12, color: C.textSecondary }}>{new Date(p.createdAt).toLocaleDateString()}</Text>
                  </View>
                  <Text style={{ fontSize: FONT_SIZES.md, fontWeight: '800', color: C.textPrimary }}>LKR {p.amount}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: cardBorder }}>
                  <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: `${getStatusColor(p.status)}20` }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: getStatusColor(p.status) }}>{p.status}</Text>
                  </View>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: C.adminPrimary }}>{p.method || 'Online'}</Text>
                </View>
              </View>
            ))
          )
        )}
      </ScrollView>
    </View>
  );
}
