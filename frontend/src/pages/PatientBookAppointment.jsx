import { useState, useEffect, useCallback } from 'react';
<<<<<<< Updated upstream
import api from '../services/api';
import {
    Search, Stethoscope, Star, Calendar, Clock, CheckCircle, AlertCircle,
    ChevronRight, X, Upload, ImageIcon, Sparkles, MapPin, DollarSign,
} from 'lucide-react';

// ── Keyword → specialization map (mirrors backend) ────────────────────────────
const KEYWORD_SPEC_MAP = {
    heart: 'Cardiologist', chest: 'Cardiologist', cardiac: 'Cardiologist',
    palpitation: 'Cardiologist', blood: 'Cardiologist',
    skin: 'Dermatologist', rash: 'Dermatologist', acne: 'Dermatologist', eczema: 'Dermatologist',
    headache: 'Neurologist', migraine: 'Neurologist', seizure: 'Neurologist',
    stomach: 'Gastroenterologist', abdomen: 'Gastroenterologist', nausea: 'Gastroenterologist',
    allergy: 'Allergist', asthma: 'Pulmonologist', breath: 'Pulmonologist',
    thyroid: 'Endocrinologist', diabetes: 'Endocrinologist',
    child: 'Pediatrician', fever: 'General Physician', cold: 'General Physician',
    fatigue: 'General Physician', flu: 'General Physician',
    joint: 'Rheumatologist', arthritis: 'Rheumatologist',
    ear: 'Otolaryngologist', throat: 'Otolaryngologist',
    gynec: 'Gynecologist', period: 'Gynecologist', pregnancy: 'Gynecologist',
};

