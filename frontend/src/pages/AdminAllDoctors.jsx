import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
<<<<<<< Updated upstream
import {
    Users, RefreshCw, CheckCircle, XCircle, Clock, Trash2,
    Shield, ShieldCheck, ShieldX, Search, IdCard, Phone,
} from 'lucide-react';

const STATUS_CFG = {
    APPROVED: { label: 'Approved', cls: 'bg-emerald-100 text-emerald-700', Icon: ShieldCheck },
    PENDING: { label: 'Pending', cls: 'bg-amber-100 text-amber-700', Icon: Clock },
    REJECTED: { label: 'Rejected', cls: 'bg-red-100 text-red-700', Icon: ShieldX },
};

// ── Confirmation Modal ────────────────────────────────────────────────────────
const ConfirmModal = ({ action, onConfirm, onCancel }) => {
    if (!action) return null;
    const isDelete = action.type === 'delete';
    const isApprove = action.status === 'APPROVED';
    const color = isDelete ? 'red' : isApprove ? 'emerald' : 'red';
    const label = isDelete ? 'Delete' : isApprove ? 'Approve' : 'Reject';
    const Icon = isDelete ? Trash2 : isApprove ? CheckCircle : XCircle;
    const desc = isDelete
        ? 'This will permanently remove the doctor and their account. This action cannot be undone.'
        : isApprove
            ? 'This will grant the doctor full dashboard access.'
            : 'This will deny the doctor access to the platform.';
=======
import {
    Users, RefreshCw, CheckCircle, XCircle, Clock, Trash2,
    ShieldCheck, ShieldX, Search, IdCard, Phone,
} from 'lucide-react';

const STATUS_CFG = {
    APPROVED: { label: 'Approved', cls: 'bg-emerald-100 text-emerald-700', Icon: ShieldCheck },
    PENDING: { label: 'Pending', cls: 'bg-amber-100 text-amber-700', Icon: Clock },
    REJECTED: { label: 'Rejected', cls: 'bg-red-100 text-red-700', Icon: ShieldX },
};

const FILTER_PILLS = [
    { key: 'ALL', label: 'All', cls: 'bg-slate-100 text-slate-700 border-slate-200', active: 'bg-slate-800 text-white border-slate-800' },
    { key: 'APPROVED', label: 'Approved', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', active: 'bg-emerald-600 text-white border-emerald-600' },
    { key: 'PENDING', label: 'Pending', cls: 'bg-amber-50 text-amber-700 border-amber-200', active: 'bg-amber-500 text-white border-amber-500' },
    { key: 'REJECTED', label: 'Rejected', cls: 'bg-red-50 text-red-700 border-red-200', active: 'bg-red-500 text-white border-red-500' },
];

const ACTION_CFG = {
    delete: {
        label: 'Delete',
        Icon: Trash2,
        iconWrapCls: 'bg-red-50',
        iconCls: 'text-red-500',
        buttonCls: 'bg-red-500 hover:bg-red-600',
        description: 'This will permanently remove the doctor and their account. This action cannot be undone.',
    },
    APPROVED: {
        label: 'Approve',
        Icon: CheckCircle,
        iconWrapCls: 'bg-emerald-50',
        iconCls: 'text-emerald-500',
        buttonCls: 'bg-emerald-500 hover:bg-emerald-600',
        description: 'This will grant the doctor full dashboard access.',
    },
    REJECTED: {
        label: 'Reject',
        Icon: XCircle,
        iconWrapCls: 'bg-red-50',
        iconCls: 'text-red-500',
        buttonCls: 'bg-red-500 hover:bg-red-600',
        description: 'This will deny the doctor access to the platform.',
    },
};

const getDoctorName = (doctor) => `${doctor.firstName} ${doctor.lastName}`;

// ── Confirmation Modal ────────────────────────────────────────────────────────
const ConfirmModal = ({ action, onConfirm, onCancel }) => {
    if (!action) return null;
    const cfg = action.type === 'delete' ? ACTION_CFG.delete : ACTION_CFG[action.status];
    const { label, Icon, description, iconWrapCls, iconCls, buttonCls } = cfg;
>>>>>>> Stashed changes

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)' }}
            onClick={onCancel}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-up"
                onClick={e => e.stopPropagation()}>
<<<<<<< Updated upstream
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-${color}-50`}>
                    <Icon size={28} className={`text-${color}-500`} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 text-center mb-1">{label} Doctor?</h3>
                <p className="text-sm text-slate-500 text-center mb-1">Dr. <strong>{action.name}</strong></p>
                <p className="text-xs text-slate-400 text-center mb-5">{desc}</p>
=======
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${iconWrapCls}`}>
                    <Icon size={28} className={iconCls} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 text-center mb-1">{label} Doctor?</h3>
                <p className="text-sm text-slate-500 text-center mb-1">Dr. <strong>{action.name}</strong></p>
                <p className="text-xs text-slate-400 text-center mb-5">{description}</p>
>>>>>>> Stashed changes
                <div className="flex gap-3">
                    <button onClick={onCancel}
                        className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                        Cancel
                    </button>
<<<<<<< Updated upstream
                    <button onClick={onConfirm}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95 shadow-sm bg-${color}-500 hover:bg-${color}-600`}>
                        {label}
                    </button>
=======
                    <button onClick={onConfirm}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95 shadow-sm ${buttonCls}`}>
                        {label}
                    </button>
