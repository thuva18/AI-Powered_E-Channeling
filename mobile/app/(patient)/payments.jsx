// app/(patient)/payments.tsx
// Member 5 – Payments Module
// Patient payment history and receipt viewer

import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

// Types removed
export default function PatientPaymentsScreen() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await api.get('/payments/my-transactions');
      setTransactions(res.data || []);
    } catch {
      Alert.alert('Error', 'Failed to load payment history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchTransactions(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchTransactions(); };

  const statusConfig = {
    completed: { color: COLORS.success, icon: 'checkmark-circle' },
    pending: { color: COLORS.warning, icon: 'time-outline' },
    failed: { color: COLORS.error, icon: 'close-circle' },
    refunded: { color: COLORS.info, icon: 'refresh-circle' },
  };

  const totalSpent = transactions
    .filter((t) => t.status === 'completed')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const renderItem = ({ item }) => {
    const cfg = statusConfig[item.status] ?? { color: COLORS.textMuted, icon: 'help-circle' };
    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={[styles.iconBox, { backgroundColor: cfg.color + '22' }]}>
            <Ionicons name={cfg.icon} size={24} color={cfg.color} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.doctorName}>
              {item.appointment?.doctor?.name ? `Dr. ${item.appointment.doctor.name}` : 'Appointment Fee'}
            </Text>
            <Text style={styles.txDate}>{new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
            {item.transactionId && <Text style={styles.txId}>Ref: {item.transactionId}</Text>}
          </View>
          <View style={styles.amountCol}>
            <Text style={[styles.amount, { color: item.status === 'refunded' ? COLORS.info : COLORS.textPrimary }]}>
              {item.status === 'refunded' ? '+' : '-'} Rs. {item.amount?.toFixed(2) ?? '0.00'}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: cfg.color + '22' }]}>
              <Text style={[styles.statusText, { color: cfg.color }]}>{item.status}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Payment History</Text>
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Spent</Text>
          <Text style={styles.summaryValue}>Rs. {totalSpent.toFixed(2)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Transactions</Text>
          <Text style={styles.summaryValue}>{transactions.length}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Completed</Text>
          <Text style={[styles.summaryValue, { color: COLORS.success }]}>
            {transactions.filter((t) => t.status === 'completed').length}
          </Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="card-outline" size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No payment history yet</Text>
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
  summaryCard: {
    margin: SPACING.lg, backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg, padding: SPACING.lg,
    flexDirection: 'row', justifyContent: 'space-around',
    borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.md,
  },
  summaryItem: { alignItems: 'center' },
  summaryLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryValue: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textPrimary, marginTop: 4 },
  divider: { width: 1, backgroundColor: COLORS.border },
  list: { paddingHorizontal: SPACING.lg, paddingBottom: 80 },
  card: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, padding: SPACING.md,
    marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  iconBox: {
    width: 46, height: 46, borderRadius: 23,
    justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md,
  },
  cardInfo: { flex: 1 },
  doctorName: { fontSize: FONT_SIZES.base, fontWeight: '600', color: COLORS.textPrimary },
  txDate: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  txId: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 2 },
  amountCol: { alignItems: 'flex-end' },
  amount: { fontSize: FONT_SIZES.base, fontWeight: '700' },
  statusBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: RADIUS.full, marginTop: 4 },
  statusText: { fontSize: FONT_SIZES.xs, fontWeight: '600', textTransform: 'capitalize' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: COLORS.textMuted, marginTop: SPACING.md, fontSize: FONT_SIZES.base },
});
