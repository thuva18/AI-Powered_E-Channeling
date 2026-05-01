// app/(admin)/reports.jsx
// Premium Admin Reports Dashboard – theme aware

import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, RefreshControl, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import useTheme from '../../hooks/useTheme';
import { FONT_SIZES, SPACING, RADIUS } from '../../constants/theme';

const fmtLKR = (n) => `LKR ${(n || 0).toLocaleString()}`;

export default function AdminReportsScreen() {
  const { C, S, isDark } = useTheme();
  const [tab, setTab] = useState('standard');

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.md, backgroundColor: C.bgCard, borderBottomWidth: 1, borderBottomColor: C.border }}>
        <Text style={{ fontSize: FONT_SIZES.xl, fontWeight: '700', color: C.textPrimary }}>Analytics & Reports</Text>
        <Text style={{ fontSize: FONT_SIZES.sm, color: C.textSecondary, marginTop: 2 }}>Performance Overview</Text>
      </View>

      <View style={{ flexDirection: 'row', padding: SPACING.md, backgroundColor: C.bgCard, borderBottomWidth: 1, borderBottomColor: C.border }}>
        {['standard', 'advanced', 'presets'].map((t) => (
          <TouchableOpacity key={t} style={{
            flex: 1, paddingVertical: SPACING.sm, alignItems: 'center', borderRadius: RADIUS.md, marginHorizontal: 4,
            backgroundColor: tab === t ? C.adminPrimary : C.bg, borderWidth: 1,
            borderColor: tab === t ? C.adminPrimary : C.border,
          }} onPress={() => setTab(t)}>
            <Text style={{ fontSize: FONT_SIZES.xs, fontWeight: '600', color: tab === t ? C.white : C.textSecondary }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flex: 1 }}>
        {tab === 'standard' && <StandardTab />}
        {tab === 'advanced' && <AdvancedTab />}
        {tab === 'presets' && <PresetsTab />}
      </View>
    </View>
  );
}

function MiniStat({ label, value, color }) {
  const { C } = useTheme();
  return (
    <View style={{ flex: 1, minWidth: '45%', borderRadius: RADIUS.md, padding: SPACING.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: color + '11', borderColor: color + '33' }}>
      <Text style={{ fontSize: 10, textTransform: 'uppercase', fontWeight: '700', color: C.textSecondary, marginBottom: 4 }}>{label}</Text>
      <Text style={{ fontSize: FONT_SIZES.lg, fontWeight: '800', color }}>{value}</Text>
    </View>
  );
}

