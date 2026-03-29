import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import { Badge, EmptyState, SectionHeader, InfoBanner, Toast } from '../components/ui/Common';
import {
<<<<<<< Updated upstream
    ShieldCheck, XCircle, CheckCircle, RefreshCw, ExternalLink,
    Clock, Users, Phone, AlertTriangle, IdCard,
=======
    Users, Stethoscope, Calendar, CreditCard, TrendingUp, TrendingDown,
    CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw, ShieldCheck,
    ArrowRight, Activity, ExternalLink, BarChart3, Wallet, Star,
    BadgeCheck, ChevronRight, CircleDot,
>>>>>>> Stashed changes
} from 'lucide-react';

// ── ConfirmModal ───────────────────────────────────────────────────────────────
const ConfirmModal = ({ action, onConfirm, onCancel }) => {
    if (!action) return null;
    const isApprove = action.status === 'APPROVED';
    const cfg = isApprove
        ? { color: 'emerald', label: 'Approve', Icon: CheckCircle, desc: 'This will grant the doctor full dashboard access.' }
        : { color: 'red', label: 'Reject', Icon: XCircle, desc: 'This will deny the doctor access to the platform.' };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)' }}
            onClick={onCancel}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Icon */}
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${isApprove ? 'bg-emerald-50' : 'bg-red-50'}`}>
                    <cfg.Icon size={28} className={isApprove ? 'text-emerald-500' : 'text-red-500'} />
                </div>

                {/* Body */}
                <h3 className="text-lg font-bold text-slate-900 text-center mb-1">
                    {cfg.label} Doctor?
                </h3>
                <p className="text-sm text-slate-500 text-center mb-1">
                    Dr. <strong>{action.name}</strong>
                </p>
                <p className="text-xs text-slate-400 text-center mb-5">{cfg.desc}</p>

                {/* Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95 shadow-sm ${isApprove
                                ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
                                : 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
                            }`}
                    >
                        {cfg.label}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── AdminDashboard ─────────────────────────────────────────────────────────────
