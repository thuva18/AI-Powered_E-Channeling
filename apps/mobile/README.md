# AI E-Channeling – Mobile App (React Native / Expo)

> **SE2020 Group Assignment** – Full Stack Mobile Application  
> Branch: `my-app` | Module: Mobile Frontend

---

## 📱 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo (Managed Workflow, SDK 51) |
| Navigation | expo-router v3 (file-based) |
| State/Auth | Zustand + expo-secure-store |
| HTTP | Axios |
| UI | react-native-paper + @expo/vector-icons |
| Build | EAS Build (APK for demo) |

---

## 🗂️ Folder Structure

```
mobile/
├── app/                  ← File-based routing (expo-router)
│   ├── _layout.tsx       ← Root layout + auth guard
│   ├── index.tsx         ← Splash / redirect screen
│   ├── (auth)/
│   │   ├── login.tsx     ← Member 1
│   │   └── register.tsx  ← Member 1
│   ├── (patient)/
│   │   ├── home.tsx      ← Dashboard
│   │   ├── book.tsx      ← Book + AI predict  ← Member 2
│   │   ├── appointments.tsx
│   │   ├── payments.tsx  ← Member 5
│   │   └── profile.tsx
│   ├── (doctor)/
│   │   ├── home.tsx
│   │   ├── appointments.tsx  ← Member 3
│   │   ├── patients.tsx
│   │   ├── journal.tsx   ← Member 6
│   │   └── profile.tsx
│   └── (admin)/
│       ├── home.tsx
│       ├── doctors.tsx   ← Member 4
│       └── patients.tsx  ← Member 4
├── components/           ← Reusable components
├── constants/
│   └── theme.ts          ← Design tokens
├── hooks/
│   └── useApi.ts         ← Generic API hook
├── services/
│   └── api.ts            ← Axios instance + JWT interceptor
├── store/
│   └── authStore.ts      ← Zustand auth store
├── app.json              ← Expo configuration
├── eas.json              ← EAS Build config
└── package.json
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- Expo CLI: `npm install -g expo-cli`
- Android Studio (for emulator) or Expo Go app (physical device)

### 1. Install Dependencies
```bash
cd mobile
npm install
```

### 2. Configure Backend URL
Edit `services/api.ts`:
```ts
// For local dev (physical device – use your machine's IP):
export const BASE_URL = 'http://192.168.x.x:8000/api/v1';

// For production (after deploying backend to Render):
export const BASE_URL = 'https://your-app.onrender.com/api/v1';
```

Or set environment variable in `.env`:
```
EXPO_PUBLIC_API_BASE_URL=https://your-app.onrender.com/api/v1
```

### 3. Run the App
```bash
# Start Expo dev server
npm start         # or: expo start

# Run on Android emulator
npm run android

# Run on iOS simulator
npm run ios

# Scan QR code with Expo Go app on your phone
```

---

## 👥 Member Responsibilities

| Member | Module | Files |
|--------|--------|-------|
| 1 | Authentication (Login + Register) | `app/(auth)/login.tsx`, `app/(auth)/register.tsx` |
| 2 | Patient Core (Book Appointment + AI) | `app/(patient)/book.tsx`, `app/(patient)/home.tsx` |
| 3 | Doctor Appointments | `app/(doctor)/appointments.tsx` |
| 4 | Admin Panel (Doctor & Patient Mgmt) | `app/(admin)/doctors.tsx`, `app/(admin)/patients.tsx` |
| 5 | Patient Payments | `app/(patient)/payments.tsx` |
| 6 | Doctor Journal CRUD + EAS Deploy | `app/(doctor)/journal.tsx`, `eas.json` |

---

## 🏗️ Build APK (for submission)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Build Android APK (preview profile = .apk output)
eas build --platform android --profile preview
```

The APK will be available for download from [expo.dev](https://expo.dev).

---

## 🌐 Backend API

The app connects to the same Node.js + Express backend as the web app.

**Base URL:** `http://localhost:8000/api/v1` (dev) / `https://your-app.onrender.com/api/v1` (prod)

**Auth endpoints used:**
- `POST /auth/login`
- `POST /auth/patient/register`

**Protected endpoints (JWT required):**
- `/patients/*` – patient role
- `/doctors/*` – doctor role  
- `/admin/*` – admin role
- `/payments/*` – mixed

---

## 🔐 Authentication Flow

1. User submits login form → `POST /auth/login`
2. Backend returns JWT token
3. Token stored in `expo-secure-store` (encrypted)
4. All subsequent API calls include `Authorization: Bearer <token>`
5. On 401 response → auto logout + redirect to login

---

## 📦 Monorepo Structure

```
AI-Powered_E-Channeling/           ← Root repo (branch: my-app)
├── backend/                       ← Node.js + Express API
├── web/                           ← React + Vite web app (formerly frontend/)
├── mobile/                        ← THIS app (React Native / Expo)
├── shared/
│   └── api.js                     ← Shared API endpoint constants
└── ai-service/                    ← Python ML service
```
