import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Toast } from '../layouts/DashboardLayout';
import {
    Users, Stethoscope, Calendar, CreditCard, TrendingUp, TrendingDown,
    CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw, ShieldCheck,
    ArrowRight, Activity, ExternalLink, BarChart3, Wallet, Star,
<<<<<<< Updated upstream
    UserPlus, BadgeCheck, ChevronRight, CircleDot,
=======
    BadgeCheck, ChevronRight, CircleDot,
>>>>>>> Stashed changes
} from 'lucide-react';

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmt = (n) => (n ?? 0).toLocaleString();
const fmtLKR = (n) => `LKR ${(n ?? 0).toLocaleString()}`;

const METHOD_META = {
    PAYHERE: { label: 'PayHere', icon: '🏦', color: 'bg-orange-100 text-orange-700' },
    BANK_TRANSFER: { label: 'Bank Transfer', icon: '🏛️', color: 'bg-blue-100 text-blue-700' },
    PAYPAL: { label: 'PayPal', icon: '💳', color: 'bg-sky-100 text-sky-700' },
};

// ── Mini sparkline bars ────────────────────────────────────────────────────────
const Sparkline = ({ data = [] }) => {
    const max = Math.max(...data.map(d => d.count), 1);
    return (
        <div className="flex items-end gap-0.5 h-8">
            {(data.length > 0 ? data : Array(7).fill({ count: 0 })).map((d, i) => (
                <div key={i} className="flex-1 rounded-t-sm bg-blue-200 transition-all duration-500"
                    style={{ height: `${Math.max(10, (d.count / max) * 100)}%`, opacity: 0.4 + 0.6 * (i / data.length) }} />
            ))}
        </div>
    );
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, subColor = 'text-emerald-600', gradient, trend, sparkData }) => (
    <div className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-lg shadow-${gradient?.split(' ')[2] || 'blue'}/20 bg-gradient-to-br ${gradient || 'from-blue-600 to-indigo-600'}`}>
        {/* Background decoration */}
        <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-white/10" />
        <div className="absolute -bottom-6 -left-2 h-16 w-16 rounded-full bg-white/5" />

        <div className="relative">
            <div className="flex items-start justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                    <Icon size={20} className="text-white" />
                </div>
                {trend !== undefined && (
                    <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${trend >= 0 ? 'bg-white/20' : 'bg-red-500/30'}`}>
                        {trend >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>

            <p className="text-white/70 text-xs font-medium uppercase tracking-wider">{label}</p>
            <p className="text-3xl font-bold mt-1 mb-1">{value}</p>
            {sub && <p className={`text-xs font-medium text-white/80`}>{sub}</p>}

            {sparkData && (
                <div className="mt-3 opacity-60">
                    <Sparkline data={sparkData} />
                </div>
            )}
        </div>
    </div>
);