function StandardTab() {
  const { C, S, isDark } = useTheme();
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
    try { const res = await api.get('/admin/report-data', { params: { dateFrom, dateTo } }); setData(res.data); }
    catch { Alert.alert('Error', 'Failed to fetch standard report data'); }
    finally { setLoading(false); }
  }, [dateFrom, dateTo]);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: SPACING.md, paddingBottom: 100 }}>
      <View style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.lg, borderWidth: 1, borderColor: C.border, ...S.sm }}>
        <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: C.textSecondary, textTransform: 'uppercase', marginBottom: SPACING.md }}>Date Range</Text>
        <View style={{ flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md }}>
          {[['last7', '7 Days'], ['last30', '30 Days'], ['thisMonth', 'This Month']].map(([k, l]) => (
            <TouchableOpacity key={k} style={{ paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.md, backgroundColor: C.bgInput, borderWidth: 1, borderColor: C.border }}
              onPress={() => applyPreset(k)}>
              <Text style={{ fontSize: FONT_SIZES.xs, color: C.textSecondary, fontWeight: '600' }}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ flexDirection: 'row', marginBottom: SPACING.md }}>
          <View style={{ flex: 1, marginRight: SPACING.sm }}>
            <Text style={{ fontSize: FONT_SIZES.xs, color: C.textSecondary, marginBottom: 4, fontWeight: '600' }}>From (YYYY-MM-DD)</Text>
            <TextInput style={{ backgroundColor: C.bgInput, borderWidth: 1, borderColor: C.border, borderRadius: RADIUS.md, padding: SPACING.md, fontSize: FONT_SIZES.sm, color: C.textPrimary }}
              value={dateFrom} onChangeText={setDateFrom} placeholder="YYYY-MM-DD" placeholderTextColor={C.textMuted} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: FONT_SIZES.xs, color: C.textSecondary, marginBottom: 4, fontWeight: '600' }}>To (YYYY-MM-DD)</Text>
            <TextInput style={{ backgroundColor: C.bgInput, borderWidth: 1, borderColor: C.border, borderRadius: RADIUS.md, padding: SPACING.md, fontSize: FONT_SIZES.sm, color: C.textPrimary }}
              value={dateTo} onChangeText={setDateTo} placeholder="YYYY-MM-DD" placeholderTextColor={C.textMuted} />
          </View>
        </View>
        <TouchableOpacity style={{ backgroundColor: C.adminPrimary, borderRadius: RADIUS.md, height: 48, justifyContent: 'center', alignItems: 'center', ...S.md }}
          onPress={fetchData} disabled={loading || !dateFrom || !dateTo}>
          {loading ? <ActivityIndicator color={C.white} /> : <Text style={{ color: C.white, fontWeight: '700', fontSize: FONT_SIZES.sm }}>Generate Preview</Text>}
        </TouchableOpacity>
      </View>

      {data && (
        <View style={{ gap: SPACING.md }}>
          {data.appointments && (
            <View style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: C.border, ...S.sm }}>
              <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: C.textPrimary, marginBottom: SPACING.sm }}>Appointments</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.sm }}>
                <MiniStat label="Total" value={data.appointments.total} color={C.primary} />
                <MiniStat label="Completed" value={data.appointments.completed} color={C.success} />
                <MiniStat label="Pending" value={data.appointments.pending} color={C.warning} />
                <MiniStat label="Cancelled" value={data.appointments.cancelled} color={C.error} />
              </View>
            </View>
          )}
          {data.payments && (
            <View style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: C.border, ...S.sm }}>
              <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: C.textPrimary, marginBottom: SPACING.sm }}>Financials</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.sm }}>
                <MiniStat label="Revenue" value={fmtLKR(data.payments.totalRevenue)} color={C.success} />
                <MiniStat label="Success" value={`${data.payments.successRate}%`} color={C.primary} />
              </View>
              {data.payments.byMethod?.map(m => (
                <View key={m._id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: C.borderLight }}>
                  <Text style={{ fontSize: FONT_SIZES.sm, color: C.textSecondary }}>{m._id}</Text>
                  <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: C.textPrimary }}>{fmtLKR(m.amount)}</Text>
                </View>
              ))}
            </View>
          )}
          {data.doctorRevenue?.length > 0 && (
            <View style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: C.border, ...S.sm }}>
              <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: C.textPrimary, marginBottom: SPACING.sm }}>Top Doctors</Text>
              {data.doctorRevenue.slice(0, 5).map(doc => (
                <View key={doc._id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: C.borderLight }}>
                  <Text style={{ fontSize: FONT_SIZES.sm, color: C.textSecondary }}>Dr. {doc.firstName}</Text>
                  <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: C.primary }}>{fmtLKR(doc.revenue)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

function AdvancedTab() {
  const { C, S } = useTheme();
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
    try { const res = await api.get('/admin/advanced-report-data', { params: { dateFrom, dateTo } }); setData(res.data); }
    catch { Alert.alert('Error', 'Failed to fetch advanced report data'); }
    finally { setLoading(false); }
  }, [dateFrom, dateTo]);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: SPACING.md, paddingBottom: 100 }}>
      <View style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.lg, borderWidth: 1, borderColor: C.border, ...S.sm }}>
        <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: C.textSecondary, textTransform: 'uppercase', marginBottom: SPACING.md }}>Advanced Filters</Text>
        <View style={{ flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md }}>
          {[['last7', '7 Days'], ['last30', '30 Days'], ['thisMonth', 'This Month']].map(([k, l]) => (
            <TouchableOpacity key={k} style={{ paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.md, backgroundColor: C.bgInput, borderWidth: 1, borderColor: C.border }}
              onPress={() => applyPreset(k)}>
              <Text style={{ fontSize: FONT_SIZES.xs, color: C.textSecondary, fontWeight: '600' }}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ flexDirection: 'row', marginBottom: SPACING.md }}>
          <View style={{ flex: 1, marginRight: SPACING.sm }}>
            <Text style={{ fontSize: FONT_SIZES.xs, color: C.textSecondary, marginBottom: 4, fontWeight: '600' }}>From</Text>
            <TextInput style={{ backgroundColor: C.bgInput, borderWidth: 1, borderColor: C.border, borderRadius: RADIUS.md, padding: SPACING.md, fontSize: FONT_SIZES.sm, color: C.textPrimary }}
              value={dateFrom} onChangeText={setDateFrom} placeholder="YYYY-MM-DD" placeholderTextColor={C.textMuted} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: FONT_SIZES.xs, color: C.textSecondary, marginBottom: 4, fontWeight: '600' }}>To</Text>
            <TextInput style={{ backgroundColor: C.bgInput, borderWidth: 1, borderColor: C.border, borderRadius: RADIUS.md, padding: SPACING.md, fontSize: FONT_SIZES.sm, color: C.textPrimary }}
              value={dateTo} onChangeText={setDateTo} placeholder="YYYY-MM-DD" placeholderTextColor={C.textMuted} />
          </View>
        </View>
        <TouchableOpacity style={{ backgroundColor: C.accent, borderRadius: RADIUS.md, height: 48, justifyContent: 'center', alignItems: 'center', ...S.md }}
          onPress={fetchData} disabled={loading || !dateFrom || !dateTo}>
          {loading ? <ActivityIndicator color={C.white} /> : <Text style={{ color: C.white, fontWeight: '700', fontSize: FONT_SIZES.sm }}>Analyze Peak Metrics</Text>}
        </TouchableOpacity>
      </View>

      {data && (
        <View style={{ gap: SPACING.md }}>
          {data.financial && (
            <View style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: C.border, ...S.sm }}>
              <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: C.textPrimary, marginBottom: SPACING.sm }}>Financial Insight</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
                <MiniStat label="Total Rev" value={fmtLKR(data.financial.total)} color={C.success} />
                <MiniStat label="Avg Trx" value={fmtLKR(Math.round(data.financial.avg))} color={C.primary} />
              </View>
            </View>
          )}
          {data.cancellation && (
            <View style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: C.border, ...S.sm }}>
              <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: C.textPrimary, marginBottom: SPACING.sm }}>Cancellations</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
                <MiniStat label="Total Cancelled" value={data.cancellation.total} color={C.error} />
                <MiniStat label="Cancel. Rate" value={`${data.cancellation.rate}%`} color={C.warning} />
              </View>
            </View>
          )}
          {data.doctorPerformance?.length > 0 && (
            <View style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: C.border, ...S.sm }}>
              <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: C.textPrimary, marginBottom: SPACING.sm }}>Doctor Performance</Text>
              {data.doctorPerformance.slice(0, 5).map(doc => (
                <View key={doc._id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: C.borderLight }}>
                  <Text style={{ fontSize: FONT_SIZES.sm, color: C.textSecondary }}>Dr. {doc.name}</Text>
                  <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: C.success }}>{doc.completionRate}% Done</Text>
                </View>
              ))}
            </View>
          )}
          {data.peakHours?.length > 0 && (
            <View style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: C.border, ...S.sm }}>
              <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: C.textPrimary, marginBottom: SPACING.sm }}>Peak Hours</Text>
              {data.peakHours.slice(0, 5).map(h => (
                <View key={h.hour} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: C.borderLight }}>
                  <Text style={{ fontSize: FONT_SIZES.sm, color: C.textSecondary }}>{h.displayLabel || h.label}</Text>
                  <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: C.accent }}>{h.count} Appts</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

