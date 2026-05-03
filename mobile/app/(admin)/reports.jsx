// app/(admin)/reports.jsx
// Premium Admin Reports Dashboard – theme aware

import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, RefreshControl, FlatList, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import useTheme from '../../hooks/useTheme';
import { FONT_SIZES, SPACING, RADIUS } from '../../constants/theme';

const fmtLKR = (n) => `LKR ${(n || 0).toLocaleString()}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : '—';
const fmtDateTime = (d) => d ? new Date(d).toLocaleString() : '—';

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
        {['standard', 'advanced', 'saved'].map((t) => (
          <TouchableOpacity key={t} style={{
            flex: 1, paddingVertical: SPACING.sm, alignItems: 'center', borderRadius: RADIUS.md, marginHorizontal: 4,
            backgroundColor: tab === t ? C.adminPrimary : C.bg, borderWidth: 1,
            borderColor: tab === t ? C.adminPrimary : C.border,
          }} onPress={() => setTab(t)}>
            <Text style={{ fontSize: FONT_SIZES.xs, fontWeight: '600', color: tab === t ? C.white : C.textSecondary }}>
              {t === 'saved' ? 'Saved Reports' : t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flex: 1 }}>
        {tab === 'standard' && <StandardTab />}
        {tab === 'advanced' && <AdvancedTab />}
        {tab === 'saved' && <SavedTab />}
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

function SectionCheck({ label, desc, checked, onChange, color }) {
  const { C } = useTheme();
  return (
    <TouchableOpacity onPress={onChange} style={{ flexDirection: 'row', alignItems: 'flex-start', padding: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: checked ? color : C.border, backgroundColor: checked ? color + '11' : C.bgCard, marginBottom: SPACING.sm }}>
      <View style={{ width: 18, height: 18, borderRadius: 4, borderWidth: 2, borderColor: checked ? color : C.textMuted, marginRight: SPACING.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: checked ? color : 'transparent', marginTop: 2 }}>
        {checked && <Ionicons name="checkmark" size={14} color="#FFF" />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '600', color: C.textPrimary }}>{label}</Text>
        <Text style={{ fontSize: FONT_SIZES.xs, color: C.textSecondary, marginTop: 2 }}>{desc}</Text>
      </View>
    </TouchableOpacity>
  );
}

function StandardTab() {
  const { C, S } = useTheme();
  const [reportName, setReportName] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const applyPreset = (preset) => {
    const now = new Date(); let from = new Date(), to = new Date();
    if (preset === 'last7') from.setDate(now.getDate() - 7);
    else if (preset === 'last30') from.setDate(now.getDate() - 30);
    else if (preset === 'thisMonth') from = new Date(now.getFullYear(), now.getMonth(), 1);
    else if (preset === 'lastMonth') { from = new Date(now.getFullYear(), now.getMonth() - 1, 1); to = new Date(now.getFullYear(), now.getMonth(), 0); }
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

  const handleSave = async () => {
    if (!dateFrom || !dateTo || !reportName.trim() || !data) { Alert.alert('Error', 'Fill name, date range and generate preview first'); return; }
    setSaving(true);
    try {
      await api.post('/admin/saved-reports', {
        name: reportName.trim(), type: 'standard', dateFrom, dateTo,
        sections: { appointmentSummary: true, doctorRevenue: true, paymentDetails: true }, data
      });
      Alert.alert('Success', 'Report saved successfully!');
      setReportName('');
    } catch { Alert.alert('Error', 'Failed to save report'); }
    finally { setSaving(false); }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: SPACING.md, paddingBottom: 100 }}>
      <View style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.lg, borderWidth: 1, borderColor: C.border, ...S.sm }}>
        <Text style={{ fontSize: FONT_SIZES.xs, fontWeight: '700', color: C.textSecondary, textTransform: 'uppercase', marginBottom: 4 }}>Report Name *</Text>
        <TextInput style={{ backgroundColor: C.bgInput, borderWidth: 1, borderColor: C.border, borderRadius: RADIUS.md, padding: SPACING.md, fontSize: FONT_SIZES.sm, color: C.textPrimary, marginBottom: SPACING.md }}
          value={reportName} onChangeText={setReportName} placeholder="e.g. Monthly Revenue Report" placeholderTextColor={C.textMuted} />
        
        <Text style={{ fontSize: FONT_SIZES.xs, fontWeight: '700', color: C.textSecondary, textTransform: 'uppercase', marginBottom: SPACING.md }}>Date Range</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md }}>
          {[['last7', '7 Days'], ['last30', '30 Days'], ['thisMonth', 'This Month'], ['lastMonth', 'Last Month']].map(([k, l]) => (
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

        <TouchableOpacity style={{ backgroundColor: C.adminPrimary, borderRadius: RADIUS.md, height: 48, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm, ...S.md }}
          onPress={fetchData} disabled={loading || !dateFrom || !dateTo}>
          {loading ? <ActivityIndicator color={C.white} /> : <Text style={{ color: C.white, fontWeight: '700', fontSize: FONT_SIZES.sm }}>Generate Preview</Text>}
        </TouchableOpacity>
        
        <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
          <TouchableOpacity style={{ flex: 1, backgroundColor: C.success, borderRadius: RADIUS.md, height: 48, justifyContent: 'center', alignItems: 'center', opacity: (!data || !reportName.trim() || saving) ? 0.5 : 1 }}
            onPress={handleSave} disabled={!data || !reportName.trim() || saving}>
            {saving ? <ActivityIndicator color={C.white} /> : <Text style={{ color: C.white, fontWeight: '700', fontSize: FONT_SIZES.sm }}>Save Report</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={{ flex: 1, backgroundColor: C.warning, borderRadius: RADIUS.md, height: 48, justifyContent: 'center', alignItems: 'center', opacity: (!data) ? 0.5 : 1 }}
            onPress={() => Alert.alert('Not Supported', 'PDF export is coming soon to the mobile app. Please use the desktop dashboard.')} disabled={!data}>
            <Text style={{ color: C.white, fontWeight: '700', fontSize: FONT_SIZES.sm }}>Export PDF</Text>
          </TouchableOpacity>
        </View>
      </View>

      {data && data.message ? (
        <View style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: SPACING.lg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border, marginBottom: SPACING.md }}>
          <Ionicons name="information-circle-outline" size={32} color={C.textSecondary} style={{ marginBottom: SPACING.sm }} />
          <Text style={{ fontSize: FONT_SIZES.sm, color: C.textSecondary, textAlign: 'center' }}>{data.message}</Text>
        </View>
      ) : data && (
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

const DEFAULT_ADVANCED_SECTIONS = { appointmentSummary: true, doctorPerformance: true, cancellationAnalysis: true, financialSummary: true, peakHours: true };

function AdvancedTab() {
  const { C, S } = useTheme();
  const [reportName, setReportName] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [advSections, setAdvSections] = useState(DEFAULT_ADVANCED_SECTIONS);
  const [selectedDoctors, setSelectedDoctors] = useState([]);
  const [doctorDropOpen, setDoctorDropOpen] = useState(false);
  const [allDoctors, setAllDoctors] = useState([]);
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [presets, setPresets] = useState([]);
  const [presetLoading, setPresetLoading] = useState(false);
  const [presetModalVisible, setPresetModalVisible] = useState(false);
  const [presetNameInput, setPresetNameInput] = useState('');

  const loadPresets = useCallback(async () => {
    setPresetLoading(true);
    try { const { data: list } = await api.get('/admin/presets'); setPresets(list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))); }
    catch { } finally { setPresetLoading(false); }
  }, []);

  const loadDoctors = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/doctors');
      if (data && Array.isArray(data)) {
        setAllDoctors(data.filter(d => d.approvalStatus === 'APPROVED'));
      }
    } catch (err) {
      console.log('Failed to fetch doctors', err);
    }
  }, []);

  useEffect(() => { 
    loadPresets(); 
    loadDoctors();
  }, [loadPresets, loadDoctors]);

  const applyPresetDate = (preset) => {
    const now = new Date(); let from = new Date(), to = new Date();
    if (preset === 'last7') from.setDate(now.getDate() - 7);
    else if (preset === 'last30') from.setDate(now.getDate() - 30);
    else if (preset === 'thisMonth') from = new Date(now.getFullYear(), now.getMonth(), 1);
    else if (preset === 'lastMonth') { from = new Date(now.getFullYear(), now.getMonth() - 1, 1); to = new Date(now.getFullYear(), now.getMonth(), 0); }
    setDateFrom(from.toISOString().split('T')[0]);
    setDateTo(to.toISOString().split('T')[0]);
  };

  const fetchData = useCallback(async (from = dateFrom, to = dateTo, docs = selectedDoctors) => {
    if (!from || !to) return;
    setLoading(true);
    try {
      const params = { dateFrom: from, dateTo: to };
      if (docs.length) params.doctorIds = docs.join(',');
      const res = await api.get('/admin/advanced-report-data', { params });
      setData(res.data);
      if (res.data.allDoctors?.length) setAllDoctors(res.data.allDoctors);
    }
    catch { Alert.alert('Error', 'Failed to fetch advanced report data'); }
    finally { setLoading(false); }
  }, [dateFrom, dateTo, selectedDoctors]);

  const handleSave = async () => {
    if (!dateFrom || !dateTo || !reportName.trim() || !data) { Alert.alert('Error', 'Fill name, dates and generate first'); return; }
    setSaving(true);
    try {
      await api.post('/admin/saved-reports', {
        name: reportName.trim(), type: 'advanced', dateFrom, dateTo, advSections, filters: { doctorIds: selectedDoctors }, data
      });
      Alert.alert('Success', 'Advanced report saved successfully!');
      setReportName('');
    } catch { Alert.alert('Error', 'Failed to save report'); }
    finally { setSaving(false); }
  };

  const handleSaveAsPreset = async () => {
    if (!dateFrom || !dateTo) { Alert.alert('Error', 'Please select date range before saving preset.'); return; }
    setPresetNameInput('');
    setPresetModalVisible(true);
  };

  const confirmSavePreset = async () => {
    if (!presetNameInput.trim()) return;
    try {
      const payload = {
        name: presetNameInput.trim(), reportName: reportName.trim(),
        dateRange: { from: dateFrom, to: dateTo },
        sections: Object.keys(advSections).filter(k => advSections[k]),
        doctors: selectedDoctors, filters: { doctorIds: selectedDoctors }
      };
      const res = await api.post('/admin/presets', payload);
      setPresets(prev => [res.data, ...prev].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setPresetModalVisible(false);
      setPresetNameInput('');
      Alert.alert('Success', 'Preset saved!');
    } catch { Alert.alert('Error', 'Failed to save preset'); }
  };

  const applySavedPreset = async (preset) => {
    const from = preset?.dateRange?.from || '';
    const to = preset?.dateRange?.to || '';
    if (!from || !to) return;
    setReportName(preset.reportName || '');
    setDateFrom(from); setDateTo(to);
    const docs = Array.isArray(preset.doctors) ? preset.doctors : [];
    setSelectedDoctors(docs);
    const nextSections = { ...DEFAULT_ADVANCED_SECTIONS };
    if (preset.sections) {
      Object.keys(nextSections).forEach(k => nextSections[k] = preset.sections.includes(k));
    }
    setAdvSections(nextSections);
    setData(null);
    await fetchData(from, to, docs);
  };

  const deletePreset = async (id) => {
    Alert.alert("Delete", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try { await api.delete(`/admin/presets/${id}`); setPresets(prev => prev.filter(p => p._id !== id)); }
        catch { Alert.alert('Error', 'Failed to delete preset'); }
      }}
    ]);
  };

  const toggleDoc = id => setSelectedDoctors(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const ADVSECTIONS = [
    { key: 'appointmentSummary', label: 'Appointment Summary', desc: 'Status breakdown & top specializations', color: C.primary },
    { key: 'doctorPerformance', label: 'Doctor Performance', desc: 'Completion rate, cancellation rate', color: C.accent },
    { key: 'cancellationAnalysis', label: 'Cancellation Analysis', desc: 'Cancel rate, by day & doctor', color: C.error },
    { key: 'financialSummary', label: 'Financial Summary', desc: 'Revenue, avg transaction', color: C.success },
    { key: 'peakHours', label: 'Peak Hours', desc: 'Busiest appointment time slots', color: C.warning },
  ];

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: SPACING.md, paddingBottom: 100 }}>
      <Modal visible={presetModalVisible} animationType="fade" transparent={true} onRequestClose={() => setPresetModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: SPACING.lg }}>
          <View style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: SPACING.lg, width: '100%', maxWidth: 400 }}>
            <Text style={{ fontSize: FONT_SIZES.lg, fontWeight: '700', color: C.textPrimary, marginBottom: SPACING.sm }}>Save Preset</Text>
            <Text style={{ fontSize: FONT_SIZES.sm, color: C.textSecondary, marginBottom: SPACING.md }}>Enter a name for this preset configuration.</Text>
            <TextInput
              style={{ backgroundColor: C.bgInput, borderWidth: 1, borderColor: C.border, borderRadius: RADIUS.md, padding: SPACING.md, fontSize: FONT_SIZES.sm, color: C.textPrimary, marginBottom: SPACING.lg }}
              value={presetNameInput} onChangeText={setPresetNameInput} placeholder="Preset Name" placeholderTextColor={C.textMuted} autoFocus
            />
            <View style={{ flexDirection: 'row', gap: SPACING.sm, justifyContent: 'flex-end' }}>
              <TouchableOpacity onPress={() => setPresetModalVisible(false)} style={{ paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, borderRadius: RADIUS.md }}>
                <Text style={{ color: C.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmSavePreset} style={{ backgroundColor: C.primary, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, borderRadius: RADIUS.md }}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Config Form */}
      <View style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.lg, borderWidth: 1, borderColor: C.border, ...S.sm }}>
        <Text style={{ fontSize: FONT_SIZES.xs, fontWeight: '700', color: C.textSecondary, textTransform: 'uppercase', marginBottom: 4 }}>Report Name *</Text>
        <TextInput style={{ backgroundColor: C.bgInput, borderWidth: 1, borderColor: C.border, borderRadius: RADIUS.md, padding: SPACING.md, fontSize: FONT_SIZES.sm, color: C.textPrimary, marginBottom: SPACING.md }}
          value={reportName} onChangeText={setReportName} placeholder="e.g. Q1 Performance Report" placeholderTextColor={C.textMuted} />
        
        <Text style={{ fontSize: FONT_SIZES.xs, fontWeight: '700', color: C.textSecondary, textTransform: 'uppercase', marginBottom: SPACING.md }}>Date Range</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md }}>
          {[['last7', '7 Days'], ['last30', '30 Days'], ['thisMonth', 'This Month'], ['lastMonth', 'Last Month']].map(([k, l]) => (
            <TouchableOpacity key={k} style={{ paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.md, backgroundColor: C.bgInput, borderWidth: 1, borderColor: C.border }}
              onPress={() => applyPresetDate(k)}>
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

        {/* Doctor Filter */}
        <Text style={{ fontSize: FONT_SIZES.xs, fontWeight: '700', color: C.textSecondary, textTransform: 'uppercase', marginBottom: SPACING.sm }}>Doctor Filter</Text>
        <TouchableOpacity style={{ backgroundColor: C.bgInput, borderWidth: 1, borderColor: C.border, borderRadius: RADIUS.md, padding: SPACING.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md }}
          onPress={() => setDoctorDropOpen(!doctorDropOpen)}>
          <Text style={{ color: selectedDoctors.length ? C.textPrimary : C.textSecondary }}>{selectedDoctors.length ? `${selectedDoctors.length} selected` : 'All doctors'}</Text>
          <Ionicons name={doctorDropOpen ? "chevron-up" : "chevron-down"} size={20} color={C.textSecondary} />
        </TouchableOpacity>
        {doctorDropOpen && (
          <View style={{ backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: RADIUS.md, padding: SPACING.sm, marginBottom: SPACING.md, maxHeight: 200 }}>
            <ScrollView nestedScrollEnabled>
              {allDoctors.length === 0 ? <Text style={{ padding: SPACING.sm, color: C.textMuted }}>No approved doctors found.</Text> : 
                allDoctors.map(doc => (
                  <TouchableOpacity key={doc._id} onPress={() => toggleDoc(doc._id)} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: C.borderLight }}>
                    <Ionicons name={selectedDoctors.includes(doc._id) ? "checkbox" : "square-outline"} size={20} color={selectedDoctors.includes(doc._id) ? C.primary : C.textSecondary} style={{ marginRight: SPACING.sm }} />
                    <Text style={{ color: C.textPrimary }}>Dr. {doc.firstName} {doc.lastName}</Text>
                  </TouchableOpacity>
                ))
              }
            </ScrollView>
          </View>
        )}

        {/* Sections */}
        <Text style={{ fontSize: FONT_SIZES.xs, fontWeight: '700', color: C.textSecondary, textTransform: 'uppercase', marginBottom: SPACING.sm }}>Report Sections</Text>
        {ADVSECTIONS.map(s => (
          <SectionCheck key={s.key} label={s.label} desc={s.desc} checked={advSections[s.key]} onChange={() => setAdvSections(p => ({ ...p, [s.key]: !p[s.key] }))} color={s.color} />
        ))}

        {/* Actions */}
        <TouchableOpacity style={{ backgroundColor: C.accent, borderRadius: RADIUS.md, height: 48, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm, ...S.md }}
          onPress={() => fetchData()} disabled={loading || !dateFrom || !dateTo}>
          {loading ? <ActivityIndicator color={C.white} /> : <Text style={{ color: C.white, fontWeight: '700', fontSize: FONT_SIZES.sm }}>Generate Data</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={{ backgroundColor: C.bgInput, borderWidth: 1, borderColor: C.border, borderRadius: RADIUS.md, height: 48, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm }}
          onPress={handleSaveAsPreset} disabled={!dateFrom || !dateTo}>
          <Text style={{ color: C.primary, fontWeight: '700', fontSize: FONT_SIZES.sm }}>Save as Preset</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
          <TouchableOpacity style={{ flex: 1, backgroundColor: C.success, borderRadius: RADIUS.md, height: 48, justifyContent: 'center', alignItems: 'center', opacity: (!data || !reportName.trim() || saving) ? 0.5 : 1 }}
            onPress={handleSave} disabled={!data || !reportName.trim() || saving}>
            {saving ? <ActivityIndicator color={C.white} /> : <Text style={{ color: C.white, fontWeight: '700', fontSize: FONT_SIZES.sm }}>Save Report</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={{ flex: 1, backgroundColor: C.warning, borderRadius: RADIUS.md, height: 48, justifyContent: 'center', alignItems: 'center', opacity: (!data) ? 0.5 : 1 }}
            onPress={() => Alert.alert('Not Supported', 'PDF export is coming soon to the mobile app. Please use the desktop dashboard.')} disabled={!data}>
            <Text style={{ color: C.white, fontWeight: '700', fontSize: FONT_SIZES.sm }}>Export PDF</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Preset Library */}
      <View style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.lg, borderWidth: 1, borderColor: C.border, ...S.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md }}>
          <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: C.textPrimary }}>Active Presets Library</Text>
          <TouchableOpacity onPress={loadPresets}><Ionicons name="refresh" size={18} color={C.primary} /></TouchableOpacity>
        </View>
        {presetLoading ? <ActivityIndicator color={C.primary} /> : presets.length === 0 ? <Text style={{ color: C.textMuted }}>No presets saved yet.</Text> :
          presets.map(preset => (
            <View key={preset._id} style={{ padding: SPACING.sm, backgroundColor: C.bgInput, borderRadius: RADIUS.md, marginBottom: SPACING.sm }}>
              <Text style={{ fontWeight: '700', color: C.textPrimary }}>{preset.name}</Text>
              <Text style={{ fontSize: FONT_SIZES.xs, color: C.textSecondary, marginBottom: SPACING.sm }}>{preset.dateRange?.from} to {preset.dateRange?.to}</Text>
              <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                <TouchableOpacity onPress={() => applySavedPreset(preset)} style={{ paddingHorizontal: SPACING.sm, paddingVertical: 4, backgroundColor: C.primary, borderRadius: RADIUS.sm }}><Text style={{ color: '#fff', fontSize: 12 }}>Apply</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => deletePreset(preset._id)} style={{ paddingHorizontal: SPACING.sm, paddingVertical: 4, backgroundColor: C.error, borderRadius: RADIUS.sm }}><Text style={{ color: '#fff', fontSize: 12 }}>Delete</Text></TouchableOpacity>
              </View>
            </View>
          ))
        }
      </View>

      {/* Preview Data */}
      {data && data.message ? (
        <View style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: SPACING.lg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border, marginBottom: SPACING.md }}>
          <Ionicons name="information-circle-outline" size={32} color={C.textSecondary} style={{ marginBottom: SPACING.sm }} />
          <Text style={{ fontSize: FONT_SIZES.sm, color: C.textSecondary, textAlign: 'center' }}>{data.message}</Text>
        </View>
      ) : data && (
        <View style={{ gap: SPACING.md }}>
          {advSections.appointmentSummary && data.appointments && (
            <View style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: C.border, ...S.sm }}>
              <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: C.textPrimary, marginBottom: SPACING.sm }}>Appointments</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
                <MiniStat label="Total" value={data.appointments.total} color={C.primary} />
                <MiniStat label="Completed" value={data.appointments.completed} color={C.success} />
              </View>
            </View>
          )}
          {advSections.financialSummary && data.financial && (
            <View style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: C.border, ...S.sm }}>
              <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: C.textPrimary, marginBottom: SPACING.sm }}>Financial Insight</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
                <MiniStat label="Total Rev" value={fmtLKR(data.financial.total)} color={C.success} />
                <MiniStat label="Avg Trx" value={fmtLKR(Math.round(data.financial.avg))} color={C.primary} />
              </View>
            </View>
          )}
          {advSections.cancellationAnalysis && data.cancellation && (
            <View style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: C.border, ...S.sm }}>
              <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '700', color: C.textPrimary, marginBottom: SPACING.sm }}>Cancellations</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
                <MiniStat label="Cancelled" value={data.cancellation.total} color={C.error} />
                <MiniStat label="Cancel Rate" value={`${data.cancellation.rate}%`} color={C.warning} />
              </View>
            </View>
          )}
          {advSections.doctorPerformance && data.doctorPerformance?.length > 0 && (
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
          {advSections.peakHours && data.peakHours?.length > 0 && (
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

function SavedTab() {
  const { C, S } = useTheme();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewModal, setViewModal] = useState(null);

  const fetchReports = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/saved-reports');
      setReports(data);
    } catch { Alert.alert('Error', 'Failed to load saved reports'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);
  const onRefresh = () => { setRefreshing(true); fetchReports(); };

  const handleDelete = async (id) => {
    Alert.alert("Delete Report", "Are you sure you want to delete this saved report?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          try { await api.delete(`/admin/saved-reports/${id}`); setReports(prev => prev.filter(p => p._id !== id)); }
          catch { Alert.alert('Error', 'Failed to delete report'); }
      }}
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
      <Modal visible={!!viewModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setViewModal(null)}>
        <View style={{ flex: 1, backgroundColor: C.bgCard }}>
          <View style={{ padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontSize: FONT_SIZES.xs, color: C.textSecondary, textTransform: 'uppercase' }}>{viewModal?.type} Report</Text>
              <Text style={{ fontSize: FONT_SIZES.lg, fontWeight: '700', color: C.textPrimary }}>{viewModal?.name}</Text>
            </View>
            <TouchableOpacity onPress={() => setViewModal(null)}><Ionicons name="close" size={24} color={C.textPrimary} /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: SPACING.md }}>
            <View style={{ backgroundColor: C.bgInput, padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.md }}>
               <Text style={{ color: C.textSecondary }}>Period: <Text style={{ color: C.textPrimary, fontWeight: '700' }}>{viewModal?.dateFrom} to {viewModal?.dateTo}</Text></Text>
               <Text style={{ color: C.textSecondary }}>Saved: <Text style={{ color: C.textPrimary, fontWeight: '700' }}>{fmtDateTime(viewModal?.createdAt)}</Text></Text>
            </View>
            <Text style={{ marginBottom: SPACING.md, color: C.textPrimary }}>Data preview is available on the Desktop Dashboard or by regenerating this report's parameters.</Text>
            
            {viewModal?.data?.appointments && (
              <View style={{ marginBottom: SPACING.md }}>
                <Text style={{ fontWeight: 'bold', color: C.textPrimary, marginBottom: SPACING.sm }}>Appointments</Text>
                <Text style={{ color: C.textSecondary }}>Total: {viewModal.data.appointments.total}</Text>
                <Text style={{ color: C.textSecondary }}>Completed: {viewModal.data.appointments.completed}</Text>
                <Text style={{ color: C.textSecondary }}>Cancelled: {viewModal.data.appointments.cancelled}</Text>
              </View>
            )}
            {viewModal?.data?.financial && (
              <View style={{ marginBottom: SPACING.md }}>
                <Text style={{ fontWeight: 'bold', color: C.textPrimary, marginBottom: SPACING.sm }}>Financials</Text>
                <Text style={{ color: C.textSecondary }}>Revenue: {fmtLKR(viewModal.data.financial.total)}</Text>
              </View>
            )}
            {viewModal?.data?.payments && (
              <View style={{ marginBottom: SPACING.md }}>
                <Text style={{ fontWeight: 'bold', color: C.textPrimary, marginBottom: SPACING.sm }}>Payments</Text>
                <Text style={{ color: C.textSecondary }}>Total Revenue: {fmtLKR(viewModal.data.payments.totalRevenue)}</Text>
                <Text style={{ color: C.textSecondary }}>Success Rate: {viewModal.data.payments.successRate}%</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {loading ? <ActivityIndicator color={C.primary} style={{ marginTop: 20 }} /> : (
        <FlatList data={reports} keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
          contentContainerStyle={{ padding: SPACING.md, paddingBottom: 100 }}
          ListEmptyComponent={<Text style={{ textAlign: 'center', color: C.textMuted, marginTop: 40 }}>No saved reports found.</Text>}
          renderItem={({ item }) => (
            <View style={{ flexDirection: 'row', backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: C.border, alignItems: 'center', ...S.sm }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                   <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: item.type === 'advanced' ? C.accent + '22' : C.primary + '22', marginRight: 6 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: item.type === 'advanced' ? C.accent : C.primary, textTransform: 'uppercase' }}>{item.type}</Text>
                   </View>
                   <Text style={{ fontSize: FONT_SIZES.base, fontWeight: '700', color: C.textPrimary, flex: 1 }} numberOfLines={1}>{item.name}</Text>
                </View>
                <Text style={{ fontSize: FONT_SIZES.xs, color: C.textSecondary, marginBottom: 4 }}>{item.dateFrom} to {item.dateTo}</Text>
                <Text style={{ fontSize: 10, color: C.textMuted }}>{fmtDate(item.createdAt)}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                <TouchableOpacity style={{ width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', backgroundColor: `${C.primary}22` }}
                  onPress={() => setViewModal(item)}>
                  <Ionicons name="eye" size={16} color={C.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={{ width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', backgroundColor: `${C.warning}22` }}
                  onPress={() => Alert.alert('Not Supported', 'PDF export is coming soon to the mobile app. Please use the desktop dashboard.')}>
                  <Ionicons name="download" size={16} color={C.warning} />
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