const AdminDashboard = () => {
    const [pending, setPending] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null);
    const [toast, setToast] = useState(null);
    const [confirm, setConfirm] = useState(null); // { id, name, status }

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchPending = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/admin/doctors/pending');
            setPending(data);
        } catch (e) {
            console.error(e);
            showToast('Failed to load registrations.', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchPending(); }, [fetchPending]);

    const openConfirm = (doc, status) => {
        setConfirm({ id: doc._id, name: `${doc.firstName} ${doc.lastName}`, status });
    };

    const handleConfirm = async () => {
        const { id, name, status } = confirm;
        setConfirm(null);
        setUpdating(id);
        try {
            await api.patch(`/admin/doctors/${id}/approve`, { status });
            // Optimistic removal — no full reload needed
            setPending((prev) => prev.filter((d) => d._id !== id));
            showToast(
                `Dr. ${name} ${status === 'APPROVED' ? 'approved' : 'rejected'} successfully.`,
                status === 'APPROVED' ? 'success' : 'error',
            );
        } catch {
            showToast('Action failed. Please try again.', 'error');
        } finally {
            setUpdating(null);
        }
    };

    return (
        <>
            <Toast toast={toast} onDismiss={() => setToast(null)} />
            <ConfirmModal
                action={confirm}
                onConfirm={handleConfirm}
                onCancel={() => setConfirm(null)}
            />

            <div className="space-y-6">
                <SectionHeader
                    title="Doctor Registrations"
                    subtitle="Review incoming applications and verify SLMC credentials before approving"
                    badge={pending.length > 0 ? pending.length : undefined}
                    action={
                        <Button variant="ghost" size="sm" onClick={fetchPending} disabled={loading}>
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
                        </Button>
                    }
                />

                {/* Stats strip */}
                <div className="flex flex-wrap gap-3">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full border font-medium text-sm ${pending.length > 0
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                        {pending.length > 0 ? (
                            <><AlertTriangle size={14} /> {pending.length} pending review</>
                        ) : (
                            <><CheckCircle size={14} /> All applications reviewed</>
                        )}
                    </div>
                    <a
                        href="https://medicalcouncil.lk/"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-medium text-sm hover:bg-blue-100 transition-colors"
                    >
                        <ExternalLink size={14} /> Verify at medicalcouncil.lk
                    </a>
                </div>

                {/* Instruction banner */}
                <InfoBanner
                    icon={ShieldCheck}
                    title="Manual SLMC Verification Required"
                    description="Before approving, visit medicalcouncil.lk and search for the doctor's SLMC number to confirm their registration is valid and active."
                    variant="blue"
                />

                {/* Table */}
                {loading ? (
                    <div className="card p-8 space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="skeleton h-12 w-12 rounded-xl shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="skeleton h-3.5 w-1/3" />
                                    <div className="skeleton h-3 w-1/4" />
                                </div>
                                <div className="skeleton h-8 w-32 rounded-xl" />
                            </div>
                        ))}
                    </div>
                ) : pending.length === 0 ? (
                    <div className="card">
                        <EmptyState
                            icon={<Users size={28} />}
                            title="All caught up!"
                            description="No pending doctor registrations at the moment. New applications will appear here."
                        />
                    </div>
                ) : (
                    <div className="card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/60">
                                        {['Doctor', 'SLMC Number', 'NIC', 'Phone', 'Specialization', 'Applied', 'Actions'].map((h) => (
                                            <th key={h} className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {pending.map((doc) => (
                                        <tr
                                            key={doc._id}
                                            className={`table-row transition-opacity duration-300 ${updating === doc._id ? 'opacity-40 pointer-events-none' : ''}`}
                                        >
                                            {/* Doctor */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                                                        {doc.firstName?.[0]?.toUpperCase() || 'D'}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-slate-800 truncate">
                                                            Dr. {doc.firstName} {doc.lastName}
                                                        </p>
                                                        <p className="text-xs text-slate-400 truncate">{doc.userId?.email}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* SLMC */}
                                            <td className="px-5 py-4">
                                                <span className="font-mono font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg text-sm">
                                                    {doc.slmcNumber}
                                                </span>
                                            </td>

                                            {/* NIC */}
                                            <td className="px-5 py-4">
                                                {doc.nic ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <IdCard size={13} className="text-amber-500 shrink-0" />
                                                        <span className="font-mono font-semibold text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-lg text-sm">
                                                            {doc.nic}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">—</span>
                                                )}
                                            </td>

                                            {/* Phone */}
                                            <td className="px-5 py-4">
                                                {doc.phone ? (
                                                    <div className="flex items-center gap-1.5 text-sm text-slate-700">
                                                        <Phone size={13} className="text-slate-400 shrink-0" />
                                                        <span className="font-medium">{doc.phone}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">—</span>
                                                )}
                                            </td>

                                            {/* Specialization */}
                                            <td className="px-5 py-4">
                                                <span className="text-sm font-medium text-slate-700">{doc.specialization}</span>
                                            </td>

                                            {/* Applied */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-1 text-xs text-slate-400 whitespace-nowrap">
                                                    <Clock size={12} />
                                                    {new Date(doc.createdAt).toLocaleDateString('en-US', {
                                                        day: '2-digit', month: 'short', year: 'numeric',
                                                    })}
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => openConfirm(doc, 'APPROVED')}
                                                        disabled={!!updating}
                                                        className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
                                                    >
                                                        <CheckCircle size={13} /> Approve
                                                    </button>
                                                    <button
                                                        onClick={() => openConfirm(doc, 'REJECTED')}
                                                        disabled={!!updating}
                                                        className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-100 transition-all active:scale-95 disabled:opacity-50"
                                                    >
                                                        <XCircle size={13} /> Reject
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
        </>
    );
};

export default AdminDashboard;