function PresetsTab() {
  const { C, S } = useTheme();
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPresets = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/presets');
      setPresets(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch { Alert.alert('Error', 'Failed to load presets'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchPresets(); }, [fetchPresets]);
  const onRefresh = () => { setRefreshing(true); fetchPresets(); };

  const handleRename = async (preset) => {
    Alert.prompt("Rename Preset", "Enter new preset name:", [
      { text: "Cancel", style: "cancel" },
      { text: "Rename", onPress: async (newName) => {
          if (!newName?.trim() || newName.trim() === preset.name) return;
          try { const res = await api.put(`/admin/presets/${preset._id}`, { name: newName.trim() }); setPresets(prev => prev.map(p => p._id === preset._id ? res.data : p)); }
          catch { Alert.alert('Error', 'Failed to rename preset'); }
        }
      }
    ], "plain-text", preset.name);
  };

  const handleDelete = async (id) => {
    Alert.alert("Delete Preset", "Are you sure you want to delete this preset?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          try { await api.delete(`/admin/presets/${id}`); setPresets(prev => prev.filter(p => p._id !== id)); }
          catch { Alert.alert('Error', 'Failed to delete preset'); }
      }}
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: SPACING.md }}>
        <Text style={{ fontSize: FONT_SIZES.sm, color: C.textMuted, marginBottom: SPACING.sm }}>
          Presets allow you to quickly apply advanced filtering conditions to reports.
        </Text>
        <TouchableOpacity style={{ backgroundColor: C.success, borderRadius: RADIUS.md, height: 48, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm, ...S.md }}
          onPress={() => Alert.alert('Notice', 'To create a complex Preset, please use the Advanced Analytics view on the Desktop Dashboard.')}>
          <Text style={{ color: C.white, fontWeight: '700', fontSize: FONT_SIZES.sm }}>+ Information on New Presets</Text>
        </TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator color={C.primary} style={{ marginTop: 20 }} /> : (
        <FlatList data={presets} keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
          contentContainerStyle={{ padding: SPACING.md, paddingBottom: 100 }}
          ListEmptyComponent={<Text style={{ textAlign: 'center', color: C.textMuted, marginTop: 40 }}>No presets found.</Text>}
          renderItem={({ item }) => (
            <View style={{ flexDirection: 'row', backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: C.border, alignItems: 'center', ...S.sm }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: FONT_SIZES.base, fontWeight: '700', color: C.textPrimary, marginBottom: 2 }}>{item.name}</Text>
                <Text style={{ fontSize: FONT_SIZES.xs, color: C.textSecondary, marginBottom: 4 }}>{item.dateRange?.from} to {item.dateRange?.to}</Text>
                <Text style={{ fontSize: FONT_SIZES.xs, color: C.adminPrimary, fontWeight: '600' }}>Sections: {item.sections?.length || 0}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                <TouchableOpacity style={{ width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', backgroundColor: `${C.warning}22` }}
                  onPress={() => handleRename(item)}>
                  <Ionicons name="pencil" size={16} color={C.warning} />
                </TouchableOpacity>
                <TouchableOpacity style={{ width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', backgroundColor: `${C.error}22` }}
                  onPress={() => handleDelete(item._id)}>
                  <Ionicons name="trash" size={16} color={C.error} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}
