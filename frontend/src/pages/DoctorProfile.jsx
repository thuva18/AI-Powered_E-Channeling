import { useState, useEffect } from 'react';
import { Input, Textarea } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { SectionHeader } from '../components/ui/Common';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import { User, Phone, Award, Briefcase, DollarSign, BookOpen, Save, AlertCircle, CheckCircle } from 'lucide-react';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const PHONE_REGEX = /^(07\d{8}|\+94\d{9})$/;

const DoctorProfile = () => {
    const { updateUser } = useAuthStore();
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [tab, setTab] = useState('profile');
    const [phoneError, setPhoneError] = useState('');

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
        }).catch(console.error).finally(() => setLoading(false));
    }, []);

    const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));
    const setDetail = (field) => (e) => setForm((p) => ({ ...p, profileDetails: { ...p.profileDetails, [field]: e.target.value } }));

    const handlePhoneChange = (e) => {
        const val = e.target.value;
        setForm(p => ({ ...p, phone: val }));
        if (val && !PHONE_REGEX.test(val.trim())) {
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
            showToast('Profile updated successfully!');
        } catch {
            showToast('Failed to update profile.', 'error');
        } finally {
            setSaving(false);
        }
    };

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
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
                {[{ key: 'profile', label: 'Profile' }, { key: 'availability', label: 'Availability' }].map(({ key, label }) => (
                    <button key={key} onClick={() => setTab(key)}
                        className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${tab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Profile Tab */}
            {tab === 'profile' && (
                <form onSubmit={handleSave}>
                    <div className="card p-6 space-y-6">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2"><User size={18} className="text-blue-500" /> Personal Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                        maxLength={15}
                                        placeholder="07XXXXXXXX or +94XXXXXXXXX"
                                        className={`input-field pr-9 ${phoneError ? 'border-red-400 focus:border-red-500' : form.phone && PHONE_REGEX.test(form.phone.trim()) ? 'border-emerald-400 focus:border-emerald-500' : ''}`}
                                        style={{ paddingLeft: '38px' }}
                                    />
                                    <div className="absolute inset-y-0 right-3 flex items-center">
                                        {form.phone && (PHONE_REGEX.test(form.phone.trim())
                                            ? <CheckCircle size={15} className="text-emerald-500" />
                                            : <AlertCircle size={15} className="text-red-400" />
                                        )}
                                    </div>
                                </div>
                                {phoneError
                                    ? <p className="text-xs font-medium text-red-500 flex items-center gap-1"><AlertCircle size={11} /> {phoneError}</p>
                                    : form.phone && PHONE_REGEX.test(form.phone.trim())
                                        ? <p className="text-xs font-medium text-emerald-600 flex items-center gap-1"><CheckCircle size={11} /> Valid phone number</p>
                                        : <p className="text-xs text-slate-400">Formats: 07XXXXXXXX or +94XXXXXXXXX</p>
                                }
                            </div>

                            <Input label="Years of Experience" id="exp" type="number" icon={Award} value={form.profileDetails.experienceYears} onChange={setDetail('experienceYears')} />
                        </div>
                        <hr className="border-slate-100" />
                        <h3 className="font-bold text-slate-900 flex items-center gap-2"><BookOpen size={18} className="text-purple-500" /> Professional Details</h3>
                        <Textarea label="Biography" id="bio" value={form.profileDetails.bio} onChange={setDetail('bio')} placeholder="Write a short professional bio..." />
                        <Textarea label="Qualifications (comma-separated)" id="qual" value={form.profileDetails.qualifications} onChange={setDetail('qualifications')} placeholder="MBBS, MD Cardiology, ..." />
                    </div>

                    <div className="flex justify-end mt-4">
                        <Button type="submit" isLoading={saving} className="px-10">
                            <Save size={15} /> Save Profile
                        </Button>
                    </div>
                </form>
            )}

            {/* Availability Tab */}
            {tab === 'availability' && (
                <form onSubmit={handleSaveAvailability}>
                    <div className="card p-6 space-y-5">
                        <p className="text-sm text-slate-500">Toggle the days you are available and set your working hours and maximum slots per day.</p>
                        {DAYS.map((day) => {
                            const slot = form.availability.find(a => a.day === day);
                            const active = !!slot;
                            return (
                                <div key={day} className={`rounded-xl p-4 border transition-all duration-200 ${active ? 'border-blue-200 bg-blue-50/60' : 'border-slate-100 bg-slate-50/50'}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => toggleDayAvailability(day)}
                                                className={`relative h-6 w-11 rounded-full transition-colors duration-300 focus:outline-none ${active ? 'bg-blue-500' : 'bg-slate-300'}`}
                                            >
                                                <span className={`absolute top-0.5 left-0.5 h-5 w-5 bg-white rounded-full shadow transition-transform duration-300 ${active ? 'translate-x-5' : ''}`} />
                                            </button>
                                            <span className={`text-sm font-bold ${active ? 'text-blue-700' : 'text-slate-500'}`}>
                                                {day.charAt(0) + day.slice(1).toLowerCase()}
                                            </span>
                                        </div>
                                        {active && <span className="badge badge-approved">Active</span>}
                                    </div>
                                    {active && (
                                        <div className="grid grid-cols-3 gap-3 mt-3">
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-slate-500">Start Time</label>
                                                <input type="time" value={slot.startTime} onChange={(e) => updateSlot(day, 'startTime', e.target.value)} className="input-field text-sm" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-slate-500">End Time</label>
                                                <input type="time" value={slot.endTime} onChange={(e) => updateSlot(day, 'endTime', e.target.value)} className="input-field text-sm" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-slate-500">Max Slots</label>
                                                <input type="number" min="1" max="50" value={slot.maxSlots} onChange={(e) => updateSlot(day, 'maxSlots', Number(e.target.value))} className="input-field text-sm" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex justify-end mt-4">
                        <Button type="submit" isLoading={saving} className="px-10">
                            <Save size={15} /> Save Availability
                        </Button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default DoctorProfile;
