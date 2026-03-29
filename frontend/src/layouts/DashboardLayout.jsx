import { useState, useEffect, useRef } from 'react';
import { Outlet, Navigate, NavLink, useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import CustomCalendar from '../components/CustomCalendar';
import {
    LayoutDashboard, Calendar, Users, Settings,
    LogOut, Activity, ShieldCheck, Bell, ChevronRight, BookOpen,
    Menu, X, User, CheckCircle, Clock, AlertCircle, Heart, FileText, CreditCard, Search,
} from 'lucide-react';

// ── Toast component ────────────────────────────────────────────────────────────
export const Toast = ({ toast, onDismiss }) => {
    if (!toast) return null;
    return (
        <div
            className={`fixed top-5 right-5 z-[999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl font-medium text-sm animate-fade-up cursor-pointer select-none
                ${toast.type === 'success' ? 'bg-emerald-600 text-white' : toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-800 text-white'}`}
            onClick={onDismiss}
        >
            {toast.type === 'success' && <CheckCircle size={16} />}
            {toast.type === 'error' && <AlertCircle size={16} />}
            {toast.msg}
        </div>
    );
};

// ── Notification item ──────────────────────────────────────────────────────────
const NotifItem = ({ apt }) => {
    const statusColor = {
        PENDING: 'text-amber-600 bg-amber-50',
        ACCEPTED: 'text-emerald-600 bg-emerald-50',
        REJECTED: 'text-red-600 bg-red-50',
        COMPLETED: 'text-blue-600 bg-blue-50',
    };
    return (
        <div className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
            <div className={`h-8 w-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${statusColor[apt.status] || 'bg-slate-100 text-slate-600'}`}>
                {apt.patientId?.email?.[0]?.toUpperCase() || 'P'}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">
                    {apt.patientId?.email || 'Patient'}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(apt.appointmentDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })} · {apt.timeSlot || '—'}
                </p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${statusColor[apt.status] || 'bg-slate-100 text-slate-500'}`}>
                {apt.status}
            </span>
        </div>
    );
};

// ── Main layout ────────────────────────────────────────────────────────────────
const DashboardLayout = ({ allowedRoles }) => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const [notifOpen, setNotifOpen] = useState(false);
    const [avatarOpen, setAvatarOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [pendingCount, setPendingCount] = useState(0);

    const notifRef = useRef(null);
    const avatarRef = useRef(null);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handle = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
            if (avatarRef.current && !avatarRef.current.contains(e.target)) setAvatarOpen(false);
        };
        document.addEventListener('mousedown', handle);
        return () => document.removeEventListener('mousedown', handle);
    }, []);

    // Fetch recent appointments for notifications (doctors only)
    useEffect(() => {
        if (user?.role !== 'DOCTOR' || user?.approvalStatus !== 'APPROVED') return;
        api.get('/doctors/appointments').then(({ data }) => {
            setNotifications(data.slice(0, 5));
            setPendingCount(data.filter(a => a.status === 'PENDING').length);
        }).catch(() => { });
    }, [user]);

    if (!user) return <Navigate to="/login" replace />;
    if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/login" replace />;

    const isDoctor = user.role === 'DOCTOR';
    const isPatient = user.role === 'PATIENT';

    const doctorLinks = [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Appointments', path: '/dashboard/appointments', icon: Calendar },
        { label: 'Patients', path: '/dashboard/patients', icon: Users },
        { label: 'Journal', path: '/dashboard/journal', icon: BookOpen },
        { label: 'Profile', path: '/dashboard/profile', icon: Settings },
    ];

    const adminLinks = [
        { label: 'Pending Reviews', path: '/admin', icon: ShieldCheck },
        { label: 'All Doctors', path: '/admin/doctors', icon: Users },
    ];

    const patientLinks = [
        { label: 'Book Appointment', path: '/patient', icon: Search },
        { label: 'My Appointments', path: '/patient/appointments', icon: Calendar },
        { label: 'Medical History', path: '/patient/history', icon: FileText },
        { label: 'Payment History', path: '/patient/payments', icon: CreditCard },
        { label: 'My Profile', path: '/patient/profile', icon: User },
    ];

    const links = isDoctor ? doctorLinks : isPatient ? patientLinks : adminLinks;

    const displayName = isPatient
        ? `${user.patientProfile?.firstName || ''} ${user.patientProfile?.lastName || ''}`.trim() || user.email.split('@')[0]
        : isDoctor
            ? `Dr. ${user.firstName} ${user.lastName || ''}`.trim()
            : user.email.split('@')[0];
    const initials = (isPatient
        ? (user.patientProfile?.firstName?.[0] || user.email[0])
        : (user.firstName?.[0] || user.email[0])
    ).toUpperCase();

    const SidebarContent = () => (
        <>
            {/* Logo */}
            <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-3 shrink-0">
                <div className={`h-8 w-8 rounded-xl flex items-center justify-center shadow-lg ${isPatient
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-500 shadow-blue-500/30'
                    : 'bg-gradient-to-br from-blue-600 to-indigo-500 shadow-blue-500/30'
                    }`}>
                    {isPatient ? <Heart size={16} className="text-white" /> : <Activity size={16} className="text-white" />}
                </div>
                <div>
                    <p className="font-bold text-slate-900 text-sm leading-none">Medicare</p>
                    <p className="text-[10px] font-medium text-slate-400 mt-0.5 uppercase tracking-widest">
                        {isPatient ? 'Patient Portal' : isDoctor ? 'Doctor Portal' : 'Admin Panel'}
                    </p>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-3 pb-2 pt-1">
                    {isPatient ? 'My Account' : isDoctor ? 'Navigation' : 'Management'}
                </p>
                {links.map(({ label, path, icon: Icon }) => (
                    <NavLink
                        key={path}
                        to={path}
                        end={path === '/dashboard' || path === '/admin' || path === '/patient'}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                            `sidebar-link ${isActive ? 'active' : ''}`
                        }
                    >
                        <Icon size={17} className="shrink-0" />
                        <span className="flex-1">{label}</span>
                        <ChevronRight size={14} className="opacity-30 shrink-0" />
                    </NavLink>
                ))}
            </nav>

            {/* Quick Booking Calendar (Patient Only) */}
            {isPatient && (
                <div className="px-3 pb-1 shrink-0">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-1 pb-1">
                        Quick Booking
                    </p>
                    <CustomCalendar 
                        className="scale-[0.80] origin-top border-none p-2 bg-transparent shadow-none !mb-[-30px]"
                        minDate={new Date()} 
                        onSelectDate={(d) => {
                            const y = d.getFullYear();
                            const m = String(d.getMonth() + 1).padStart(2, '0');
                            const day = String(d.getDate()).padStart(2, '0');
                            navigate(`/patient?date=${y}-${m}-${day}`);
                            setMobileOpen(false);
                        }} 
                    />
                </div>
            )}

            {/* User card */}
            <div className="p-3 border-t border-slate-100 shrink-0">
                <div
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 mb-2 cursor-pointer hover:bg-blue-50 transition-colors"
                    onClick={() => { if (isPatient) navigate('/patient/profile'); else if (!isPatient) navigate('/dashboard/profile'); setMobileOpen(false); }}
                >
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm ${isPatient
                        ? 'bg-gradient-to-br from-blue-600 to-indigo-500'
                        : 'bg-gradient-to-br from-blue-600 to-indigo-500'
                        }`}>
                        {initials}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-semibold text-slate-800 truncate">{displayName}</p>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600"
                >
                    <LogOut size={16} />
                    Sign Out
                </button>
            </div>
        </>
    );

    return (
        <div className="flex h-screen overflow-hidden bg-[--bg]">
            {/* ── Desktop Sidebar ── */}
            <aside className="hidden md:flex flex-col w-64 shrink-0 bg-white border-r border-slate-100 shadow-sm">
                <SidebarContent />
            </aside>

            {/* ── Mobile Sidebar overlay ── */}
            {mobileOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
                        onClick={() => setMobileOpen(false)}
                    />
                    {/* Drawer */}
                    <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col animate-fade-up">
                        <button
                            className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
                            onClick={() => setMobileOpen(false)}
                        >
                            <X size={18} />
                        </button>
                        <SidebarContent />
                    </aside>
                </div>
            )}

            {/* ── Main ── */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top bar */}
                <header className="h-16 shrink-0 bg-white/90 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-4 md:px-8 z-10">
                    <div className="flex items-center gap-3">
                        {/* Mobile hamburger */}
                        <button
                            className="md:hidden h-9 w-9 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center"
                            onClick={() => setMobileOpen(true)}
                        >
                            <Menu size={18} className="text-slate-600" />
                        </button>
                        <div>
                            <h2 className="font-bold text-slate-900 text-sm hidden sm:block">
                                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {isPatient ? (user.patientProfile?.firstName || user.email.split('@')[0]) : (user.firstName || user.email.split('@')[0])}!
                            </h2>
                            <p className="text-xs text-slate-400 hidden sm:block">
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {isDoctor && user.approvalStatus === 'PENDING' && (
                            <span className="badge badge-pending hidden sm:inline-flex">⏳ Awaiting Approval</span>
                        )}
                        {isDoctor && user.approvalStatus === 'APPROVED' && (
                            <span className="badge badge-approved hidden sm:inline-flex">✓ Verified Doctor</span>
                        )}

                        {/* ── Notification bell ── */}
                        <div ref={notifRef} className="relative">
                            <button
                                onClick={() => { setNotifOpen(o => !o); setAvatarOpen(false); }}
                                className="relative h-9 w-9 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center"
                            >
                                <Bell size={16} className="text-slate-600" />
                                {pendingCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                                        {pendingCount > 9 ? '9+' : pendingCount}
                                    </span>
                                )}
                            </button>

                            {notifOpen && (
                                <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-fade-up">
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                                        <h4 className="text-sm font-bold text-slate-900">Recent Appointments</h4>
                                        {pendingCount > 0 && (
                                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                                                {pendingCount} pending
                                            </span>
                                        )}
                                    </div>
                                    {notifications.length === 0 ? (
                                        <div className="py-8 text-center">
                                            <Clock size={24} className="mx-auto text-slate-300 mb-2" />
                                            <p className="text-sm text-slate-400">No recent appointments</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-slate-50">
                                            {notifications.map(apt => <NotifItem key={apt._id} apt={apt} />)}
                                        </div>
                                    )}
                                    <div className="border-t border-slate-100">
                                        <Link
                                            to="/dashboard/appointments"
                                            onClick={() => setNotifOpen(false)}
                                            className="flex items-center justify-center gap-1.5 py-3 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                                        >
                                            View all appointments <ChevronRight size={13} />
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── Avatar dropdown ── */}
                        <div ref={avatarRef} className="relative">
                            <div
                                onClick={() => { setAvatarOpen(o => !o); setNotifOpen(false); }}
                                className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-sm cursor-pointer shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200"
                            >
                                {initials}
                            </div>

                            {avatarOpen && (
                                <div className="absolute right-0 top-11 w-52 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-fade-up">
                                    {/* User info */}
                                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                                        <p className="text-sm font-bold text-slate-800 truncate">{displayName}</p>
                                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                                    </div>
                                    {isDoctor && (
                                        <Link
                                            to="/dashboard/profile"
                                            onClick={() => setAvatarOpen(false)}
                                            className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors font-medium"
                                        >
                                            <User size={15} className="text-slate-400" /> Edit Profile
                                        </Link>
                                    )}
                                    <button
                                        onClick={logout}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium border-t border-slate-100"
                                    >
                                        <LogOut size={15} /> Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
