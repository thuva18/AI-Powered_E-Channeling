# 🏥 AI-Powered E-Channeling System

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)

A comprehensive, full-stack healthcare scheduling and management platform powered by Artificial Intelligence. The system intelligently predicts the required medical specialist based on patient symptoms and facilitates seamless booking, journal keeping, and medical record management across Web and Mobile platforms.

---

## ✨ Key Features

### 🤖 **AI Symptom Analysis & Triage**
- **Ensemble Machine Learning Model:** Utilizes LightGBM, Support Vector Machines (SVM), and Logistic Regression to analyze patient symptoms.
- **Anomaly Detection:** Employs Isolation Forests to detect unusual or critical symptom patterns.
- **Specialist Prediction:** Automatically recommends the correct medical specialist with a confidence threshold system (minimum 40% confidence required).

### 📱 **Cross-Platform Access**
- **Mobile Application (React Native / Expo):** A premium, native mobile experience for Patients, Doctors, and Admins.
- **Web Dashboard (React / Vite):** A responsive, feature-rich browser dashboard for desktop management.

### 🌓 **System-Wide Dynamic Theming**
- Fully responsive **Light & Dark Mode** engine powered by Zustand.
- Real-time UI updates without reloading, utilizing a custom `useStyles` reactive hook system.

### 🔔 **Real-Time Notifications**
- Intelligent polling notification bell integrated into the top navigation of both Web and Mobile apps.
- Instant alerts for appointment requests, status changes (Accepted/Declined), and administrative updates.
- Persistent badge counts and unread state management.

### 👩‍⚕️ **Role-Based Architecture**
- **Patients:** Book appointments, manage medical history, upload symptom images, and receive AI triage results.
- **Doctors:** Manage availability slots, view patient symptom images securely via an integrated lightbox, update appointment statuses, and maintain clinical journals.
- **Admins:** Approve/Reject doctor registrations, view system analytics, and manage users.

---

## 🛠️ Technology Stack

| Component | Technology |
| :--- | :--- |
| **Mobile App** | React Native, Expo, Zustand, Expo Router |
| **Web App** | React, Vite, Tailwind CSS (via tokens), Zustand |
| **Backend API** | Node.js, Express.js, Mongoose |
| **Database** | MongoDB Atlas |
| **AI Service** | Python, Scikit-Learn, LightGBM, Pandas |
| **Deployment** | Render (Web, Backend, AI Service) |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Python](https://www.python.org/) (3.9+)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) Account (or local MongoDB)

### Local Development Setup

We have provided a unified startup script to launch the entire environment simultaneously.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/thuva18/AI-Powered_E-Channeling.git
   cd AI-Powered_E-Channeling
   ```

2. **Environment Variables:**
   Ensure your `.env` files are correctly set up in the `backend`, `web`, and `mobile` directories with your MongoDB URI, JWT secrets, and API endpoints.

3. **Start the System:**
   ```bash
   ./start_project.sh
   ```
   *This script will:*
   - Launch the Node.js Backend API on port `8000`.
   - Launch the Vite React Web App on port `5173`.
   - Launch the Expo React Native Metro bundler on port `8081` (LAN Mode).

4. **Testing the Mobile App:**
   - **Using a Physical Device:** Download the **Expo Go** app. Connect your phone to your computer via a **USB Cable**, enable USB Debugging, press `a` in the terminal, and the app will load automatically (bypassing any local Wi-Fi router isolation).
   - **Using an Emulator:** Open Android Studio / Xcode and press `a` or `i` in the Expo terminal.

---

## ☁️ Deployment

This project is fully configured for deployment on **Render** using an Infrastructure-as-Code (IaC) approach.

The `render.yaml` blueprint automatically provisions:
1. The Node.js Web Service (Backend).
2. The Python Web Service (AI Triage).
3. The Static Site Web Service (React Frontend), including SPA rewrite rules to prevent 404 errors on sub-routes.

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/thuva18/AI-Powered_E-Channeling/issues).

## 📝 License
This project is licensed under the MIT License.