=======
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import {
    Search, Stethoscope, Star, Calendar, Clock, CheckCircle, AlertCircle,
    ChevronRight, X, Upload, ImageIcon, Sparkles, CreditCard,
    Wallet, ArrowLeft, ShieldCheck, Lock, ExternalLink, Receipt,
    RefreshCw, XCircle, Activity,
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import CustomCalendar from '../components/CustomCalendar';
>>>>>>> Stashed changes
const SPEC_COLORS = {
    'Cardiologist': 'bg-red-100 text-red-700',
    'Dermatologist': 'bg-pink-100 text-pink-700',
    'Neurologist': 'bg-purple-100 text-purple-700',
    'Gastroenterologist': 'bg-amber-100 text-amber-700',
    'Allergist': 'bg-lime-100 text-lime-700',
    'Pulmonologist': 'bg-sky-100 text-sky-700',
    'Endocrinologist': 'bg-orange-100 text-orange-700',
    'Pediatrician': 'bg-blue-100 text-blue-700',
    'General Physician': 'bg-slate-100 text-slate-700',
    'Rheumatologist': 'bg-indigo-100 text-indigo-700',
    'Otolaryngologist': 'bg-violet-100 text-violet-700',
    'Gynecologist': 'bg-rose-100 text-rose-700',
};

// ── BookingModal ───────────────────────────────────────────────────────────────
const BookingModal = ({ doctor, onClose, onBooked }) => {
<<<<<<< Updated upstream
    const [date, setDate] = useState('');
=======
    
    // Step 1: slot selection, Step 2: payment
    const [step, setStep] = useState(1);
    const [searchParams] = useSearchParams();
    const [date, setDate] = useState(searchParams.get('date') || '');
>>>>>>> Stashed changes
    const [slot, setSlot] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const today = new Date().toISOString().split('T')[0];

    // Generate slots from doctor availability for selected date
    const getSlots = () => {
        if (!date || !doctor?.availability?.length) return [];
        const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
        const avail = doctor.availability.find(a => a.day === dayName);
        if (!avail) return [];
        // Generate 30-min slots between startTime and endTime
        const slots = [];
        const [sh, sm] = avail.startTime.split(':').map(Number);
        const [eh, em] = avail.endTime.split(':').map(Number);
        let cur = sh * 60 + sm;
        const end = eh * 60 + em;
        while (cur + 30 <= end) {
            const from = `${String(Math.floor(cur / 60)).padStart(2, '0')}:${String(cur % 60).padStart(2, '0')}`;
            const to = `${String(Math.floor((cur + 30) / 60)).padStart(2, '0')}:${String((cur + 30) % 60).padStart(2, '0')}`;
            slots.push(`${from} - ${to}`);
            cur += 30;
        }
        return slots;
    };

    const slots = getSlots();

    const handleConfirm = async () => {
        if (!date || !slot) { setError('Please select a date and time slot.'); return; }
        setLoading(true);
        setError('');
        try {
            await api.post('/patients/appointments', {
                doctorId: doctor._id,
                appointmentDate: date,
                timeSlot: slot,
            });
            setSuccess(true);
            setTimeout(() => { onBooked(); onClose(); }, 1500);
        } catch (err) {
            setError(err.response?.data?.message || 'Booking failed. Please try again.');
        } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(6px)' }}
            onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-up" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Book Appointment</h3>
                        <p className="text-sm text-slate-500">Dr. {doctor.firstName} {doctor.lastName}</p>
                    </div>
                    <button onClick={onClose} className="h-8 w-8 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {success ? (
                    <div className="text-center py-8">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-100 mb-4">
                            <CheckCircle size={28} className="text-emerald-500" />
                        </div>
                        <p className="font-bold text-slate-900">Appointment Booked!</p>
                        <p className="text-sm text-slate-500 mt-1">You'll receive confirmation shortly.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Date picker */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-slate-700">Select Date</label>
                            <input type="date" min={today} value={date}
                                onChange={e => { setDate(e.target.value); setSlot(''); }}
                                className="input-field w-full" />
                            {date && slots.length === 0 && (
                                <p className="text-xs text-amber-600 flex items-center gap-1">
                                    <AlertCircle size={11} /> No availability on this day. Try another date.
                                </p>
                            )}
                        </div>

                        {/* Time slot grid */}
                        {slots.length > 0 && (
                            <div className="space-y-1.5">
<<<<<<< Updated upstream
                                <label className="block text-sm font-semibold text-slate-700">Select Time Slot</label>
                                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                                    {slots.map(s => (
                                        <button key={s} onClick={() => setSlot(s)}
                                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${slot === s
                                                ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-500/30'
                                                : 'bg-white border-slate-200 text-slate-700 hover:border-blue-400 hover:bg-blue-50'
                                                }`}>
                                            <Clock size={13} className={slot === s ? 'text-white' : 'text-slate-400'} />
                                            {s}
=======
                                <label className="block text-sm font-semibold text-slate-700">Select Date</label>
                                <CustomCalendar 
                                    className="mb-2 shadow-sm border border-slate-200"
                                    selectedDate={date}
                                    minDate={new Date()}
                                    onSelectDate={d => {
                                        const y = d.getFullYear();
                                        const m = String(d.getMonth() + 1).padStart(2, '0');
                                        const day = String(d.getDate()).padStart(2, '0');
                                        setDate(`${y}-${m}-${day}`); 
                                        setSlot(''); 
                                        setError('');
                                    }}
                                />
                                {date && slots.length === 0 && (
                                    <p className="text-xs text-amber-600 flex items-center gap-1">
                                        <AlertCircle size={11} /> No availability on this day. Try another date.
                                    </p>
                                )}
                            </div>

                            {/* Time slots */}
                            {slots.length > 0 && (
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-semibold text-slate-700">Select Time Slot</label>
                                    <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-0.5">
                                        {slots.map(s => (
                                            <button key={s} onClick={() => { setSlot(s); setError(''); }}
                                                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${slot === s
                                                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-500/30'
                                                    : 'bg-white border-slate-200 text-slate-700 hover:border-blue-400 hover:bg-blue-50'
                                                    }`}>
                                                <Clock size={13} className={slot === s ? 'text-white' : 'text-slate-400'} />
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Fee */}
                            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                                <CreditCard size={16} className="text-blue-600 shrink-0" />
                                <p className="text-sm text-blue-700">Consultation fee: <strong>LKR {fee?.toLocaleString() || '—'}</strong></p>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                                    <AlertCircle size={14} className="text-red-500 shrink-0" />
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            )}

                            <div className="flex gap-3 pt-1">
                                <button onClick={onClose}
                                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                                    Cancel
                                </button>
                                <button onClick={handleProceedToPayment} disabled={!date || !slot}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                    Next: Pay <ChevronRight size={15} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Step 2: Payment ── */}
                    {!paymentScreen && step === 2 && (
                        <div className="space-y-4">
                            {/* Booking summary */}
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-1.5">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Booking Summary</p>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Doctor</span>
                                    <span className="font-semibold text-slate-800">Dr. {doctor.firstName} {doctor.lastName}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Specialization</span>
                                    <span className="font-medium text-slate-700">{doctor.specialization}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Date</span>
                                    <span className="font-semibold text-slate-800">{new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Time</span>
                                    <span className="font-semibold text-slate-800">{slot}</span>
                                </div>
                                <div className="border-t border-slate-200 mt-2 pt-2 flex justify-between">
                                    <span className="text-sm font-bold text-slate-700">Total</span>
                                    <span className="font-bold text-blue-600">LKR {fee?.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Method selector (only if no transaction yet) */}
                            {!transactionId && (
                                <>
                                    <p className="text-sm font-semibold text-slate-700">Choose Payment Method</p>
                                    <div className="space-y-2">
                                        {PAYMENT_METHODS.map(m => (
                                            <button key={m.id} onClick={() => { setSelectedMethod(m.id); setError(''); }}
                                                className={`w-full text-left p-3.5 rounded-xl border-2 transition-all ${selectedMethod === m.id
                                                    ? `${m.border} ${m.bg} shadow-sm`
                                                    : 'border-slate-200 hover:border-slate-300 bg-white'
                                                    }`}>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">{m.icon}</span>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-sm text-slate-800">{m.label}</span>
                                                            {m.recommended && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-500 text-white">RECOMMENDED</span>}
                                                        </div>
                                                        <p className="text-xs text-slate-500 mt-0.5">{m.subtitle}</p>
                                                    </div>
                                                    <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${selectedMethod === m.id ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                                                        }`}>
                                                        {selectedMethod === m.id && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                                                    </div>
                                                </div>
                                                {selectedMethod === m.id && <p className="text-xs text-slate-500 mt-2 ml-9">{m.description}</p>}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}

                            {/* PayHere → initiate then popup */}
                            {!transactionId && selectedMethod === 'PAYHERE' && (
                                <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-2">
                                    <ShieldCheck size={15} className="text-orange-500 mt-0.5 shrink-0" />
                                    <p className="text-xs text-orange-700">
                                        You'll be redirected to PayHere's secure sandbox gateway. Booking is confirmed instantly on success.
                                    </p>
                                </div>
                            )}

                            {/* Bank Transfer reference form */}
                            {transactionId && selectedMethod === 'BANK_TRANSFER' && (
                                <div className="space-y-3">
                                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                                        <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Bank Details</p>
                                        {Object.entries(BANK_DETAILS).map(([k, v]) => (
                                            <div key={k} className="flex justify-between text-sm">
                                                <span className="text-slate-500 capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                                                <span className="font-semibold text-slate-800 font-mono">{v}</span>
                                            </div>
                                        ))}
                                        <p className="text-xs text-slate-500 pt-1 border-t border-blue-200">
                                            Use receipt number <strong>{transactionId?.slice(-8).toUpperCase()}</strong> as transfer reference.
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Bank Transaction Reference *</label>
                                        <input type="text" value={paymentRef} onChange={e => setPaymentRef(e.target.value)}
                                            placeholder="e.g. TXN202600123456"
                                            className="input-field w-full" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Additional Note <span className="font-normal text-slate-400">(optional)</span></label>
                                        <input type="text" value={paymentNote} onChange={e => setPaymentNote(e.target.value)}
                                            placeholder="Branch name, transfer time, etc."
                                            className="input-field w-full" />
                                    </div>
                                </div>
                            )}

                            {/* PayPal reference form */}
                            {transactionId && selectedMethod === 'PAYPAL' && (
                                <div className="space-y-3">
                                    <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl">
                                        <p className="text-xs font-bold text-sky-700 uppercase tracking-wider mb-2">PayPal Details</p>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Send to</span>
                                            <span className="font-semibold text-slate-800 font-mono">{PAYPAL_EMAIL}</span>
                                        </div>
                                        <div className="flex justify-between text-sm mt-1">
                                            <span className="text-slate-500">Amount</span>
                                            <span className="font-semibold text-slate-800">LKR {fee?.toLocaleString()}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 pt-2 border-t border-sky-200 mt-2">
                                            Add <strong>{transactionId?.slice(-8).toUpperCase()}</strong> in the PayPal note.
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">PayPal Transaction ID *</label>
                                        <input type="text" value={paymentRef} onChange={e => setPaymentRef(e.target.value)}
                                            placeholder="e.g. 3JU110429T504672Y"
                                            className="input-field w-full" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Note <span className="font-normal text-slate-400">(optional)</span></label>
                                        <input type="text" value={paymentNote} onChange={e => setPaymentNote(e.target.value)}
                                            placeholder="Any additional info"
                                            className="input-field w-full" />
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                                    <AlertCircle size={14} className="text-red-500 shrink-0" />
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            )}

                            <div className="flex gap-3 pt-1">
                                {!transactionId ? (
                                    <>
                                        <button onClick={() => { setStep(1); setSelectedMethod(null); setError(''); }}
                                            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                                            Back
>>>>>>> Stashed changes
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Fee info */}
                        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                            <DollarSign size={16} className="text-blue-600 shrink-0" />
                            <p className="text-sm text-blue-700">
                                Consultation fee: <strong>LKR {doctor.consultationFee?.toLocaleString() || '—'}</strong>
                            </p>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                                <AlertCircle size={15} className="text-red-500 shrink-0" />
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}

                        <div className="flex gap-3 pt-1">
                            <button onClick={onClose}
                                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleConfirm} disabled={loading || !date || !slot}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-sm shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                {loading ? (
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                                ) : null}
                                Confirm Booking
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// ── DoctorCard ────────────────────────────────────────────────────────────────
const DoctorCard = ({ doctor, onBook }) => {
    const specColor = SPEC_COLORS[doctor.specialization] || 'bg-slate-100 text-slate-700';
    const days = doctor.availability?.map(a => a.day.slice(0, 3)).join(', ') || 'Not set';

    return (
        <div className="card p-5 flex flex-col gap-4 hover:shadow-lg transition-all duration-300 border-2 border-transparent animate-fade-up">
            <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-xl shadow-md shrink-0">
                    {doctor.firstName[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 text-base">Dr. {doctor.firstName} {doctor.lastName}</h3>
                    <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mt-0.5 ${specColor}`}>
                        {doctor.specialization}
                    </span>
                    {doctor.profileDetails?.experienceYears > 0 && (
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                            <Star size={11} className="text-amber-400 fill-amber-400" />
                            {doctor.profileDetails.experienceYears} years experience
                        </p>
                    )}
                </div>
                <div className="text-right shrink-0">
                    <p className="text-xs text-slate-400">Consultation</p>
                    <p className="font-bold text-blue-600">LKR {doctor.consultationFee?.toLocaleString() || '—'}</p>
                </div>
            </div>

            {doctor.profileDetails?.bio && (
                <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">{doctor.profileDetails.bio}</p>
            )}

            <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 rounded-xl px-3 py-2">
                <Calendar size={13} className="text-blue-500 shrink-0" />
                <span><strong className="text-slate-700">Available:</strong> {days}</span>
            </div>

            <button onClick={() => onBook(doctor)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-sm shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700 transition-all active:scale-[0.98]">
                Book Appointment <ChevronRight size={15} />
            </button>
        </div>
    );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const PatientBookAppointment = () => {
    const [symptoms, setSymptoms] = useState('');
    const [images, setImages] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [searched, setSearched] = useState(false);
    const [loading, setLoading] = useState(false);
    const [bookTarget, setBookTarget] = useState(null);
<<<<<<< Updated upstream
    const [highlightedSpecs, setHighlightedSpecs] = useState(new Set());
=======
    const [analytics, setAnalytics] = useState(null);
    const { user } = useAuthStore();

    useEffect(() => {
        if (user) {
            api.get('/patients/analytics')
                .then(res => setAnalytics(res.data))
                .catch(err => console.error('Failed to load patient analytics', err));
        }
    }, [user]);
>>>>>>> Stashed changes

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files || []);
        setImages(files);
        const urls = files.map(f => URL.createObjectURL(f));
        setPreviews(urls);
    };

    const removeImage = (idx) => {
        setImages(prev => prev.filter((_, i) => i !== idx));
        setPreviews(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSearch = useCallback(async () => {
        if (!symptoms.trim()) return;
        setLoading(true);

        try {
            const { data } = await api.get(`/patients/doctors?symptoms=${encodeURIComponent(symptoms)}`);
            setDoctors(data);
            setSearched(true);
        } catch {
            setDoctors([]);
            setSearched(true);
        } finally { setLoading(false); }
    }, [symptoms]);

    return (
        <>
            {bookTarget && (
                <BookingModal
                    doctor={bookTarget}
                    onClose={() => setBookTarget(null)}
                    onBooked={() => setBookTarget(null)}
                />
            )}

<<<<<<< Updated upstream
            <div className="space-y-8 max-w-4xl mx-auto">
=======
            <div className="space-y-10 max-w-5xl mx-auto pb-12">

                {/* ── Welcome Banner ── */}
                <div className="relative w-full h-64 md:h-80 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-blue-900/10 mb-8 animate-fade-down">
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: "url('/images/patient_banner.png')" }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-900/60 via-indigo-900/40 to-transparent mix-blend-multiply" />
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]" />

                    <div className="absolute inset-0 p-10 md:p-14 flex flex-col justify-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-xs font-bold uppercase tracking-widest w-fit mb-4 backdrop-blur-md shadow-sm">
                            <Sparkles size={14} className="text-teal-200" /> Patient Dashboard
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-lg mb-2">
                            Welcome to Medicare
                        </h1>
                        <p className="text-teal-50 text-lg md:text-xl font-medium max-w-lg drop-shadow-md">
                            Describe your symptoms below and we will connect you with the right specialists.
                        </p>
                    </div>
                </div>

                {/* ── Patient Analytics Metrics ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 animate-fade-up anim-delay-1">
                    <div className="bg-white/80 backdrop-blur-xl border border-white/80 shadow-xl shadow-blue-900/5 rounded-3xl p-6 group hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300">
                        <div className="flex items-start justify-between mb-4">
                            <div className="h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-110 bg-gradient-to-br from-emerald-400 to-emerald-600">
                                <Calendar size={22} className="text-white" />
                            </div>
                        </div>
                        <p className="text-sm font-medium text-slate-500 mb-1">Upcoming Visits</p>
                        <h3 className="text-3xl font-extrabold text-slate-900">{analytics?.upcomingAppointments || 0}</h3>
                    </div>

                    <div className="bg-white/80 backdrop-blur-xl border border-white/80 shadow-xl shadow-blue-900/5 rounded-3xl p-6 group hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300">
                        <div className="flex items-start justify-between mb-4">
                            <div className="h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-110 bg-gradient-to-br from-blue-400 to-blue-600">
                                <Stethoscope size={22} className="text-white" />
                            </div>
                        </div>
                        <p className="text-sm font-medium text-slate-500 mb-1">Total Bookings</p>
                        <h3 className="text-3xl font-extrabold text-slate-900">{analytics?.totalAppointments || 0}</h3>
                    </div>

                    <div className="bg-white/80 backdrop-blur-xl border border-white/80 shadow-xl shadow-blue-900/5 rounded-3xl p-6 group hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300">
                        <div className="flex items-start justify-between mb-4">
                            <div className="h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-110 bg-gradient-to-br from-purple-400 to-purple-600">
                                <Activity size={22} className="text-white" />
                            </div>
                        </div>
                        <p className="text-sm font-medium text-slate-500 mb-1">Completed Visits</p>
                        <h3 className="text-3xl font-extrabold text-slate-900">{analytics?.completedAppointments || 0}</h3>
                    </div>

                    <div className="bg-white/80 backdrop-blur-xl border border-white/80 shadow-xl shadow-blue-900/5 rounded-3xl p-6 group hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300">
                        <div className="flex items-start justify-between mb-4">
                            <div className="h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-110 bg-gradient-to-br from-orange-400 to-orange-600">
                                <Wallet size={22} className="text-white" />
                            </div>
                        </div>
                        <p className="text-sm font-medium text-slate-500 mb-1">Total Spent</p>
                        <h3 className="text-3xl font-extrabold text-slate-900"><span className="text-lg text-slate-400 font-bold mr-1">Rs.</span>{(analytics?.totalSpent || 0).toLocaleString()}</h3>
                    </div>
                </div>

>>>>>>> Stashed changes
                {/* ── Symptom form ── */}
                <div className="card p-6">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/30">
                            <Search size={18} className="text-white" />
                        </div>
                        <div>
<<<<<<< Updated upstream
                            <h2 className="font-bold text-slate-900 text-lg">Enter Your Symptoms</h2>
                            <p className="text-sm text-slate-400">Describe what you're feeling — we'll find the right doctor</p>
=======
                            <h2 className="font-extrabold text-slate-900 text-2xl tracking-tight">Symptom Check</h2>
                            <p className="text-slate-500 font-medium">Describe what you're feeling — we'll find the right doctor</p>
>>>>>>> Stashed changes
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Symptoms textarea */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-slate-700">How are you feeling? *</label>
                            <textarea
                                rows={4}
                                placeholder="Describe your symptoms in detail (e.g. chest pain, shortness of breath, persistent headache...)"
                                value={symptoms}
                                onChange={e => setSymptoms(e.target.value)}
                                className="input-field resize-none w-full text-sm"
                                style={{ minHeight: '100px' }}
                            />
                            <p className="text-xs text-slate-400">
                                Be as specific as possible for better doctor recommendations
                            </p>
                        </div>

                        {/* Image upload */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-slate-700">
                                Upload Images <span className="font-normal text-slate-400">(optional)</span>
                            </label>
                            <label className={`flex flex-col items-center justify-center gap-3 p-5 rounded-xl border-2 border-dashed cursor-pointer transition-all
                                ${images.length > 0 ? 'border-blue-300 bg-blue-50/50' : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/30'}`}>
                                <input
                                    type="file" accept="image/jpeg,image/png" multiple className="sr-only"
                                    onChange={handleImageChange}
                                />
                                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                                    <Upload size={20} className="text-slate-400" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-semibold text-slate-700">Click to upload images</p>
                                    <p className="text-xs text-slate-400 mt-0.5">JPG, PNG — multiple files allowed</p>
                                </div>
                            </label>

                            {/* Previews */}
                            {previews.length > 0 && (
                                <div className="flex flex-wrap gap-3 mt-2">
                                    {previews.map((url, idx) => (
                                        <div key={idx} className="relative group">
                                            <img src={url} alt={`preview-${idx}`}
                                                className="h-20 w-20 object-cover rounded-xl border border-slate-200 shadow-sm" />
                                            <button
                                                onClick={() => removeImage(idx)}
                                                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                                                <X size={10} />
                                            </button>
                                            <div className="absolute bottom-0 left-0 right-0 bg-black/40 rounded-b-xl px-1 py-0.5">
                                                <p className="text-[9px] text-white truncate">{images[idx]?.name}</p>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="flex items-center gap-1.5 text-xs text-blue-600 font-medium bg-blue-50 rounded-xl px-3 py-2">
                                        <ImageIcon size={13} /> {previews.length} image{previews.length > 1 ? 's' : ''} selected
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleSearch}
                            disabled={!symptoms.trim() || loading}
                            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
                            {loading ? (
                                <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg> Finding doctors…</>
                            ) : (
                                <><Sparkles size={15} /> Find Doctors</>
                            )}
                        </button>
                    </div>
                </div>

                {/* ── Doctor results ── */}
                {searched && (
                    <div className="space-y-4 animate-fade-up">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="font-bold text-slate-900 text-lg">Available Doctors</h2>
                            </div>
                            <span className="text-sm text-slate-400">{doctors.length} found</span>
                        </div>

                        {doctors.length === 0 ? (
                            <div className="card p-10 text-center">
                                <Stethoscope size={32} className="mx-auto text-slate-300 mb-3" />
                                <p className="font-semibold text-slate-600">No doctors available right now</p>
                                <p className="text-sm text-slate-400 mt-1">Please try again later or contact support</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {doctors.map(doc => (
                                    <DoctorCard
                                        key={doc._id}
                                        doctor={doc}
                                        onBook={setBookTarget}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default PatientBookAppointment;

