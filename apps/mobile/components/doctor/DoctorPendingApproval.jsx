// components/doctor/DoctorPendingApproval.jsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import useTheme from '../../hooks/useTheme';
import useAuthStore from '../../store/authStore';
import { FONT_SIZES, SPACING, RADIUS } from '../../constants/theme';
import ThemeToggle from '../common/ThemeToggle';

export default function DoctorPendingApproval() {
  const { C, isDark, S } = useTheme();
  const { clearUser, user } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await clearUser();
    router.replace('/(auth)/login');
  };

  const isRejected = user?.approvalStatus === 'REJECTED';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={styles.header}>
        <ThemeToggle size={40} />
      </View>
      
      <View style={styles.container}>
        <View style={[styles.iconContainer, { backgroundColor: isRejected ? `${C.error}15` : `${C.warning}15` }]}>
          <Ionicons name={isRejected ? "close-circle" : "time"} size={60} color={isRejected ? C.error : C.warning} />
        </View>
        
        <Text style={[styles.title, { color: C.textPrimary }]}>
          {isRejected ? 'Application Rejected' : 'Account Pending Approval'}
        </Text>
        
        <Text style={[styles.description, { color: C.textSecondary }]}>
          {isRejected 
            ? `We regret to inform you, Dr. ${user?.firstName || 'Doctor'}, that your application has been rejected after review.`
            : `Hello Dr. ${user?.firstName || 'Doctor'}, your registration request has been received and is currently being reviewed by our administrative team.`
          }
        </Text>
        
        <View style={[styles.infoBox, { 
          backgroundColor: isRejected ? `${C.error}10` : (isDark ? 'rgba(255,193,7,0.1)' : '#FFF9E6'), 
          borderColor: isRejected ? `${C.error}40` : `${C.warning}40` 
        }]}>
          <Ionicons name="information-circle" size={20} color={isRejected ? C.error : C.warning} />
          <Text style={[styles.infoText, { color: isRejected ? C.error : (isDark ? '#FFD54F' : '#856404') }]}>
            {isRejected 
              ? 'Please contact the administration office for further details regarding this decision.'
              : 'This process usually takes 24-48 hours. You will be able to access your dashboard once approved.'
            }
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.logoutBtn, { backgroundColor: `${C.error}15`, borderColor: `${C.error}30` }]} 
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color={C.error} />
          <Text style={[styles.logoutText, { color: C.error }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: SPACING.lg,
    alignItems: 'flex-end',
    paddingTop: SPACING.md,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    marginTop: -50,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  infoBox: {
    flexDirection: 'row',
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    alignItems: 'flex-start',
    gap: SPACING.md,
    marginBottom: SPACING.xxl,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