// ── Donut chart (pure CSS) ─────────────────────────────────────────────────────
const DonutChart = ({ segments, total, label }) => {
    // segments: [{value, color, name}]
    const gap = 4;
    let acc = 0;
    const r = 36, cx = 44, cy = 44, circ = 2 * Math.PI * r;
    const normSegs = segments.map(s => ({ ...s, pct: total > 0 ? s.value / total : 0 }));

    return (
        <div className="flex items-center gap-4">
            <div className="relative shrink-0">
                <svg width={88} height={88} className="-rotate-90">
                    {total === 0 ? (
                        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
                    ) : normSegs.map((s, i) => {
                        const dashArr = s.pct * circ - gap;
                        const dashOff = -(acc * circ);
                        acc += s.pct;
                        return (
                            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
                                stroke={s.color} strokeWidth="10"
                                strokeDasharray={`${dashArr} ${circ}`}
                                strokeDashoffset={dashOff}
                                strokeLinecap="round" />
                        );
                    })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-xl font-bold text-slate-800">{fmt(total)}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{label}</p>
                </div>
            </div>
            <div className="space-y-1.5 flex-1">
                {normSegs.map((s, i) => (
                    <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full shrink-0" style={{ background: s.color }} />
                            <span className="text-xs text-slate-600 font-medium">{s.name}</span>
                        </div>
                        <span className="text-xs font-bold text-slate-800">{fmt(s.value)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ── Progress bar row ──────────────────────────────────────────────────────────
const ProgressRow = ({ label, value, max, color, icon }) => {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-base">{icon}</span>
                    <span className="text-sm font-medium text-slate-700">{label}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">{fmt(value)}</span>
                    <span className="text-xs text-slate-400">{pct}%</span>
                </div>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
            </div>
        </div>
    );
};

// ── Confirm modal ──────────────────────────────────────────────────────────────
const ConfirmModal = ({ action, onConfirm, onCancel }) => {
    if (!action) return null;
    const isApprove = action.status === 'APPROVED';
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(6px)' }}
            onClick={onCancel}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-up" onClick={e => e.stopPropagation()}>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${isApprove ? 'bg-emerald-50' : 'bg-red-50'}`}>
                    {isApprove ? <CheckCircle size={28} className="text-emerald-500" /> : <XCircle size={28} className="text-red-500" />}
                </div>
                <h3 className="text-lg font-bold text-slate-900 text-center mb-1">{isApprove ? 'Approve' : 'Reject'} Doctor?</h3>
                <p className="text-sm text-slate-500 text-center mb-5">Dr. <strong>{action.name}</strong></p>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                    <button onClick={onConfirm} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all ${isApprove ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}>
                        {isApprove ? 'Approve' : 'Reject'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── AdminDashboard ─────────────────────────────────────────────────────────────
const AdminDashboard = () => {
    const [data, setData] = useState(null);
    const [pending, setPending] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirm, setConfirm] = useState(null);
    const [updating, setUpdating] = useState(null);
    const [toast, setToast] = useState(null);
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'doctors'

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [analyticsRes, pendingRes] = await Promise.all([
                api.get('/admin/analytics'),
                api.get('/admin/doctors/pending'),
            ]);
            setData(analyticsRes.data);
            setPending(pendingRes.data);
        } catch {
            showToast('Failed to load dashboard data.', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const handleConfirm = async () => {
        const { id, name, status } = confirm;
        setConfirm(null);
        setUpdating(id);
        try {
            await api.patch(`/admin/doctors/${id}/approve`, { status });
            setPending(prev => prev.filter(d => d._id !== id));
            showToast(`Dr. ${name} ${status === 'APPROVED' ? 'approved' : 'rejected'} successfully.`,
                status === 'APPROVED' ? 'success' : 'error');
            fetchAll();
        } catch {
            showToast('Action failed. Please try again.', 'error');
        } finally { setUpdating(null); }
    };

    const d = data;

    return (
        <>
            <Toast toast={toast} onDismiss={() => setToast(null)} />
            <ConfirmModal action={confirm} onConfirm={handleConfirm} onCancel={() => setConfirm(null)} />

            <div className="space-y-6">
                {/* ── Header ── */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
                        <p className="text-sm text-slate-400 mt-0.5">
                            Platform overview · {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {pending.length > 0 && (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold border border-amber-200">
                                <AlertTriangle size={12} /> {pending.length} pending
                            </span>
                        )}
                        <button onClick={fetchAll} disabled={loading}
                            className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50">
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
                        </button>
                    </div>
                </div>

                {/* ── Tab nav ── */}
                <div className="flex bg-slate-100/80 rounded-xl p-1 w-fit gap-1">
                    {[
                        { key: 'overview', label: 'Overview', icon: BarChart3 },
                        { key: 'doctors', label: `Pending Reviews${pending.length > 0 ? ` (${pending.length})` : ''}`, icon: ShieldCheck },
                    ].map(t => (
                        <button key={t.key} onClick={() => setActiveTab(t.key)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === t.key ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            <t.icon size={14} /> {t.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
                    </div>
                ) : activeTab === 'overview' ? (
                    <>
                        {/* ── KPI Stat Cards ── */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard icon={Users} label="Total Patients" value={fmt(d?.users?.totalPatients)}
                                sub={`+${d?.users?.newPatientsThisMonth || 0} this month`}
                                gradient="from-blue-600 to-indigo-600" />
                            <StatCard icon={Stethoscope} label="Active Doctors" value={fmt(d?.doctors?.approved)}
                                sub={`${d?.doctors?.pending || 0} awaiting review`}
                                gradient="from-violet-600 to-purple-600" />
                            <StatCard icon={Calendar} label="Appointments" value={fmt(d?.appointments?.total)}
                                sub={`+${d?.appointments?.newThisWeek || 0} this week`}
                                gradient="from-emerald-500 to-teal-600"
                                sparkData={d?.appointments?.byDay} />
                            <StatCard icon={CreditCard} label="Total Revenue" value={fmtLKR(d?.payments?.totalRevenue)}
                                sub={`${fmtLKR(d?.payments?.revenueThisMonth)} this month`}
                                gradient="from-amber-500 to-orange-500" />
                        </div>

                        {/* ── Second row ── */}
                        <div className="grid grid-cols-3 gap-4">
                            {/* Appointment breakdown donut */}
                            <div className="card p-5">
                                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <Calendar size={15} className="text-blue-500" /> Appointment Status
                                </h3>
                                <DonutChart
                                    total={d?.appointments?.total || 0}
                                    label="total"
                                    segments={[
                                        { name: 'Completed', value: d?.appointments?.completed || 0, color: '#10b981' },
                                        { name: 'Accepted', value: d?.appointments?.accepted || 0, color: '#3b82f6' },
                                        { name: 'Pending', value: d?.appointments?.pending || 0, color: '#f59e0b' },
                                        { name: 'Cancelled', value: d?.appointments?.cancelled || 0, color: '#ef4444' },
                                    ]}
                                />
                            </div>

                            {/* Doctor status donut */}
                            <div className="card p-5">
                                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <Stethoscope size={15} className="text-violet-500" /> Doctor Status
                                </h3>
                                <DonutChart
                                    total={(d?.doctors?.approved || 0) + (d?.doctors?.pending || 0) + (d?.doctors?.rejected || 0)}
                                    label="total"
                                    segments={[
                                        { name: 'Approved', value: d?.doctors?.approved || 0, color: '#10b981' },
                                        { name: 'Pending', value: d?.doctors?.pending || 0, color: '#f59e0b' },
                                        { name: 'Rejected', value: d?.doctors?.rejected || 0, color: '#ef4444' },
                                    ]}
                                />
                            </div>

                            {/* Payment methods */}
                            <div className="card p-5">
                                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <Wallet size={15} className="text-amber-500" /> Revenue by Method
                                </h3>
                                {!d?.payments?.byMethod?.length ? (
                                    <div className="text-center py-4 text-slate-400 text-sm">No payment data</div>
                                ) : (
                                    <div className="space-y-3">
                                        {d.payments.byMethod.map(m => {
                                            const meta = METHOD_META[m._id] || { label: m._id, icon: '💰', color: 'bg-slate-100 text-slate-700' };
                                            return (
                                                <ProgressRow key={m._id}
                                                    label={meta.label} icon={meta.icon}
                                                    value={m.total} max={d?.payments?.totalRevenue || 1}
                                                    color={m._id === 'PAYHERE' ? '#f97316' : m._id === 'BANK_TRANSFER' ? '#3b82f6' : '#0ea5e9'}
                                                />
                                            );
                                        })}
                                        <div className="border-t border-slate-100 pt-2 flex justify-between">
                                            <span className="text-xs text-slate-500 font-medium">Total Revenue</span>
                                            <span className="text-xs font-bold text-slate-800">{fmtLKR(d?.payments?.totalRevenue)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Third row: Top specializations + Recent activity ── */}
                        <div className="grid grid-cols-5 gap-4">
                            {/* Top specializations */}
                            <div className="col-span-2 card p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                        <Star size={15} className="text-amber-500" /> Top Specializations
                                    </h3>
                                    <span className="text-xs text-slate-400">by bookings</span>
                                </div>
                                {!d?.topSpecializations?.length ? (
                                    <div className="text-center py-4 text-slate-400 text-sm">No booking data</div>
                                ) : (
                                    <div className="space-y-3">
                                        {d.topSpecializations.map((s, i) => {
                                            const maxVal = d.topSpecializations[0]?.count || 1;
                                            const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];
                                            return (
                                                <ProgressRow key={s._id}
                                                    label={s._id} icon={['🫀', '🧠', '🦷', '👶', '🦴'][i] || '⚕️'}
                                                    value={s.count} max={maxVal}
                                                    color={colors[i]}
                                                />
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Recent activity */}
                            <div className="col-span-3 card p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                        <Activity size={15} className="text-blue-500" /> Recent Payments
                                    </h3>
                                    <Link to="/admin/payments" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5">
                                        View all <ChevronRight size={12} />
                                    </Link>
                                </div>
                                {!d?.recentTransactions?.length ? (
                                    <div className="text-center py-6 text-slate-400 text-sm">No transactions yet</div>
                                ) : (
                                    <div className="space-y-2.5">
                                        {d.recentTransactions.map(txn => {
                                            const meta = METHOD_META[txn.method] || { label: txn.method, icon: '💰', color: 'bg-slate-100 text-slate-700' };
                                            const patName = txn.patientId?.patientProfile
                                                ? `${txn.patientId.patientProfile.firstName || ''} ${txn.patientId.patientProfile.lastName || ''}`.trim()
                                                : txn.patientId?.email?.split('@')[0] || 'Patient';
                                            const isOk = txn.status === 'SUCCESS' || txn.status === 'APPROVED';
                                            const isPend = txn.status === 'PENDING_APPROVAL';
                                            return (
                                                <div key={txn._id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                                                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${isOk ? 'bg-emerald-100' : isPend ? 'bg-amber-100' : 'bg-red-100'
                                                        }`}>
                                                        {isOk ? '✅' : isPend ? '⏳' : '❌'}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-semibold text-slate-800 truncate">{patName}</p>
                                                        <p className="text-[11px] text-slate-400">
                                                            {meta.icon} {meta.label} · Dr. {txn.appointmentId?.doctorId?.firstName} {txn.appointmentId?.doctorId?.lastName}
                                                        </p>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <p className="text-xs font-bold text-slate-800">LKR {txn.amount?.toLocaleString()}</p>
                                                        <p className="text-[10px] text-slate-400">
                                                            {new Date(txn.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Quick links ── */}
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: 'Doctor Applications', sub: `${d?.doctors?.pending || 0} pending`, path: '/admin', icon: ShieldCheck, color: 'from-blue-500 to-indigo-500', tab: 'doctors' },
                                { label: 'Payment Approvals', sub: `${d?.payments?.pendingApproval || 0} pending`, path: '/admin/payments', icon: CreditCard, color: 'from-amber-500 to-orange-500' },
                                { label: 'All Doctors', sub: `${(d?.doctors?.approved || 0)} verified`, path: '/admin/doctors', icon: BadgeCheck, color: 'from-emerald-500 to-teal-500' },
                            ].map(l => (
                                <Link to={l.path} key={l.label}
                                    className={`relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br ${l.color} text-white flex items-center gap-3 group hover:shadow-lg transition-all duration-200`}>
                                    <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                                        <l.icon size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold">{l.label}</p>
                                        <p className="text-xs text-white/70">{l.sub}</p>
                                    </div>
                                    <ArrowRight size={16} className="text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                    <div className="absolute -top-4 -right-4 h-16 w-16 rounded-full bg-white/10" />
                                </Link>
                            ))}
                        </div>
                    </>
                ) : (
                    /* ── Doctor Pending Reviews Tab ── */
                    <div className="space-y-4">
                        {/* Banner */}
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                            <ShieldCheck size={18} className="text-blue-600 shrink-0" />
                            <div className="flex-1">
                                <p className="text-sm font-bold text-blue-800">Manual SLMC Verification Required</p>
                                <p className="text-xs text-blue-600 mt-0.5">Before approving, verify at <a href="https://medicalcouncil.lk/" target="_blank" rel="noreferrer" className="underline font-semibold">medicalcouncil.lk</a></p>
                            </div>
                            <a href="https://medicalcouncil.lk/" target="_blank" rel="noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shrink-0">
                                <ExternalLink size={12} /> Verify
                            </a>
                        </div>

                        {pending.length === 0 ? (
                            <div className="card p-14 text-center">
                                <CheckCircle size={36} className="mx-auto text-emerald-400 mb-3" />
                                <p className="font-bold text-slate-700">All caught up!</p>
                                <p className="text-sm text-slate-400 mt-1">No pending doctor registrations.</p>
                            </div>
                        ) : (
                            <div className="card overflow-hidden">
                                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                                    <p className="text-sm font-bold text-slate-800">Pending Applications</p>
                                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">{pending.length} pending</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-slate-100 bg-slate-50/60">
                                                {['Doctor', 'SLMC', 'NIC', 'Phone', 'Specialization', 'Applied', 'Actions'].map(h => (
                                                    <th key={h} className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {pending.map(doc => (
                                                <tr key={doc._id} className={`hover:bg-slate-50/50 transition-colors ${updating === doc._id ? 'opacity-40 pointer-events-none' : ''}`}>
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                                                {doc.firstName?.[0]?.toUpperCase() || 'D'}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-semibold text-slate-800">Dr. {doc.firstName} {doc.lastName}</p>
                                                                <p className="text-xs text-slate-400">{doc.userId?.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className="font-mono font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg text-xs">{doc.slmcNumber}</span>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className="font-mono text-xs text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-lg font-semibold">{doc.nic || '—'}</span>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className="text-sm text-slate-600 font-medium">{doc.phone || '—'}</span>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className="text-sm font-medium text-slate-700">{doc.specialization}</span>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className="text-xs text-slate-400 flex items-center gap-1 whitespace-nowrap">
                                                            <Clock size={11} />
                                                            {new Date(doc.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <button onClick={() => setConfirm({ id: doc._id, name: `${doc.firstName} ${doc.lastName}`, status: 'APPROVED' })}
                                                                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors">
                                                                <CheckCircle size={12} /> Approve
                                                            </button>
                                                            <button onClick={() => setConfirm({ id: doc._id, name: `${doc.firstName} ${doc.lastName}`, status: 'REJECTED' })}
                                                                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-100 transition-colors">
                                                                <XCircle size={12} /> Reject
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default AdminDashboard;