>>>>>>> Stashed changes
                </div>
            </div>
        </div>
    );
};

// ── AdminAllDoctors ───────────────────────────────────────────────────────────
const AdminAllDoctors = () => {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null);
    const [confirm, setConfirm] = useState(null);
    const [toast, setToast] = useState(null);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('ALL');

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchDoctors = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/admin/doctors');
            setDoctors(data);
        } catch {
            showToast('Failed to load doctors.', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchDoctors(); }, [fetchDoctors]);

<<<<<<< Updated upstream
    const openApprove = (doc, status) => setConfirm({ type: 'approve', id: doc._id, name: `${doc.firstName} ${doc.lastName}`, status });
    const openDelete = (doc) => setConfirm({ type: 'delete', id: doc._id, name: `${doc.firstName} ${doc.lastName}` });
=======
    const openApprove = (doc, status) => setConfirm({ type: 'approve', id: doc._id, name: getDoctorName(doc), status });
    const openDelete = (doc) => setConfirm({ type: 'delete', id: doc._id, name: getDoctorName(doc) });
>>>>>>> Stashed changes

    const handleConfirm = async () => {
        const { id, name, type, status } = confirm;
        setConfirm(null);
        setUpdating(id);
        try {
            if (type === 'delete') {
                await api.delete(`/admin/doctors/${id}`);
                setDoctors(prev => prev.filter(d => d._id !== id));
                showToast(`Dr. ${name} permanently deleted.`, 'error');
            } else {
                await api.patch(`/admin/doctors/${id}/approve`, { status });
                setDoctors(prev => prev.map(d => d._id === id
                    ? { ...d, approvalStatus: status, isActive: status === 'APPROVED' }
                    : d
                ));
                showToast(`Dr. ${name} ${status === 'APPROVED' ? 'approved' : 'rejected'}.`,
                    status === 'APPROVED' ? 'success' : 'error');
            }
        } catch {
            showToast('Action failed. Please try again.', 'error');
        } finally {
            setUpdating(null);
        }
    };

    const filtered = doctors.filter(d => {
        const q = search.toLowerCase();
        const matchSearch = !q || `${d.firstName} ${d.lastName} ${d.specialization} ${d.slmcNumber} ${d.nic || ''}`.toLowerCase().includes(q);
        const matchFilter = filter === 'ALL' || d.approvalStatus === filter;
        return matchSearch && matchFilter;
    });

    const counts = {
        ALL: doctors.length,
        APPROVED: doctors.filter(d => d.approvalStatus === 'APPROVED').length,
        PENDING: doctors.filter(d => d.approvalStatus === 'PENDING').length,
        REJECTED: doctors.filter(d => d.approvalStatus === 'REJECTED').length,
    };

    return (
        <>
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl font-medium text-sm animate-slide-in-right ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
                    {toast.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    {toast.msg}
                </div>
            )}

            <ConfirmModal action={confirm} onConfirm={handleConfirm} onCancel={() => setConfirm(null)} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Users size={20} className="text-blue-500" /> All Doctors
                        </h1>
                        <p className="text-sm text-slate-400 mt-0.5">Manage all registered doctors — approve, reject, or remove accounts</p>
                    </div>
                    <button onClick={fetchDoctors} disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-semibold text-slate-700 transition-colors disabled:opacity-50">
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                </div>

