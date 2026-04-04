import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Textarea } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { SectionHeader } from '../components/ui/Common';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import { User, Phone, Award, Briefcase, DollarSign, BookOpen, Save, AlertCircle, CheckCircle, Trash2, TriangleAlert } from 'lucide-react';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const PHONE_REGEX = /^(07\d{8}|\+94\d{9})$/;

const DoctorProfile = () => {
    const { updateUser, logout } = useAuthStore();
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [tab, setTab] = useState('profile');
    const [phoneError, setPhoneError] = useState('');
    const [phoneTouched, setPhoneTouched] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deleting, setDeleting] = useState(false);

    const [form, setForm] = useState({
        firstName: '', lastName: '', specialization: '', consultationFee: '',
        phone: '',
        profileDetails: { bio: '', qualifications: '', experienceYears: '', contactNumber: '' },
        availability: [],
    });

    useEffect(() => {
        api.get('/doctors/profile').then(({ data }) => {
            setForm({
                firstName: data.firstName || '',
                lastName: data.lastName || '',
                specialization: data.specialization || '',
                consultationFee: data.consultationFee || '',
                phone: data.phone || '',
                profileDetails: {
                    bio: data.profileDetails?.bio || '',
                    qualifications: (data.profileDetails?.qualifications || []).join(', '),
                    experienceYears: data.profileDetails?.experienceYears || '',
                    contactNumber: data.profileDetails?.contactNumber || '',
                },
                availability: data.availability || [],
            });
            setPhoneTouched(false);
            setPhoneError('');
        }).catch(console.error).finally(() => setLoading(false));
    }, []);

    const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));
    const setDetail = (field) => (e) => setForm((p) => ({ ...p, profileDetails: { ...p.profileDetails, [field]: e.target.value } }));

    const handlePhoneChange = (e) => {
        const val = e.target.value;
        setPhoneTouched(true);
        setForm(p => ({ ...p, phone: val }));
        if (val && !PHONE_REGEX.test(val.trim())) {
            setPhoneError('Enter a valid number: 07XXXXXXXX or +94XXXXXXXXX');
        } else {
            setPhoneError('');
        }
    };

    const handlePhoneBlur = () => {
        setPhoneTouched(true);
        if (form.phone && !PHONE_REGEX.test(form.phone.trim())) {
            setPhoneError('Enter a valid number: 07XXXXXXXX or +94XXXXXXXXX');
        } else {
            setPhoneError('');
        }
    };

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (form.phone && !PHONE_REGEX.test(form.phone.trim())) {
            setPhoneTouched(true);
            setPhoneError('Enter a valid number: 07XXXXXXXX or +94XXXXXXXXX');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                ...form,
                consultationFee: Number(form.consultationFee),
                phone: form.phone.trim(),
                profileDetails: {
                    ...form.profileDetails,
                    experienceYears: Number(form.profileDetails.experienceYears),
                    qualifications: form.profileDetails.qualifications.split(',').map(q => q.trim()).filter(Boolean),
                },
            };
            const { data } = await api.put('/doctors/profile', payload);
            updateUser({ firstName: data.firstName, lastName: data.lastName });
            setPhoneTouched(false);
            setPhoneError('');
            showToast('Profile updated successfully!');
        } catch {
            showToast('Failed to update profile.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const trimmedPhone = form.phone.trim();
    const isPhoneValid = !!trimmedPhone && PHONE_REGEX.test(trimmedPhone);
    const showPhoneValidation = phoneTouched || !!phoneError;

    const toggleDayAvailability = (day) => {
        setForm((p) => {
            const exists = p.availability.find(a => a.day === day);
            if (exists) return { ...p, availability: p.availability.filter(a => a.day !== day) };
            return { ...p, availability: [...p.availability, { day, startTime: '09:00', endTime: '17:00', maxSlots: 10 }] };
        });
    };

    const updateSlot = (day, field, value) => {
        setForm((p) => ({
            ...p,
            availability: p.availability.map(a => a.day === day ? { ...a, [field]: value } : a),
        }));
    };

    const handleSaveAvailability = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put('/doctors/availability', { availability: form.availability });
            showToast('Availability saved!');
        } catch {
            showToast('Failed to save availability.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteProfile = async () => {
        if (deleteConfirmText !== 'DELETE') return;
        setDeleting(true);
        try {
            await api.delete('/doctors/profile');
            logout();
            navigate('/login', { replace: true });
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to delete doctor profile.', 'error');
            setDeleting(false);
            setShowDeleteModal(false);
        }
    };

    if (loading) return (
        <div className="card p-8 space-y-4">
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-10 rounded-xl" />)}
        </div>
    );

    return (
        <div className="space-y-6 max-w-4xl">
            <SectionHeader title="Settings" subtitle="Manage your professional profile and schedule" />

            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl font-medium text-sm animate-slide-in-right ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
                    {toast.type === 'success' ? <CheckCircle size={16} className="shrink-0" /> : <AlertCircle size={16} className="shrink-0" />}
                    {toast.msg}
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 bg-slate-50 p-1.5 rounded-2xl w-fit border border-slate-200 shadow-sm">
                {[{ key: 'profile', label: 'Personal Profile' }, { key: 'availability', label: 'Schedule & Availability' }].map(({ key, label }) => (
                    <button key={key} onClick={() => setTab(key)}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${tab === key ? 'bg-white text-blue-700 shadow-md ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Profile Tab */}
            {tab === 'profile' && (
                <form onSubmit={handleSave} className="animate-fade-in">
                    <div className="card bg-white shadow-xl shadow-blue-900/5 border border-slate-100 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500" />

                        <div className="p-8 space-y-8">
                            <div>
                                <h3 className="font-bold text-xl text-slate-900 flex items-center gap-2 mb-1"><User size={22} className="text-blue-600 p-1 bg-blue-50 rounded-lg" /> Personal Information</h3>
                                <p className="text-sm text-slate-500 ml-9">Basic details and contact information for patients to reach you.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ml-9">
                                <Input label="First Name" id="fn" icon={User} value={form.firstName} onChange={set('firstName')} />
                                <Input label="Last Name" id="ln" value={form.lastName} onChange={set('lastName')} />
                                <Input label="Specialization" id="spec" icon={Briefcase} value={form.specialization} onChange={set('specialization')} />
                                <Input label="Consultation Fee (Rs.)" id="fee" type="number" icon={DollarSign} value={form.consultationFee} onChange={set('consultationFee')} />

                                {/* Phone with live validation */}
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-semibold text-slate-700">Phone Number</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                            <Phone size={16} className="text-slate-400" />
                                        </div>
                                        <input
                                            type="tel"
                                            value={form.phone}
                                            onChange={handlePhoneChange}
                                            onBlur={handlePhoneBlur}
                                            maxLength={15}
                                            placeholder="07XXXXXXXX or +94XXXXXXXXX"
                                            className={`input-field pr-9 ${phoneError
                                                ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                                                : showPhoneValidation && isPhoneValid
                                                    ? 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/20'
                                                    : ''}`}
                                            style={{ paddingLeft: '38px' }}
                                        />
                                        <div className="absolute inset-y-0 right-3 flex items-center">
                                            {showPhoneValidation && trimmedPhone && (isPhoneValid
                                                ? <CheckCircle size={15} className="text-emerald-500" />
                                                : <AlertCircle size={15} className="text-red-400" />
                                            )}
                                        </div>
                                    </div>
                                    {phoneError
                                        ? <p className="text-xs font-medium text-red-500 flex items-center gap-1"><AlertCircle size={11} /> {phoneError}</p>
                                        : showPhoneValidation && isPhoneValid
                                            ? <p className="text-xs font-medium text-emerald-600 flex items-center gap-1"><CheckCircle size={11} /> Valid phone number</p>
                                            : <p className="text-xs text-slate-400">Formats: 07XXXXXXXX or +94XXXXXXXXX</p>
                                    }
                                </div>

                                <Input label="Years of Experience" id="exp" type="number" icon={Award} value={form.profileDetails.experienceYears} onChange={setDetail('experienceYears')} />
                            </div>

                            <hr className="border-slate-100" />

                            <div>
                                <h3 className="font-bold text-xl text-slate-900 flex items-center gap-2 mb-1"><BookOpen size={22} className="text-indigo-600 p-1 bg-indigo-50 rounded-lg" /> Professional Details</h3>
                                <p className="text-sm text-slate-500 ml-9">Describe your background and qualifications.</p>
                            </div>

                            <div className="space-y-6 ml-9">
                                <Textarea label="Biography" id="bio" value={form.profileDetails.bio} onChange={setDetail('bio')} placeholder="Write a short professional bio..." rows={4} />
                                <Textarea label="Qualifications (comma-separated)" id="qual" value={form.profileDetails.qualifications} onChange={setDetail('qualifications')} placeholder="MBBS, MD Cardiology, ..." rows={2} />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end mt-4">
                        <Button type="submit" isLoading={saving} className="px-10">
                            <Save size={15} /> Save Profile
                        </Button>
                    </div>

                    <div className="card border-red-100 mt-5 p-6 space-y-4">
                        <div className="flex items-center gap-2">
                            <TriangleAlert size={17} className="text-red-500" />
                            <h2 className="font-bold text-red-600">Danger Zone</h2>
                        </div>
                        <p className="text-sm text-slate-500">
                            Permanently delete your doctor account and profile. Open appointments will be cancelled,
                            and your existing patient records may still remain in history for audit purposes.
                            <span className="font-semibold text-red-600"> This action cannot be undone.</span>
                        </p>
                        <button
                            type="button"
                            id="delete-doctor-profile-btn"
                            onClick={() => { setShowDeleteModal(true); setDeleteConfirmText(''); }}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 transition-colors"
                        >
                            <Trash2 size={15} /> Delete My Profile
                        </button>
                    </div>
                </form>
            )}

            {/* Availability Tab */}
            {tab === 'availability' && (
                <form onSubmit={handleSaveAvailability} className="animate-fade-in">
                    <div className="card p-8 space-y-6 bg-white shadow-xl shadow-blue-900/5 border border-slate-100 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-400 to-indigo-500" />
                        <div>
                            <h3 className="font-bold text-xl text-slate-900">Weekly Schedule</h3>
                            <p className="text-sm text-slate-500 mt-1">Configure your working hours and capacity for patient bookings.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                            {DAYS.map((day) => {
                                const slot = form.availability.find(a => a.day === day);
                                const active = !!slot;
                                return (
                                    <div key={day} className={`rounded-xl p-5 border-2 transition-all duration-300 ${active ? 'border-blue-100 bg-blue-50/40 shadow-sm' : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'}`}>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleDayAvailability(day)}
                                                    className={`relative h-6 w-11 rounded-full transition-colors duration-300 focus:outline-none ${active ? 'bg-blue-600' : 'bg-slate-300'}`}
                                                >
                                                    <span className={`absolute top-0.5 left-0.5 h-5 w-5 bg-white rounded-full shadow transition-transform duration-300 ${active ? 'translate-x-5' : ''}`} />
                                                </button>
                                                <span className={`text-base font-bold ${active ? 'text-blue-800' : 'text-slate-500'}`}>
                                                    {day.charAt(0) + day.slice(1).toLowerCase()}
                                                </span>
                                            </div>
                                            {active && <span className="text-xs font-bold px-2 py-1 rounded bg-blue-100 text-blue-700">Active</span>}
                                        </div>

                                        {active && (
                                            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-blue-100/50">
                                                <div className="space-y-1.5">
                                                    <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Start Time</label>
                                                    <input type="time" value={slot.startTime} onChange={(e) => updateSlot(day, 'startTime', e.target.value)} className="input-field text-sm font-medium bg-white" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500">End Time</label>
                                                    <input type="time" value={slot.endTime} onChange={(e) => updateSlot(day, 'endTime', e.target.value)} className="input-field text-sm font-medium bg-white" />
                                                </div>
                                                <div className="space-y-1.5 col-span-2">
                                                    <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Max Slots Available</label>
                                                    <input type="number" min="1" max="50" value={slot.maxSlots} onChange={(e) => updateSlot(day, 'maxSlots', Number(e.target.value))} className="input-field text-sm font-medium bg-white w-full" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="flex justify-end mt-4">
                        <Button type="submit" isLoading={saving} className="px-10">
                            <Save size={15} /> Save Availability
                        </Button>
                    </div>
                </form>
            )}

            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
                        onClick={() => setShowDeleteModal(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-7 animate-fade-up">
                        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
                            <Trash2 size={26} className="text-red-500" />
                        </div>
                        <h3 className="font-bold text-slate-900 text-lg text-center mb-2">Delete Your Doctor Profile?</h3>
                        <p className="text-sm text-slate-500 text-center mb-5 leading-relaxed">
                            This will permanently delete your doctor account and remove your access to the platform.
                            Open appointments will be cancelled. <strong>This cannot be undone.</strong>
                        </p>

                        <div className="space-y-2 mb-5">
                            <p className="text-xs font-semibold text-slate-600">
                                Type <span className="font-mono bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-200">DELETE</span> to confirm:
                            </p>
                            <input
                                id="doctor-delete-confirm-input"
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
                                type="button"
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                id="confirm-doctor-delete-btn"
                                onClick={handleDeleteProfile}
                                disabled={deleteConfirmText !== 'DELETE' || deleting}
                                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                            >
                                {deleting ? (
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>
                                ) : <Trash2 size={14} />}
                                {deleting ? 'Deleting…' : 'Delete Profile'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorProfile;
