// app/(patient)/medical-history.jsx
// Mobile Patient Medical History / Past Diagnoses

import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

export default function PatientMedicalHistoryScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async () => {
    try {
      // In the backend, patient/appointments often includes aiPrediction
      const { data } = await api.get('/patient/appointments');
      const past = data.filter(a => a.status === 'COMPLETED' || a.aiPrediction);
      setHistory(past);
    } catch (e) {
      console.error('Failed fetching medical history');
    } finally {
      setLoading(false); setRefreshing(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchHistory(); };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medical History</Text>
      </View>

      <ScrollView 
        style={styles.scroll} contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.patientPrimary}/>}
      >
        <View style={styles.infoBanner}>
            <Ionicons name="information-circle" size={24} color={COLORS.patientPrimary} />
            <Text style={styles.infoText}>This section contains past diagnoses, AI triage results, and completed specialist visits.</Text>
        </View>

        {loading ? <ActivityIndicator color={COLORS.patientPrimary} style={{marginTop: 40}} /> : (
            history.length === 0 ? (
                <View style={styles.emptyWrap}>
                    <Ionicons name="folder-open-outline" size={64} color={COLORS.textMuted} />
                    <Text style={styles.emptyText}>No medical records found.</Text>
                </View>
            ) : (
                history.map(item => (
                    <View key={item._id} style={styles.recordCard}>
                        <View style={styles.rDateHeader}>
                            <Text style={styles.rDate}>{new Date(item.createdAt || item.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
                            {item.status === 'COMPLETED' && <View style={styles.completedBadge}><Text style={styles.completedText}>COMPLETED</Text></View>}
                        </View>
                        
                        {item.aiPrediction && (
                            <View style={styles.aiBox}>
                                <Text style={styles.aiLabel}>AI Recommended Specialization</Text>
                                <Text style={styles.aiValue}>{item.aiPrediction.specialization}</Text>
                                {item.aiPrediction.confidence && (
                                    <Text style={styles.aiConf}>Confidence: {(item.aiPrediction.confidence * 100).toFixed(1)}%</Text>
                                )}
                            </View>
                        )}

                        {item.doctor && (
                            <View style={styles.docBox}>
                                <Ionicons name="medical" size={16} color={COLORS.doctorPrimary} />
                                <Text style={styles.docName}>Dr. {item.doctor.name}</Text>
                            </View>
                        )}
                        {item.prescription && (
                            <Text style={styles.rNotes}><Text style={{fontWeight:'700'}}>Notes:</Text> {item.prescription}</Text>
                        )}
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
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: 60, paddingBottom: SPACING.md, backgroundColor: 'rgba(19, 25, 41, 0.95)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)'},
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: FONT_SIZES.lg, fontWeight: '800', color: COLORS.textPrimary },
  scroll: { flex: 1 },
  content: { padding: SPACING.lg, paddingBottom: 100 },
  infoBanner: { flexDirection: 'row', backgroundColor: 'rgba(78, 154, 241, 0.1)', padding: SPACING.md, borderRadius: RADIUS.md, alignItems: 'center', marginBottom: SPACING.xl, borderWidth: 1, borderColor: 'rgba(78, 154, 241, 0.2)' },
  infoText: { flex: 1, marginLeft: SPACING.sm, color: COLORS.patientPrimary, fontSize: 13, lineHeight: 18, fontWeight: '600' },
  emptyWrap: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: COLORS.textMuted, marginTop: SPACING.md, fontWeight: '600', fontSize: FONT_SIZES.md },
  recordCard: { backgroundColor: 'rgba(28, 36, 56, 0.6)', borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', ...SHADOWS.sm },
  rDateHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  rDate: { fontSize: FONT_SIZES.base, fontWeight: '800', color: COLORS.textPrimary },
  completedBadge: { backgroundColor: 'rgba(46, 184, 114, 0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  completedText: { color: COLORS.success, fontSize: 10, fontWeight: '800' },
  aiBox: { backgroundColor: 'rgba(255,255,255,0.03)', padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.sm, borderLeftWidth: 3, borderLeftColor: COLORS.patientPrimary },
  aiLabel: { fontSize: 11, color: COLORS.textSecondary, textTransform: 'uppercase', fontWeight: '800', marginBottom: 4 },
  aiValue: { fontSize: FONT_SIZES.md, color: COLORS.textPrimary, fontWeight: '700' },
  aiConf: { fontSize: 12, color: COLORS.patientPrimary, marginTop: 4, fontWeight: '600' },
  docBox: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.xs, paddingVertical: SPACING.xs },
  docName: { marginLeft: 6, fontSize: FONT_SIZES.sm, color: COLORS.textPrimary, fontWeight: '600' },
  rNotes: { marginTop: SPACING.md, color: COLORS.textSecondary, fontSize: 13, lineHeight: 20, backgroundColor: 'rgba(0,0,0,0.2)', padding: SPACING.sm, borderRadius: RADIUS.sm }
});
