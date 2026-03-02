import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
    Users, Stethoscope, ShieldCheck, Search, RefreshCw, PlusCircle,
    Trash2, ToggleLeft, ToggleRight, Edit2, X, CheckCircle, XCircle,
    Eye, User, Mail, Phone, Calendar, IdCard, AlertTriangle, Lock,
    ChevronLeft, ChevronRight as ChevronRightIcon, Save,
} from 'lucide-react';

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const Avatar = ({ name, email, size = 9, gradient = 'from-blue-600 to-indigo-500' }) => {
    const letter = (name?.[0] || email?.[0] || '?').toUpperCase();
    return (
        <div className={`h-${size} w-${size} rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
            {letter}
        </div>
    );
};

// ── Confirm Delete Modal ───────────────────────────────────────────────────────
const DeleteModal = ({ target, onConfirm, onClose }) => {
    if (!target) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)' }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-up" onClick={e => e.stopPropagation()}>
                <div className="h-14 w-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
                    <Trash2 size={24} className="text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 text-center">Delete Account?</h3>
                <p className="text-sm text-slate-500 text-center mt-1 mb-5">
                    This will permanently delete <strong>{target.email}</strong>. This action cannot be undone.
                </p>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                    <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors">Delete</button>
                </div>
            </div>
        </div>
    );
};

// ── View Patient Modal ────────────────────────────────────────────────────────
const PatientModal = ({ patient, onClose }) => {
    if (!patient) return null;
    const p = patient.patientProfile || {};
    const fullName = `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'N/A';
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)' }} onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-up" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-xl bg-white/20 flex items-center justify-center font-bold text-lg">
                            {(p.firstName?.[0] || patient.email[0]).toUpperCase()}
                        </div>
                        <div>
                            <p className="font-bold">{fullName}</p>
                            <p className="text-blue-100 text-xs">{patient.email}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="h-8 w-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                        <X size={16} />
                    </button>
                </div>

                <div className="p-5 space-y-3">
                    {[
                        { icon: User, label: 'Full Name', value: fullName },
                        { icon: Mail, label: 'Email', value: patient.email },
                        { icon: Phone, label: 'Phone', value: p.phone || '—' },
                        { icon: IdCard, label: 'NIC', value: p.nic || '—' },
                        { icon: Calendar, label: 'Date of Birth', value: p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : '—' },
                        { icon: Calendar, label: 'Registered', value: fmt(patient.createdAt) },
                    ].map(({ icon: Icon, label, value }) => (
                        <div key={label} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                                <Icon size={14} className="text-blue-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
                                <p className="text-sm font-semibold text-slate-800">{value}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ── Admin Form Modal (create / edit) ──────────────────────────────────────────
const AdminFormModal = ({ admin, onSave, onClose }) => {
    const isEdit = !!admin?._id;
    const [form, setForm] = useState({
        firstName: admin?.patientProfile?.firstName || '',
        lastName: admin?.patientProfile?.lastName || '',
        email: admin?.email || '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async () => {
        if (!form.email) { setError('Email is required'); return; }
        if (!isEdit && !form.password) { setError('Password is required'); return; }
        setLoading(true);
        setError('');
        try {
            const payload = { email: form.email, firstName: form.firstName, lastName: form.lastName };
            if (form.password) payload.password = form.password;
            await onSave(payload, admin?._id);
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Operation failed');
        } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)' }} onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-up" onClick={e => e.stopPropagation()}>
                <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-5 text-white flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-base">{isEdit ? 'Edit Admin' : 'Create New Admin'}</h3>
                        <p className="text-violet-100 text-xs">{isEdit ? `Updating ${admin.email}` : 'Add a new administrator'}</p>
                    </div>
                    <button onClick={onClose} className="h-8 w-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                        <X size={16} />
                    </button>
                </div>

                <div className="p-5 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">First Name</label>
                            <input className="input-field w-full text-sm" placeholder="John" value={form.firstName} onChange={e => set('firstName', e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Last Name</label>
                            <input className="input-field w-full text-sm" placeholder="Doe" value={form.lastName} onChange={e => set('lastName', e.target.value)} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email *</label>
                        <input type="email" className="input-field w-full text-sm" placeholder="admin@mediportal.lk" value={form.email} onChange={e => set('email', e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                            Password {isEdit && <span className="font-normal text-slate-400">(leave blank to keep current)</span>}
                        </label>
                        <input type="password" className="input-field w-full text-sm" placeholder={isEdit ? 'New password (optional)' : 'Min 6 characters'} value={form.password} onChange={e => set('password', e.target.value)} />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                            <AlertTriangle size={14} className="shrink-0" /> {error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-1">
                        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                        <button onClick={handleSubmit} disabled={loading}
                            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-semibold hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
                            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                            {isEdit ? 'Save Changes' : 'Create Admin'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── Toast ─────────────────────────────────────────────────────────────────────
const Toast = ({ msg, type, onDismiss }) => {
    if (!msg) return null;
    return (
        <div onClick={onDismiss} className={`fixed top-5 right-5 z-[999] flex items-center gap-2.5 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-semibold cursor-pointer animate-fade-up ${type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
            {type === 'error' ? <XCircle size={15} /> : <CheckCircle size={15} />}
            {msg}
        </div>
    );
};

// ── Pagination bar ────────────────────────────────────────────────────────────
const Pagination = ({ page, pages, onPage }) => {
    if (pages <= 1) return null;
    return (
        <div className="flex items-center justify-center gap-2 pt-2">
            <button onClick={() => onPage(page - 1)} disabled={page === 1}
                className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:border-blue-400 disabled:opacity-40 transition-colors">
                <ChevronLeft size={14} />
            </button>
            <span className="text-xs font-semibold text-slate-600">Page {page} of {pages}</span>
            <button onClick={() => onPage(page + 1)} disabled={page === pages}
                className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:border-blue-400 disabled:opacity-40 transition-colors">
                <ChevronRightIcon size={14} />
            </button>
        </div>
    );
};

// ── Main component ────────────────────────────────────────────────────────────
const AdminUserManagement = () => {
    const [tab, setTab] = useState('patients');
    const [search, setSearch] = useState('');

    // Patients
    const [patients, setPatients] = useState([]);
    const [patPage, setPatPage] = useState(1);
    const [patPages, setPatPages] = useState(1);
    const [patTotal, setPatTotal] = useState(0);

    // Doctors
    const [doctors, setDoctors] = useState([]);

    // Admins
    const [admins, setAdmins] = useState([]);

    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [viewPatient, setViewPatient] = useState(null);
    const [adminForm, setAdminForm] = useState(null); // null | {} | admin object

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchPatients = useCallback(async (q = search, pg = patPage) => {
        setLoading(true);
        try {
            const { data } = await api.get(`/admin/patients`, { params: { search: q, page: pg, limit: 15 } });
            setPatients(data.patients);
            setPatPage(data.page);
            setPatPages(data.pages);
            setPatTotal(data.total);
        } catch { showToast('Failed to load patients', 'error'); }
        finally { setLoading(false); }
    }, [search, patPage]);

    const fetchDoctors = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/admin/doctors');
            setDoctors(data);
        } catch { showToast('Failed to load doctors', 'error'); }
        finally { setLoading(false); }
    }, []);

    const fetchAdmins = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/admin/admins');
            setAdmins(data);
        } catch { showToast('Failed to load admins', 'error'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        if (tab === 'patients') fetchPatients(search, 1);
        else if (tab === 'doctors') fetchDoctors();
        else if (tab === 'admins') fetchAdmins();
    }, [tab]);

    // Live search debounce
    useEffect(() => {
        if (tab !== 'patients') return;
        const t = setTimeout(() => fetchPatients(search, 1), 400);
        return () => clearTimeout(t);
    }, [search]);

    const handleDelete = async () => {
        const id = deleteTarget._id;
        setDeleteTarget(null);
        try {
            await api.delete(`/admin/users/${id}`);
            showToast('User deleted successfully');
            if (tab === 'patients') fetchPatients();
            else if (tab === 'doctors') fetchDoctors();
            else fetchAdmins();
        } catch (err) { showToast(err.response?.data?.message || 'Delete failed', 'error'); }
    };

    const handleToggleActive = async (userId) => {
        try {
            const { data } = await api.patch(`/admin/users/${userId}/toggle-active`);
            showToast(data.message);
            if (tab === 'doctors') fetchDoctors();
        } catch (err) { showToast(err.response?.data?.message || 'Toggle failed', 'error'); }
    };

    const handleAdminSave = async (payload, id) => {
        if (id) {
            await api.patch(`/admin/admins/${id}`, payload);
        } else {
            await api.post('/admin/admins', payload);
        }
        fetchAdmins();
        showToast(id ? 'Admin updated' : 'Admin created');
    };

    const TABS = [
        { key: 'patients', label: 'Patients', count: patTotal, icon: Users, gradient: 'from-blue-500 to-indigo-500' },
        { key: 'doctors', label: 'Doctors', count: doctors.length, icon: Stethoscope, gradient: 'from-violet-500 to-purple-500' },
        { key: 'admins', label: 'Admins', count: admins.length, icon: ShieldCheck, gradient: 'from-emerald-500 to-teal-500' },
    ];

    const STATUS_COLORS = {
        APPROVED: 'bg-emerald-100 text-emerald-700',
        PENDING: 'bg-amber-100 text-amber-700',
        REJECTED: 'bg-red-100 text-red-700',
    };

    return (
        <>
            <Toast msg={toast?.msg} type={toast?.type} onDismiss={() => setToast(null)} />
            <DeleteModal target={deleteTarget} onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} />
            <PatientModal patient={viewPatient} onClose={() => setViewPatient(null)} />
            {adminForm !== null && (
                <AdminFormModal
                    admin={adminForm?._id ? adminForm : null}
                    onSave={handleAdminSave}
                    onClose={() => setAdminForm(null)}
                />
            )}

            <div className="space-y-5">
                {/* ── Header ── */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">User Management</h1>
                        <p className="text-sm text-slate-400">Manage patients, doctors and administrators</p>
                    </div>
                    {tab === 'admins' && (
                        <button onClick={() => setAdminForm({})}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-semibold shadow-sm shadow-violet-500/20 hover:from-violet-700 hover:to-purple-700 transition-all">
                            <PlusCircle size={15} /> New Admin
                        </button>
                    )}
                </div>

                {/* ── Tab cards ── */}
                <div className="grid grid-cols-3 gap-3">
                    {TABS.map(t => (
                        <button key={t.key} onClick={() => setTab(t.key)}
                            className={`relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-200 ${tab === t.key
                                    ? `bg-gradient-to-br ${t.gradient} text-white shadow-lg`
                                    : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:shadow-sm'
                                }`}>
                            <div className={`h-9 w-9 rounded-xl flex items-center justify-center mb-3 ${tab === t.key ? 'bg-white/20' : 'bg-slate-100'}`}>
                                <t.icon size={17} className={tab === t.key ? 'text-white' : 'text-slate-600'} />
                            </div>
                            <p className={`text-2xl font-bold ${tab === t.key ? 'text-white' : 'text-slate-800'}`}>{t.count}</p>
                            <p className={`text-xs font-semibold mt-0.5 ${tab === t.key ? 'text-white/80' : 'text-slate-500'}`}>{t.label}</p>
                            {tab === t.key && <div className="absolute -top-4 -right-4 h-16 w-16 rounded-full bg-white/10" />}
                        </button>
                    ))}
                </div>

                {/* ── Search bar ── */}
                <div className="flex items-center gap-2">
                    {tab === 'patients' && (
                        <div className="relative flex-1 max-w-sm">
                            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search by name, email or NIC…"
                                className="input-field w-full pl-9 text-sm"
                            />
                        </div>
                    )}
                    <button onClick={() => { if (tab === 'patients') fetchPatients(); else if (tab === 'doctors') fetchDoctors(); else fetchAdmins(); }}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-500 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors">
                        <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                {/* ── Content ── */}
                {loading ? (
                    <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="card p-4 flex items-center gap-3">
                                <div className="skeleton h-10 w-10 rounded-xl shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="skeleton h-3.5 w-1/3" />
                                    <div className="skeleton h-3 w-1/4" />
                                </div>
                                <div className="skeleton h-7 w-24 rounded-lg" />
                            </div>
                        ))}
                    </div>
                ) : (

                    // ── PATIENTS TAB ─────────────────────────────────────────────
                    tab === 'patients' ? (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-slate-400 font-medium">{patTotal} patient{patTotal !== 1 ? 's' : ''} found</p>
                            </div>
                            {patients.length === 0 ? (
                                <div className="card p-12 text-center">
                                    <Users size={32} className="mx-auto text-slate-300 mb-3" />
                                    <p className="font-semibold text-slate-600">No patients found</p>
                                </div>
                            ) : (
                                <div className="card overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-slate-100 bg-slate-50/60">
                                                {['Patient', 'NIC', 'Phone', 'DOB', 'Registered', 'Actions'].map(h => (
                                                    <th key={h} className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {patients.map(pat => {
                                                const p = pat.patientProfile || {};
                                                const name = `${p.firstName || ''} ${p.lastName || ''}`.trim() || '—';
                                                return (
                                                    <tr key={pat._id} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-5 py-3.5">
                                                            <div className="flex items-center gap-3">
                                                                <Avatar name={name} email={pat.email} />
                                                                <div>
                                                                    <p className="text-sm font-semibold text-slate-800">{name}</p>
                                                                    <p className="text-xs text-slate-400">{pat.email}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-3.5">
                                                            <span className="text-xs font-mono font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg">{p.nic || '—'}</span>
                                                        </td>
                                                        <td className="px-5 py-3.5">
                                                            <span className="text-sm text-slate-600">{p.phone || '—'}</span>
                                                        </td>
                                                        <td className="px-5 py-3.5">
                                                            <span className="text-xs text-slate-500">{p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString('en-GB') : '—'}</span>
                                                        </td>
                                                        <td className="px-5 py-3.5">
                                                            <span className="text-xs text-slate-400">{fmt(pat.createdAt)}</span>
                                                        </td>
                                                        <td className="px-5 py-3.5">
                                                            <div className="flex items-center gap-1.5">
                                                                <button onClick={() => setViewPatient(pat)}
                                                                    className="h-7 w-7 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center text-blue-600 transition-colors" title="View details">
                                                                    <Eye size={13} />
                                                                </button>
                                                                <button onClick={() => setDeleteTarget(pat)}
                                                                    className="h-7 w-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500 transition-colors" title="Delete">
                                                                    <Trash2 size={13} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                    <div className="p-4 border-t border-slate-100">
                                        <Pagination page={patPage} pages={patPages} onPage={pg => { setPatPage(pg); fetchPatients(search, pg); }} />
                                    </div>
                                </div>
                            )}
                        </div>
                    )

                        // ── DOCTORS TAB ──────────────────────────────────────────────
                        : tab === 'doctors' ? (
                            <div className="card overflow-hidden">
                                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                                    <p className="text-sm font-bold text-slate-800">All Doctors</p>
                                    <span className="text-xs text-slate-400">{doctors.length} total</span>
                                </div>
                                {doctors.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <Stethoscope size={32} className="mx-auto text-slate-300 mb-3" />
                                        <p className="text-sm text-slate-500">No doctors registered</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-slate-100 bg-slate-50/60">
                                                {['Doctor', 'Specialization', 'SLMC', 'Status', 'Active', 'Joined', 'Actions'].map(h => (
                                                    <th key={h} className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {doctors.map(doc => (
                                                <tr key={doc._id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-5 py-3.5">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar name={doc.firstName} email={doc.userId?.email} gradient="from-violet-600 to-purple-500" />
                                                            <div>
                                                                <p className="text-sm font-semibold text-slate-800">Dr. {doc.firstName} {doc.lastName}</p>
                                                                <p className="text-xs text-slate-400">{doc.userId?.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3.5">
                                                        <span className="text-sm text-slate-700 font-medium">{doc.specialization}</span>
                                                    </td>
                                                    <td className="px-5 py-3.5">
                                                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg">{doc.slmcNumber}</span>
                                                    </td>
                                                    <td className="px-5 py-3.5">
                                                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${STATUS_COLORS[doc.approvalStatus] || 'bg-slate-100 text-slate-500'}`}>
                                                            {doc.approvalStatus}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3.5">
                                                        <button onClick={() => handleToggleActive(doc.userId?._id)}
                                                            className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${doc.isActive ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}>
                                                            {doc.isActive ? <><ToggleRight size={14} /> Active</> : <><ToggleLeft size={14} /> Inactive</>}
                                                        </button>
                                                    </td>
                                                    <td className="px-5 py-3.5">
                                                        <span className="text-xs text-slate-400">{fmt(doc.createdAt)}</span>
                                                    </td>
                                                    <td className="px-5 py-3.5">
                                                        <button onClick={() => setDeleteTarget({ _id: doc.userId?._id, email: doc.userId?.email || `Dr. ${doc.firstName}` })}
                                                            className="h-7 w-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500 transition-colors" title="Delete account">
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )

                            // ── ADMINS TAB ───────────────────────────────────────────────
                            : (
                                <div className="space-y-3">
                                    {admins.length === 0 ? (
                                        <div className="card p-12 text-center">
                                            <ShieldCheck size={32} className="mx-auto text-slate-300 mb-3" />
                                            <p className="text-sm text-slate-500">No admins found</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {admins.map(admin => {
                                                const name = `${admin.patientProfile?.firstName || ''} ${admin.patientProfile?.lastName || ''}`.trim();
                                                return (
                                                    <div key={admin._id} className="card p-4 flex items-center gap-3 hover:shadow-md transition-all duration-200">
                                                        <Avatar name={name || admin.email} email={admin.email} gradient="from-emerald-500 to-teal-500" size={11} />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-bold text-slate-800">{name || 'Administrator'}</p>
                                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">ADMIN</span>
                                                            </div>
                                                            <p className="text-xs text-slate-400">{admin.email}</p>
                                                            <p className="text-[10px] text-slate-300 mt-0.5">Joined {fmt(admin.createdAt)}</p>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                            <button onClick={() => setAdminForm(admin)}
                                                                className="h-8 w-8 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center text-blue-600 transition-colors" title="Edit">
                                                                <Edit2 size={13} />
                                                            </button>
                                                            <button onClick={() => setDeleteTarget(admin)}
                                                                className="h-8 w-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500 transition-colors" title="Delete">
                                                                <Trash2 size={13} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )
                )}
            </div>
        </>
    );
};

export default AdminUserManagement;
