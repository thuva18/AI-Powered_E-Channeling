// app/(admin)/reports.jsx
// Premium Admin Reports Dashboard

import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, RefreshControl, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

const fmtLKR = (n) => `LKR ${(n || 0).toLocaleString()}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function AdminReportsScreen() {
  const [tab, setTab] = useState('standard'); // 'standard' | 'advanced' | 'presets'

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics & Reports</Text>
        <Text style={styles.subtitle}>Performance Overview</Text>
      </View>

      <View style={styles.tabsRow}>
        {['standard', 'advanced', 'presets'].map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.content}>
        {tab === 'standard' && <StandardTab />}
        {tab === 'advanced' && <AdvancedTab />}
        {tab === 'presets' && <PresetsTab />}
      </View>
    </View>
  );
}

// -------------------------------------------------------------------------------------------------
// STANDARD TAB
function StandardTab() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const applyPreset = (preset) => {
    const now = new Date(); let from = new Date(), to = new Date();
    if (preset === 'last7') from.setDate(now.getDate() - 7);
    else if (preset === 'last30') from.setDate(now.getDate() - 30);
    else if (preset === 'thisMonth') from = new Date(now.getFullYear(), now.getMonth(), 1);
    
    setDateFrom(from.toISOString().split('T')[0]);
    setDateTo(to.toISOString().split('T')[0]);
  };

  const fetchData = useCallback(async () => {
    if (!dateFrom || !dateTo) return;
    setLoading(true);
    try {
      const res = await api.get('/admin/report-data', { params: { dateFrom, dateTo } });
      setData(res.data);
    } catch {
      Alert.alert('Error', 'Failed to fetch standard report data');
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Date Range</Text>
        <View style={styles.presetRow}>
          {[['last7', '7 Days'], ['last30', '30 Days'], ['thisMonth', 'This Month']].map(([k, l]) => (
            <TouchableOpacity key={k} style={styles.presetBtn} onPress={() => applyPreset(k)}>
              <Text style={styles.presetText}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.inputRow}>
          <View style={{ flex: 1, marginRight: SPACING.sm }}>
            <Text style={styles.label}>From (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} value={dateFrom} onChangeText={setDateFrom} placeholder="YYYY-MM-DD" placeholderTextColor={COLORS.textMuted} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>To (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} value={dateTo} onChangeText={setDateTo} placeholder="YYYY-MM-DD" placeholderTextColor={COLORS.textMuted} />
          </View>
        </View>
        <TouchableOpacity style={styles.actionBtn} onPress={fetchData} disabled={loading || !dateFrom || !dateTo}>
          {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.actionBtnText}>Generate Preview</Text>}
        </TouchableOpacity>
      </View>

      {data && (
        <View style={styles.dashboard}>
          {/* Appointments */}
          {data.appointments && (
            <View style={styles.widgetCard}>
              <Text style={styles.widgetTitle}>Appointments</Text>
              <View style={styles.statGrid}>
                <MiniStat label="Total" value={data.appointments.total} color={COLORS.primary} />
                <MiniStat label="Completed" value={data.appointments.completed} color={COLORS.success} />
                <MiniStat label="Pending" value={data.appointments.pending} color={COLORS.warning} />
                <MiniStat label="Cancelled" value={data.appointments.cancelled} color={COLORS.error} />
              </View>
            </View>
          )}
          {/* Payments */}
          {data.payments && (
            <View style={styles.widgetCard}>
              <Text style={styles.widgetTitle}>Financials</Text>
              <View style={styles.statGrid}>
                <MiniStat label="Revenue" value={fmtLKR(data.payments.totalRevenue)} color={COLORS.success} />
                <MiniStat label="Success" value={`${data.payments.successRate}%`} color={COLORS.primary} />
              </View>
              {data.payments.byMethod?.map(m => (
                <View key={m._id} style={styles.rowItem}>
                  <Text style={styles.rowLabel}>{m._id}</Text>
                  <Text style={styles.rowValue}>{fmtLKR(m.amount)}</Text>
                </View>
              ))}
            </View>
          )}
          {/* Doctors */}
          {data.doctorRevenue?.length > 0 && (
            <View style={styles.widgetCard}>
              <Text style={styles.widgetTitle}>Top Doctors</Text>
              {data.doctorRevenue.slice(0, 5).map(doc => (
                <View key={doc._id} style={styles.rowItem}>
                  <Text style={styles.rowLabel}>Dr. {doc.firstName}</Text>
                  <Text style={[styles.rowValue, { color: COLORS.primary }]}>{fmtLKR(doc.revenue)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

// -------------------------------------------------------------------------------------------------
// ADVANCED TAB
function AdvancedTab() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const applyPreset = (preset) => {
    const now = new Date(); let from = new Date(), to = new Date();
    if (preset === 'last7') from.setDate(now.getDate() - 7);
    else if (preset === 'last30') from.setDate(now.getDate() - 30);
    else if (preset === 'thisMonth') from = new Date(now.getFullYear(), now.getMonth(), 1);
    
    setDateFrom(from.toISOString().split('T')[0]);
    setDateTo(to.toISOString().split('T')[0]);
  };

  const fetchData = useCallback(async () => {
    if (!dateFrom || !dateTo) return;
    setLoading(true);
    try {
      const res = await api.get('/admin/advanced-report-data', { params: { dateFrom, dateTo } });
      setData(res.data);
    } catch {
      Alert.alert('Error', 'Failed to fetch advanced report data');
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Advanced Filters</Text>
        <View style={styles.presetRow}>
          {[['last7', '7 Days'], ['last30', '30 Days'], ['thisMonth', 'This Month']].map(([k, l]) => (
            <TouchableOpacity key={k} style={styles.presetBtn} onPress={() => applyPreset(k)}>
              <Text style={styles.presetText}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.inputRow}>
          <View style={{ flex: 1, marginRight: SPACING.sm }}>
            <Text style={styles.label}>From</Text>
            <TextInput style={styles.input} value={dateFrom} onChangeText={setDateFrom} placeholder="YYYY-MM-DD" placeholderTextColor={COLORS.textMuted} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>To</Text>
            <TextInput style={styles.input} value={dateTo} onChangeText={setDateTo} placeholder="YYYY-MM-DD" placeholderTextColor={COLORS.textMuted} />
          </View>
        </View>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.accent }]} onPress={fetchData} disabled={loading || !dateFrom || !dateTo}>
          {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.actionBtnText}>Analyze Peak Metrics</Text>}
        </TouchableOpacity>
      </View>

      {data && (
        <View style={styles.dashboard}>
           {/* Financial Summary */}
           {data.financial && (
            <View style={styles.widgetCard}>
              <Text style={styles.widgetTitle}>Financial Insight</Text>
              <View style={styles.statGrid}>
                <MiniStat label="Total Rev" value={fmtLKR(data.financial.total)} color={COLORS.success} />
                <MiniStat label="Avg Trx" value={fmtLKR(Math.round(data.financial.avg))} color={COLORS.primary} />
              </View>
            </View>
          )}
          {/* Cancellation */}
          {data.cancellation && (
            <View style={styles.widgetCard}>
              <Text style={styles.widgetTitle}>Cancellations</Text>
              <View style={styles.statGrid}>
                <MiniStat label="Total Cancelled" value={data.cancellation.total} color={COLORS.error} />
                <MiniStat label="Cancel. Rate" value={`${data.cancellation.rate}%`} color={COLORS.warning} />
              </View>
            </View>
          )}
          {/* Doctor Performance */}
          {data.doctorPerformance?.length > 0 && (
            <View style={styles.widgetCard}>
              <Text style={styles.widgetTitle}>Doctor Performance</Text>
              {data.doctorPerformance.slice(0, 5).map(doc => (
                <View key={doc._id} style={styles.rowItem}>
                  <Text style={styles.rowLabel}>Dr. {doc.name}</Text>
                  <Text style={[styles.rowValue, { color: COLORS.success }]}>{doc.completionRate}% Done</Text>
                </View>
              ))}
            </View>
          )}
          {/* Peak Hours */}
          {data.peakHours?.length > 0 && (
            <View style={styles.widgetCard}>
              <Text style={styles.widgetTitle}>Peak Hours</Text>
              {data.peakHours.slice(0, 5).map(h => (
                <View key={h.hour} style={styles.rowItem}>
                  <Text style={styles.rowLabel}>{h.displayLabel || h.label}</Text>
                  <Text style={[styles.rowValue, { color: COLORS.accent }]}>{h.count} Appts</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

// -------------------------------------------------------------------------------------------------
// PRESETS TAB (CRUD)
function PresetsTab() {
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [createPresetForm, setCreatePresetForm] = useState(null); // Local mock creation just for UI test or exact fetch? 

  const fetchPresets = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/presets');
      // Sort by recent
      setPresets(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch {
      Alert.alert('Error', 'Failed to load presets');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchPresets(); }, [fetchPresets]);
  const onRefresh = () => { setRefreshing(true); fetchPresets(); };

  const handleRename = async (preset) => {
    Alert.prompt(
      "Rename Preset",
      "Enter new preset name:",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Rename", 
          onPress: async (newName) => {
            if (!newName?.trim() || newName.trim() === preset.name) return;
            try {
              const res = await api.put(`/admin/presets/${preset._id}`, { name: newName.trim() });
              setPresets(prev => prev.map(p => p._id === preset._id ? res.data : p));
            } catch { Alert.alert('Error', 'Failed to rename preset'); }
          } 
        }
      ],
      "plain-text",
      preset.name
    );
  };

  const handleDelete = async (id) => {
    Alert.alert("Delete Preset", "Are you sure you want to delete this preset?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          try {
            await api.delete(`/admin/presets/${id}`);
            setPresets(prev => prev.filter(p => p._id !== id));
          } catch { Alert.alert('Error', 'Failed to delete preset'); }
      }}
    ])
  };

  return (
    <View style={{ flex: 1 }}>
       <View style={{ padding: SPACING.md }}>
         <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.textMuted, marginBottom: SPACING.sm }}>
           Presets allow you to quickly apply advanced filtering conditions to reports.
         </Text>
         <TouchableOpacity 
           style={[styles.actionBtn, { backgroundColor: COLORS.success, marginBottom: SPACING.sm }]}
           onPress={() => Alert.alert('Notice', 'To create a complex Preset, please use the Advanced Analytics view on the Desktop Dashboard.')}
         >
           <Text style={styles.actionBtnText}>+ Information on New Presets</Text>
         </TouchableOpacity>
       </View>

       {loading ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }}/> : (
         <FlatList
           data={presets}
           keyExtractor={(item) => item._id}
           refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
           contentContainerStyle={styles.scrollContent}
           ListEmptyComponent={<Text style={{ textAlign: 'center', color: COLORS.textMuted, marginTop: 40 }}>No presets found.</Text>}
           renderItem={({ item }) => (
             <View style={styles.presetCard}>
               <View style={{ flex: 1 }}>
                 <Text style={styles.presetCardName}>{item.name}</Text>
                 <Text style={styles.presetCardDate}>
                   {item.dateRange?.from} to {item.dateRange?.to}
                 </Text>
                 <Text style={styles.presetCardMeta}>Sections: {item.sections?.length || 0}</Text>
               </View>
               <View style={styles.presetActions}>
                 <TouchableOpacity style={[styles.iconBtn, { backgroundColor: `${COLORS.warning}22` }]} onPress={() => handleRename(item)}>
                   <Ionicons name="pencil" size={16} color={COLORS.warning} />
                 </TouchableOpacity>
                 <TouchableOpacity style={[styles.iconBtn, { backgroundColor: `${COLORS.error}22` }]} onPress={() => handleDelete(item._id)}>
                   <Ionicons name="trash" size={16} color={COLORS.error} />
                 </TouchableOpacity>
               </View>
             </View>
           )}
         />
       )}
    </View>
  );
}

// -------------------------------------------------------------------------------------------------
// REUSABLE COMPONENTS

function MiniStat({ label, value, color }) {
  return (
    <View style={[styles.miniStatBox, { backgroundColor: color + '11', borderColor: color + '33' }]}>
      <Text style={styles.miniStatLabel}>{label}</Text>
      <Text style={[styles.miniStatValue, { color }]}>{value}</Text>
    </View>
  );
}

// -------------------------------------------------------------------------------------------------
// STYLES

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.md,
    backgroundColor: COLORS.bgCard, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  title: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.textPrimary },
  subtitle: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  tabsRow: {
    flexDirection: 'row', padding: SPACING.md, backgroundColor: COLORS.bgCard,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  tabBtn: {
    flex: 1, paddingVertical: SPACING.sm, alignItems: 'center',
    borderRadius: RADIUS.md, marginHorizontal: 4, backgroundColor: COLORS.bg,
    borderWidth: 1, borderColor: COLORS.border,
  },
  tabBtnActive: { backgroundColor: COLORS.adminPrimary, borderColor: COLORS.adminPrimary },
  tabText: { fontSize: FONT_SIZES.xs, fontWeight: '600', color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.white },
  content: { flex: 1 },
  scrollContent: { padding: SPACING.md, paddingBottom: 100 },
  card: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: SPACING.lg,
    marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.textSecondary,
    textTransform: 'uppercase', marginBottom: SPACING.md,
  },
  presetRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  presetBtn: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md, backgroundColor: COLORS.bgInput, borderWidth: 1, borderColor: COLORS.border,
  },
  presetText: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, fontWeight: '600' },
  inputRow: { flexDirection: 'row', marginBottom: SPACING.md },
  label: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginBottom: 4, fontWeight: '600' },
  input: {
    backgroundColor: COLORS.bgInput, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.md, padding: SPACING.md, fontSize: FONT_SIZES.sm, color: COLORS.textPrimary,
  },
  actionBtn: {
    backgroundColor: COLORS.adminPrimary, borderRadius: RADIUS.md, height: 48,
    justifyContent: 'center', alignItems: 'center', ...SHADOWS.md,
  },
  actionBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZES.sm },
  dashboard: { gap: SPACING.md },
  widgetCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: SPACING.md,
    borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm,
  },
  widgetTitle: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.sm },
  miniStatBox: {
    flex: 1, minWidth: '45%', borderRadius: RADIUS.md, padding: SPACING.md,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  miniStatLabel: { fontSize: 10, textTransform: 'uppercase', fontWeight: '700', color: COLORS.textSecondary, marginBottom: 4 },
  miniStatValue: { fontSize: FONT_SIZES.lg, fontWeight: '800' },
  rowItem: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  rowLabel: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  rowValue: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.textPrimary },
  presetCard: {
    flexDirection: 'row', backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', ...SHADOWS.sm,
  },
  presetCardName: { fontSize: FONT_SIZES.base, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  presetCardDate: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginBottom: 4 },
  presetCardMeta: { fontSize: FONT_SIZES.xs, color: COLORS.adminPrimary, fontWeight: '600' },
  presetActions: { flexDirection: 'row', gap: SPACING.sm },
  iconBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
});
