/**
 * shared/api.js
 *
 * Single source of truth for backend API base URL and endpoint paths.
 * Used by both `web/` (Vite/React) and `mobile/` (React Native/Expo).
 *
 * For local dev:  BASE_URL = 'http://localhost:8000/api/v1'
 * For production: BASE_URL = 'https://<your-render-service>.onrender.com/api/v1'
 */

// ---------------------------------------------------------------------------
// Base URL — update this once you deploy the backend to Render/Railway etc.
// ---------------------------------------------------------------------------
export const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  process.env.VITE_API_BASE_URL ||
  'http://localhost:8000/api/v1';

// ---------------------------------------------------------------------------
// Endpoint helpers
// ---------------------------------------------------------------------------
export const ENDPOINTS = {
  // ── Auth ─────────────────────────────────────────────────────────────────
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER_PATIENT: '/auth/patient/register',
    REGISTER_DOCTOR: '/auth/doctor/register',
    CHECK_NIC: '/auth/check-nic',
    CHECK_EMAIL: '/auth/check-email',
  },

  // ── Patient ───────────────────────────────────────────────────────────────
  PATIENT: {
    PROFILE: '/patients/profile',
    DOCTORS: '/patients/doctors',
    APPOINTMENTS: '/patients/appointments',
    CANCEL_APPOINTMENT: (id) => `/patients/appointments/${id}/cancel`,
    MEDICAL_HISTORY: '/patients/medical-history',
    ANALYTICS: '/patients/analytics',
    JOURNALS: '/patients/journals',
  },

  // ── Doctor ────────────────────────────────────────────────────────────────
  DOCTOR: {
    PROFILE: '/doctors/profile',
    AVAILABILITY: '/doctors/availability',
    APPOINTMENTS: '/doctors/appointments',
    APPOINTMENT_STATUS: (id) => `/doctors/appointments/${id}/status`,
    ANALYTICS: '/doctors/analytics',
    PATIENTS: '/doctors/patients',
    PATIENT_APPOINTMENTS: (patientId) =>
      `/doctors/patients/${patientId}/appointments`,
    JOURNAL: '/doctors/journal',
    JOURNAL_BY_ID: (id) => `/doctors/journal/${id}`,
  },

  // ── Admin ─────────────────────────────────────────────────────────────────
  ADMIN: {
    ANALYTICS: '/admin/analytics',
    DOCTORS: '/admin/doctors',
    DOCTORS_PENDING: '/admin/doctors/pending',
    DOCTOR_APPROVE: (id) => `/admin/doctors/${id}/approve`,
    DOCTOR_DELETE: (id) => `/admin/doctors/${id}`,
    PATIENTS: '/admin/patients',
    ADMINS: '/admin/admins',
    TOGGLE_ACTIVE: (id) => `/admin/users/${id}/toggle-active`,
    DELETE_USER: (id) => `/admin/users/${id}`,
  },

  // ── Payments ──────────────────────────────────────────────────────────────
  PAYMENTS: {
    INITIATE: '/payments/initiate',
    MY_TRANSACTIONS: '/payments/my-transactions',
    RECEIPT: (id) => `/payments/${id}/receipt`,
    STATUS: (id) => `/payments/${id}/status`,
    DUMMY_SUBMIT: (id) => `/payments/${id}/dummy-submit`,
    ADMIN_ALL: '/payments/admin/all',
    ADMIN_PENDING: '/payments/admin/pending',
    ADMIN_APPROVE: (id) => `/payments/admin/${id}/approve`,
    ADMIN_REJECT: (id) => `/payments/admin/${id}/reject`,
  },

  // ── AI ────────────────────────────────────────────────────────────────────
  AI: {
    PREDICT: '/ai/predict',
    PREDICT_SPECIALIST: '/ai/predict-specialist',
  },
};
