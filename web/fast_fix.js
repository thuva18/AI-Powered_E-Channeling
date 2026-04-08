import fs from 'fs';

const r = (p, map) => {
    let c = fs.readFileSync(p, 'utf8');
    for (const [k, v] of Object.entries(map)) {
        c = c.replaceAll(k, v);
    }
    fs.writeFileSync(p, c);
    console.log('Fixed', p);
};

// AdminDashboard
r('src/pages/AdminDashboard.jsx', { 'UserPlus, ': '', 'CircleDot, ': '', 'subColor, ': '' });
// AdminPayments
r('src/pages/AdminPayments.jsx', { 'Building2, ': '', 'Wallet, ': '', 'User, ': '', 'ChevronDown, ': '' });
// AdminReports
r('src/pages/AdminReports.jsx', { 'savedReports, ': '' });
// DoctorDashboard
r('src/pages/DoctorDashboard.jsx', { 'CheckCircle, ': '' });
// PatientBookAppointment
r('src/pages/PatientBookAppointment.jsx', { 'MapPin, ': '', 'Building2, ': '', 'TrendingUp, ': '', 'const navigate = useNavigate();': '' });
// PatientMyAppointments
r('src/pages/PatientMyAppointments.jsx', { 'AlertTriangle, ': '' });
// PatientPaymentHistory
r('src/pages/PatientPaymentHistory.jsx', { 'Building2, ': '', 'Wallet, ': '' });
// PatientProfile
r('src/pages/PatientProfile.jsx', { 'XCircle, ': '', 'XCircle        ': '', '_cls_unused': '' });
// PaymentReceipt
r('src/pages/PaymentReceipt.jsx', { 'CreditCard, ': '', 'Building2, ': '', 'Wallet, ': '' });
// PersonalJournal
r('src/pages/PersonalJournal.jsx', { 'Badge, ': '' });