<<<<<<< Updated upstream
                {/* Stats Pills */}
                <div className="flex flex-wrap gap-2">
                    {[
                        { key: 'ALL', label: 'All', cls: 'bg-slate-100 text-slate-700 border-slate-200', active: 'bg-slate-800 text-white border-slate-800' },
                        { key: 'APPROVED', label: 'Approved', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', active: 'bg-emerald-600 text-white border-emerald-600' },
                        { key: 'PENDING', label: 'Pending', cls: 'bg-amber-50 text-amber-700 border-amber-200', active: 'bg-amber-500 text-white border-amber-500' },
                        { key: 'REJECTED', label: 'Rejected', cls: 'bg-red-50 text-red-700 border-red-200', active: 'bg-red-500 text-white border-red-500' },
                    ].map(({ key, label, cls, active }) => (
                        <button key={key} onClick={() => setFilter(key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold transition-all ${filter === key ? active : cls}`}>
                            {label}
=======
                {/* Stats Pills */}
                <div className="flex flex-wrap gap-2">
                    {FILTER_PILLS.map(({ key, label, cls, active }) => (
                        <button key={key} onClick={() => setFilter(key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold transition-all ${filter === key ? active : cls}`}>
                            {label}
>>>>>>> Stashed changes
                            <span className={`inline-flex items-center justify-center h-5 min-w-[20px] rounded-full text-xs font-bold px-1 ${filter === key ? 'bg-white/20' : 'bg-black/5'}`}>
                                {counts[key]}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search by name, specialization, SLMC, or NIC…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="input-field pl-9 w-full"
                    />
                </div>

                {/* Table */}
                {loading ? (
                    <div className="card p-8 space-y-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="skeleton h-11 w-11 rounded-xl shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="skeleton h-3.5 w-1/3" />
                                    <div className="skeleton h-3 w-1/5" />
                                </div>
                                <div className="skeleton h-7 w-24 rounded-full" />
                                <div className="skeleton h-8 w-32 rounded-xl" />
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="card p-12 text-center">
                        <Users size={32} className="mx-auto text-slate-300 mb-3" />
                        <p className="font-semibold text-slate-500">
                            {search || filter !== 'ALL' ? 'No doctors match your search.' : 'No doctors registered yet.'}
                        </p>
                    </div>
                ) : (
                    <div className="card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/60">
                                        {['Doctor', 'SLMC', 'NIC', 'Phone', 'Specialization', 'Status', 'Joined', 'Actions'].map(h => (
                                            <th key={h} className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filtered.map(doc => {
                                        const cfg = STATUS_CFG[doc.approvalStatus] || STATUS_CFG.PENDING;
                                        return (
                                            <tr key={doc._id}
                                                className={`transition-opacity duration-300 hover:bg-slate-50/50 ${updating === doc._id ? 'opacity-40 pointer-events-none' : ''}`}>
                                                {/* Doctor */}
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                                                            {doc.firstName?.[0]?.toUpperCase() || 'D'}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-semibold text-slate-800 truncate">Dr. {doc.firstName} {doc.lastName}</p>
                                                            <p className="text-xs text-slate-400 truncate">{doc.userId?.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                {/* SLMC */}
                                                <td className="px-5 py-4">
                                                    <span className="font-mono text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg">
                                                        {doc.slmcNumber}
                                                    </span>
                                                </td>
                                                {/* NIC */}
                                                <td className="px-5 py-4">
                                                    {doc.nic ? (
                                                        <span className="font-mono text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-lg flex items-center gap-1 w-fit">
                                                            <IdCard size={12} className="text-amber-500 shrink-0" /> {doc.nic}
                                                        </span>
                                                    ) : <span className="text-xs text-slate-400 italic">—</span>}
                                                </td>
                                                {/* Phone */}
                                                <td className="px-5 py-4">
                                                    {doc.phone ? (
                                                        <span className="text-sm text-slate-700 flex items-center gap-1">
                                                            <Phone size={12} className="text-slate-400 shrink-0" /> {doc.phone}
                                                        </span>
                                                    ) : <span className="text-xs text-slate-400 italic">—</span>}
                                                </td>
                                                {/* Specialization */}
                                                <td className="px-5 py-4">
                                                    <span className="text-sm font-medium text-slate-700">{doc.specialization}</span>
                                                </td>
                                                {/* Status */}
                                                <td className="px-5 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.cls}`}>
                                                        <cfg.Icon size={12} /> {cfg.label}
                                                    </span>
                                                </td>
                                                {/* Joined */}
                                                <td className="px-5 py-4">
                                                    <span className="text-xs text-slate-400 whitespace-nowrap">
                                                        {new Date(doc.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </span>
                                                </td>
                                                {/* Actions */}
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        {doc.approvalStatus !== 'APPROVED' && (
                                                            <button onClick={() => openApprove(doc, 'APPROVED')} disabled={!!updating}
                                                                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50">
                                                                <CheckCircle size={11} /> Approve
                                                            </button>
                                                        )}
                                                        {doc.approvalStatus !== 'REJECTED' && (
                                                            <button onClick={() => openApprove(doc, 'REJECTED')} disabled={!!updating}
                                                                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-100 transition-all active:scale-95 disabled:opacity-50">
                                                                <XCircle size={11} /> Reject
                                                            </button>
                                                        )}
                                                        <button onClick={() => openDelete(doc)} disabled={!!updating}
                                                            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 transition-all active:scale-95 disabled:opacity-50">
                                                            <Trash2 size={11} /> Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/60 text-xs text-slate-400">
                            Showing {filtered.length} of {doctors.length} doctors
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default AdminAllDoctors;
