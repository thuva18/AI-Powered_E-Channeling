import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import { SkeletonCard, Badge, EmptyState, InfoBanner } from '../components/ui/Common';
import {
    DollarSign, Users, Calendar, CheckCircle,
    Clock, TrendingUp, ArrowRight, BookOpen, Bell,
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie, Legend,
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// ── StatCard ──────────────────────────────────────────────────────────────────
const StatCard = ({ title, value, icon: Icon, gradient, sub, delay = '', onClick }) => (
    <div
        className={`bg-white/80 backdrop-blur-xl border border-white/80 shadow-xl shadow-blue-900/5 rounded-3xl p-6 animate-fade-up ${delay} ${onClick ? 'cursor-pointer group hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300' : ''}`}
        onClick={onClick}
    >
        <div className="flex items-start justify-between mb-4">
            <div className="h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-110" style={{ background: gradient }}>
                <Icon size={22} className="text-white" />
            </div>
            {sub && <span className="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">{sub}</span>}
            {onClick && (
                <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors mt-1" />
            )}
        </div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h3 className="text-3xl font-extrabold text-slate-900">{value}</h3>
    </div>
);

// ── Main Dashboard ────────────────────────────────────────────────────────────
const DoctorDashboard = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [analytics, setAnalytics] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [journalCount, setJournalCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.approvalStatus !== 'APPROVED') { setLoading(false); return; }
        Promise.all([
            api.get('/doctors/analytics'),
            api.get('/doctors/appointments'),
            api.get('/doctors/journal'),
        ]).then(([aRes, apRes, jRes]) => {
            setAnalytics(aRes.data);
            setAppointments(apRes.data.slice(0, 5));
            setJournalCount(jRes.data.length);
        }).catch(console.error).finally(() => setLoading(false));
    }, [user]);

    /* ── Pending approval blocker ── */
    if (user?.approvalStatus === 'PENDING') return (
        <div className="flex items-center justify-center min-h-[70vh]">
            <div className="card max-w-lg w-full p-10 text-center animate-fade-up">
                <div className="w-20 h-20 rounded-3xl bg-amber-50 flex items-center justify-center mx-auto mb-6">
                    <Clock size={40} className="text-amber-500 animate-float" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-3">Account Under Review</h2>
                <p className="text-slate-500 leading-relaxed mb-6">
                    Your SLMC registration details are being verified by our administrative team. You'll receive full dashboard access once approved.
                </p>
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-left space-y-2">
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">What happens next?</p>
                    {['Admin verifies your SLMC number at medicalcouncil.lk', 'Account gets approved', 'You get full dashboard access'].map((s, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-amber-800">
                            <span className="h-5 w-5 rounded-full bg-amber-200 flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                            {s}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    /* ── Skeleton ── */
    if (loading) return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
            <div className="card p-6"><div className="skeleton h-56 rounded-xl" /></div>
        </div>
    );

    const stats = [
        { title: 'Total Revenue', value: `Rs. ${(analytics?.totalRevenue || 0).toLocaleString()}`, icon: DollarSign, gradient: 'linear-gradient(135deg,#10b981,#059669)', delay: 'anim-delay-1' },
        { title: 'Total Appointments', value: analytics?.totalAppointments || 0, icon: Calendar, gradient: 'linear-gradient(135deg,#3b82f6,#2563eb)', delay: 'anim-delay-2', onClick: () => navigate('/dashboard/appointments') },
        { title: 'Pending Requests', value: analytics?.pendingAppointments || 0, icon: Users, gradient: 'linear-gradient(135deg,#f59e0b,#d97706)', delay: 'anim-delay-3', onClick: () => navigate('/dashboard/appointments') },
        { title: 'Journal Entries', value: journalCount, icon: BookOpen, gradient: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', delay: 'anim-delay-4', onClick: () => navigate('/dashboard/journal') },
    ];

    const monthly = analytics?.monthlyChartData || [];
    const comparison = analytics?.comparisonData || [];
    const statusDist = analytics?.statusDistribution || [];

    return (
        <div className="space-y-6">

            {/* Pending requests alert */}
            {(analytics?.pendingAppointments > 0) && (
                <InfoBanner
                    icon={Bell}
                    title={`${analytics.pendingAppointments} appointment${analytics.pendingAppointments > 1 ? 's' : ''} awaiting your response`}
                    description="Review and accept or decline pending booking requests from patients."
                    variant="amber"
                    action={
                        <button
                            onClick={() => navigate('/dashboard/appointments')}
                            className="text-xs font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                        >
                            View →
                        </button>
                    }
                />
            )}

            {/* KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s) => <StatCard key={s.title} {...s} />)}
            </div>

            {/* Revenue + Status donut */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Revenue area */}
                <div className="bg-white/80 backdrop-blur-xl border border-white/80 shadow-xl shadow-blue-900/5 rounded-3xl p-7 col-span-2 animate-fade-up anim-delay-2">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h3 className="text-lg font-extrabold text-slate-900">Monthly Revenue</h3>
                            <p className="text-sm text-slate-500 font-medium mt-0.5">Last 6 months overview</p>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full shadow-sm">
                            <TrendingUp size={14} /> Live from database
                        </div>
                    </div>
                    {monthly.length === 0 ? (
                        <div className="h-52 flex items-center justify-center text-slate-400 text-sm">No monthly data yet.</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={monthly} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.18} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                                <Tooltip
                                    contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 13, boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}
                                    formatter={v => [`Rs. ${v.toLocaleString()}`, 'Revenue']}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} fill="url(#revGrad)" dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Appointment status donut */}
                <div className="bg-white/80 backdrop-blur-xl border border-white/80 shadow-xl shadow-blue-900/5 rounded-3xl p-7 animate-fade-up anim-delay-3">
                    <h3 className="text-lg font-extrabold text-slate-900 mb-1">Appointment Status</h3>
                    <p className="text-sm text-slate-500 font-medium mb-4">Distribution overview</p>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie data={statusDist} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                                {statusDist.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Top Symptoms replaced by Journal quick-link + Peer Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Journal shortcut card */}
                <div className="bg-white/80 backdrop-blur-xl border border-white/80 shadow-xl shadow-blue-900/5 rounded-3xl p-7 animate-fade-up anim-delay-1">
                    <h3 className="text-lg font-extrabold text-slate-900 mb-1">Personal Journal</h3>
                    <p className="text-sm text-slate-500 font-medium mb-5">Patient records, prescriptions &amp; history</p>
                    <div className="space-y-3">
                        <div className="flex items-center gap-4 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shrink-0">
                                <BookOpen size={20} className="text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="text-3xl font-extrabold text-slate-900">{journalCount}</p>
                                <p className="text-sm text-slate-500">Patient records</p>
                            </div>
                        </div>
                    </div>
                    <Link to="/dashboard/journal" className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-500/20">
                        Open Journal <ArrowRight size={14} />
                    </Link>
                </div>

                {/* Peer comparison bar chart */}
                <div className="bg-white/80 backdrop-blur-xl border border-white/80 shadow-xl shadow-blue-900/5 rounded-3xl p-7 animate-fade-up anim-delay-2">
                    <h3 className="text-lg font-extrabold text-slate-900 mb-1">Peer Comparison</h3>
                    <p className="text-sm text-slate-500 font-medium mb-5">Revenue vs peers in same specialization</p>
                    {comparison.length <= 1 ? (
                        <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No peers in same specialization yet.</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={comparison} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                                <Tooltip
                                    contentStyle={{ borderRadius: 10, fontSize: 12 }}
                                    formatter={v => [`Rs. ${v.toLocaleString()}`, 'Revenue']}
                                />
                                <Bar dataKey="revenue" radius={[8, 8, 0, 0]}>
                                    {comparison.map((entry, idx) => (
                                        <Cell key={idx} fill={entry.label === 'You' ? '#3b82f6' : '#e2e8f0'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                    {comparison.length > 1 && (
                        <div className="mt-4 pt-4 border-t border-slate-100 flex gap-4 text-xs">
                            <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded bg-blue-500" /> You</div>
                            <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded bg-slate-200" /> Anonymized Peers</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Recent appointments */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/80 shadow-xl shadow-blue-900/5 rounded-3xl overflow-hidden animate-fade-up">
                <div className="flex items-center justify-between p-6 sm:p-8 border-b border-slate-100/60 bg-white/40">
                    <div>
                        <h3 className="text-lg font-extrabold text-slate-900">Recent Appointments</h3>
                        <p className="text-sm text-slate-500 font-medium mt-0.5">Latest booking activity</p>
                    </div>
                    <Link to="/dashboard/appointments" className="flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-indigo-600 hover:bg-blue-50 px-4 py-2 rounded-xl transition-all">
                        View all <ArrowRight size={14} />
                    </Link>
                </div>
                {appointments.length === 0 ? (
                    <div className="p-8">
                        <EmptyState
                            icon={<Calendar size={28} />}
                            title="No appointments yet"
                            description="Once patients book with you, their appointments will appear here."
                            action={
                                <Link
                                    to="/dashboard/appointments"
                                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                                >
                                    View all appointments <ArrowRight size={14} />
                                </Link>
                            }
                        />
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100/50">
                        {appointments.map((apt) => (
                            <div key={apt._id} className="flex flex-col sm:flex-row sm:items-center justify-between px-6 sm:px-8 py-5 hover:bg-blue-50/40 transition-colors gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-50 border border-blue-200/50 shadow-sm flex items-center justify-center text-blue-700 text-lg font-bold shrink-0">
                                        {apt.patientId?.email?.[0]?.toUpperCase() || 'P'}
                                    </div>
                                    <div>
                                        <p className="text-base font-bold text-slate-900">{apt.patientId?.email}</p>
                                        <p className="text-sm font-medium text-slate-500 mt-0.5">{apt.symptoms?.slice(0, 2).join(', ') || apt.timeSlot}</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                                    <div className="text-left sm:text-right">
                                        <p className="text-sm font-bold text-slate-700">
                                            {new Date(apt.appointmentDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}
                                        </p>
                                        <p className="text-xs font-semibold text-slate-400 mt-0.5">{apt.timeSlot}</p>
                                    </div>
                                    <Badge status={apt.status} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DoctorDashboard;
