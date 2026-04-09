// app/(admin)/payments.jsx
// Mobile Admin Payments Screen

import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

export default function AdminPaymentsScreen() {
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
    } catch (e) {
      console.error('Failed fetching payments');
    } finally {
      setLoading(false); setRefreshing(false);
    }
  };

  useEffect(() => { fetchPayments(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchPayments(); };

  const getStatusColor = (status) => {
    if (status === 'COMPLETED') return COLORS.success;
    if (status === 'PENDING') return COLORS.warning;
    return COLORS.error;
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transactions</Text>
        <Text style={styles.headerSub}>Manage all system payments</Text>
      </View>

      <ScrollView 
        style={styles.scroll} contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.adminPrimary}/>}
      >
        <View style={styles.statsCard}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total Revenue</Text>
            <Text style={styles.statValue}>LKR {stats.total.toLocaleString()}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total TXNs</Text>
            <Text style={[styles.statValue, {color: COLORS.primary}]}>{stats.count}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        
        {loading ? <ActivityIndicator color={COLORS.adminPrimary} style={{marginTop: 40}} /> : (
            payments.length === 0 ? (
                <View style={styles.emptyWrap}>
                    <Ionicons name="receipt-outline" size={48} color={COLORS.textMuted} />
                    <Text style={styles.emptyText}>No transactions found</Text>
                </View>
            ) : (
                payments.map(p => (
                    <View key={p._id} style={styles.paymentCard}>
                        <View style={styles.pTop}>
                            <View>
                                <Text style={styles.pRef}>#{p.referenceId?.substring(0,8) || p._id.substring(0,8)}</Text>
                                <Text style={styles.pDate}>{new Date(p.createdAt).toLocaleDateString()}</Text>
                            </View>
                            <Text style={styles.pAmount}>LKR {p.amount}</Text>
                        </View>
                        <View style={styles.pBottom}>
                            <View style={[styles.badge, { backgroundColor: `${getStatusColor(p.status)}20` }]}>
                                <Text style={[styles.badgeText, { color: getStatusColor(p.status) }]}>{p.status}</Text>
                            </View>
                            <Text style={styles.pMethod}>{p.method || 'Online'}</Text>
                        </View>
                    </View>
                ))
            )
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: SPACING.lg, paddingTop: 60, paddingBottom: SPACING.lg, backgroundColor: 'rgba(19, 25, 41, 0.95)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)'},
  headerTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.textPrimary },
  headerSub: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 4 },
  scroll: { flex: 1 },
  content: { padding: SPACING.lg, paddingBottom: 100 },
  statsCard: { flexDirection: 'row', backgroundColor: 'rgba(28, 36, 56, 0.6)', borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  statBox: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, textTransform: 'uppercase', fontWeight: '700', marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: '900', color: COLORS.success },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  sectionTitle: { fontSize: FONT_SIZES.md, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.md },
  emptyWrap: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: COLORS.textMuted, marginTop: SPACING.md, fontWeight: '600' },
  paymentCard: { backgroundColor: 'rgba(28, 36, 56, 0.6)', borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', ...SHADOWS.sm },
  pTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.sm },
  pRef: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  pDate: { fontSize: 12, color: COLORS.textSecondary },
  pAmount: { fontSize: FONT_SIZES.md, fontWeight: '800', color: COLORS.textPrimary },
  pBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 10, fontWeight: '800' },
  pMethod: { fontSize: 12, fontWeight: '600', color: COLORS.adminPrimary }
});
