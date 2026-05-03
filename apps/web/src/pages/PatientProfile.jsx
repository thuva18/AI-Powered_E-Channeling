import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import {
    User, Mail, Phone, Calendar, Save, CheckCircle,
    AlertCircle, IdCard, Shield, Edit3, Trash2, TriangleAlert,
} from 'lucide-react';

const NIC_REGEX = /^(\d{9}[Vv]|\d{12})$/;
const PHONE_REGEX = /^(07\d{8}|\+94\d{9})$/;

const PatientProfile = () => {
    const { user, updateUser, logout } = useAuthStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [form, setForm] = useState({
        firstName: '', lastName: '', phone: '', nic: '', dateOfBirth: '',
    });
    const [errors, setErrors] = useState({});
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deleting, setDeleting] = useState(false);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    useEffect(() => {
        api.get('/patients/profile')
            .then(({ data }) => {
                setForm({
                    firstName: data.firstName || '',
                    lastName: data.lastName || '',
                    phone: data.phone || '',
                    nic: data.nic || '',
                    dateOfBirth: data.dateOfBirth ? data.dateOfBirth.substring(0, 10) : '',
                });
            })
            .catch(() => showToast('Failed to load profile', 'error'))
            .finally(() => setLoading(false));
    }, []);

    const set = (field) => (e) => {
        setForm(p => ({ ...p, [field]: e.target.value }));
        setErrors(p => ({ ...p, [field]: '' }));
    };

    const validate = () => {
        const e = {};
        if (!form.firstName.trim()) e.firstName = 'First name is required';
        if (!form.lastName.trim()) e.lastName = 'Last name is required';
        if (form.phone && !PHONE_REGEX.test(form.phone.trim()))
            e.phone = 'Format: 07XXXXXXXX or +94XXXXXXXXX';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSave = async (ev) => {
        ev.preventDefault();
        if (!validate()) return;
        setSaving(true);
        try {
            await api.put('/patients/profile', {
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
                phone: form.phone.trim(),
                dateOfBirth: form.dateOfBirth || null,
            });
            updateUser({ firstName: form.firstName.trim(), lastName: form.lastName.trim() });
            showToast('Profile updated successfully!');
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to update profile.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== 'DELETE') return;
        setDeleting(true);
        try {
            await api.delete('/patients/profile');
            logout();
            navigate('/login', { replace: true });
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to delete account.', 'error');
            setDeleting(false);
            setShowDeleteModal(false);
        }
    };

    if (loading) return (
        <div className="max-w-2xl mx-auto card p-8 space-y-4">
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-10 rounded-xl" />)}
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl font-medium text-sm animate-slide-in-right ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
                    {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    {toast.msg}
                </div>
            )}

            {/* Header card */}
            <div className="card p-6 flex items-center gap-5">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-blue-500/30 shrink-0">
                    {(form.firstName[0] || user?.email?.[0] || 'P').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-bold text-slate-900 truncate">
                        {form.firstName || form.lastName
                            ? `${form.firstName} ${form.lastName}`.trim()
                            : 'My Profile'}
                    </h1>
                    <div className="flex items-center gap-1.5 mt-1 text-sm text-slate-500">
                        <Mail size={13} className="text-blue-500 shrink-0" />
                        <span className="truncate">{user?.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <Shield size={12} className="text-blue-500" />
                        <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Patient</span>
                    </div>
                </div>
                <div className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                    <Edit3 size={15} className="text-blue-500" />
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSave}>
                <div className="card p-6 space-y-5">
                    <h2 className="font-bold text-slate-900 flex items-center gap-2">
                        <User size={17} className="text-blue-500" /> Personal Information
                    </h2>

                    {/* Name row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field
                            id="fn" label="First Name *" icon={User}
                            value={form.firstName} onChange={set('firstName')}
                            error={errors.firstName} placeholder="Shalini"
                            autoComplete="given-name"
                        />
                        <Field
                            id="ln" label="Last Name *"
                            value={form.lastName} onChange={set('lastName')}
                            error={errors.lastName} placeholder="Kumara"
                            autoComplete="family-name"
                        />
                    </div>

                    {/* Phone */}
                    <Field
                        id="phone" label="Phone Number" icon={Phone}
                        value={form.phone} onChange={set('phone')}
                        error={errors.phone} placeholder="07XXXXXXXX"
                        autoComplete="tel" type="tel"
                    />

                    {/* NIC — read-only, set at registration */}
                    <div className="space-y-1.5">
                        <label htmlFor="nic" className="block text-sm font-semibold text-slate-700">NIC Number</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                <IdCard size={16} className="text-slate-400" />
                            </div>
                            <input
                                id="nic"
                                type="text"
                                value={form.nic}
                                readOnly
                                className="input-field bg-slate-50 text-slate-500 cursor-not-allowed select-none uppercase"
                                style={{ paddingLeft: '38px' }}
                                title="NIC cannot be changed after registration."
                            />
                        </div>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                            <AlertCircle size={11} className="text-amber-400" />
                            NIC is set at registration and cannot be modified.
                        </p>
                    </div>

                    {/* DOB */}
                    <Field
                        id="dob" label="Date of Birth" icon={Calendar}
                        value={form.dateOfBirth} onChange={set('dateOfBirth')}
                        type="date" autoComplete="bday"
                    />
                </div>

                <div className="flex justify-end mt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-blue-600 to-indigo-500 text-white shadow-md shadow-blue-500/25 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-60"
                    >
                        {saving ? (
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                        ) : <Save size={16} />}
                        {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                </div>
            </form>

            {/* Danger Zone */}
            <div className="card border-red-100 p-6 space-y-4">
                <div className="flex items-center gap-2">
                    <TriangleAlert size={17} className="text-red-500" />
                    <h2 className="font-bold text-red-600">Danger Zone</h2>
                </div>
                <p className="text-sm text-slate-500">
                    Permanently delete your account and all associated data including appointments
                    and health records. <span className="font-semibold text-red-600">This action cannot be undone.</span>
                </p>
                <button
                    id="delete-account-btn"
                    onClick={() => { setShowDeleteModal(true); setDeleteConfirmText(''); }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 transition-colors"
                >
                    <Trash2 size={15} /> Delete My Account
                </button>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
                        onClick={() => setShowDeleteModal(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-7 animate-fade-up">
                        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
                            <Trash2 size={26} className="text-red-500" />
                        </div>
                        <h3 className="font-bold text-slate-900 text-lg text-center mb-2">Delete Your Account?</h3>
                        <p className="text-sm text-slate-500 text-center mb-5 leading-relaxed">
                            This will permanently delete your account, all appointments, and health records.
                            This <strong>cannot be undone</strong>.
                        </p>

                        <div className="space-y-2 mb-5">
                            <p className="text-xs font-semibold text-slate-600">
                                Type <span className="font-mono bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-200">DELETE</span> to confirm:
                            </p>
                            <input
                                id="delete-confirm-input"
                                type="text"
                                value={deleteConfirmText}
                                onChange={e => setDeleteConfirmText(e.target.value)}
                                placeholder="Type DELETE here"
                                className="input-field font-mono"
                                autoComplete="off"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                id="confirm-delete-btn"
                                onClick={handleDeleteAccount}
                                disabled={deleteConfirmText !== 'DELETE' || deleting}
                                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                            >
                                {deleting ? (
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>
                                ) : <Trash2 size={14} />}
                                {deleting ? 'Deleting…' : 'Delete Account'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Reusable Field component (top-level to avoid focus loss)
const Field = ({ id, label, icon: Icon, type = 'text', placeholder, value, onChange, error, autoComplete, extra = {}, className: _cls }) => (
    <div className="space-y-1.5">
        <label htmlFor={id} className="block text-sm font-semibold text-slate-700">{label}</label>
        <div className="relative">
            {Icon && (
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <Icon size={16} className="text-slate-400" />
                </div>
            )}
            <input
                id={id} type={type} autoComplete={autoComplete} placeholder={placeholder}
                value={value} onChange={onChange}
                className={`input-field pr-9 ${error ? 'border-red-400 focus:border-red-500' : ''}`}
                style={Icon ? { paddingLeft: '38px' } : {}}
                {...extra}
            />
        </div>
        {error && (
            <p className="text-xs font-medium text-red-500 flex items-center gap-1">
                <AlertCircle size={11} /> {error}
            </p>
        )}
    </div>
);

export default PatientProfile;
