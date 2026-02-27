import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Mail, Lock, User, CreditCard, Stethoscope, CheckCircle, Phone, AlertCircle } from 'lucide-react';
import api from '../services/api';

// ── Approved specializations list ─────────────────────────────────────────────
const SPECIALIZATIONS = [
    'Dermatologist',
    'Allergist',
    'Gastroenterologist',
    'Hepatologist',
    'Osteopathic',
    'Endocrinologist',
    'Pulmonologist',
    'Cardiologist',
    'Neurologist',
    'Internal Medicine',
    'Pediatrician',
    'Common Cold',
    'Phlebologist',
    'Osteoarthritis',
    'Rheumatologist',
    'Otolaryngologist',
    'Gynecologist',
    'General Physician',
];

// ── Validation rules ──────────────────────────────────────────────────────────
const PHONE_REGEX = /^(07\d{8}|\+94\d{9})$/;

const validators = {
    firstName: (v) => !v.trim() ? 'First name is required' : v.trim().length < 2 ? 'Must be at least 2 characters' : /[^a-zA-Z\s'-]/.test(v) ? 'No numbers or special characters allowed' : '',
    lastName: (v) => !v.trim() ? 'Last name is required' : v.trim().length < 2 ? 'Must be at least 2 characters' : /[^a-zA-Z\s'-]/.test(v) ? 'No numbers or special characters allowed' : '',
    email: (v) => !v.trim() ? 'Email is required' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'Enter a valid email address' : '',
    phone: (v) => !v.trim() ? 'Phone number is required' : !PHONE_REGEX.test(v.trim()) ? 'Enter a valid number: 07XXXXXXXX or +94XXXXXXXXX' : '',
    slmcNumber: (v) => !v.trim() ? 'SLMC number is required' : v.trim().length < 4 ? 'SLMC number is too short' : '',
    specialization: (v) => !v.trim() ? 'Specialization is required' : !SPECIALIZATIONS.includes(v.trim()) ? 'Please select a valid specialization from the list' : '',
    password: (v) => !v ? 'Password is required' : v.length < 8 ? 'Minimum 8 characters required' : !/[A-Z]/.test(v) ? 'Must include at least one uppercase letter' : !/[0-9]/.test(v) ? 'Must include at least one number' : '',
    confirmPassword: (v, pw) => !v ? 'Please confirm your password' : v !== pw ? "Passwords don't match" : '',
};

const passwordStrength = (pw) => {
    if (!pw) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    const map = [
        { label: '', color: '' },
        { label: 'Weak', color: 'bg-red-400' },
        { label: 'Fair', color: 'bg-amber-400' },
        { label: 'Good', color: 'bg-blue-400' },
        { label: 'Strong', color: 'bg-emerald-500' },
    ];
    return { score, ...map[score] };
};

// ── Component ─────────────────────────────────────────────────────────────────
const Register = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', email: '', phone: '',
        slmcNumber: '', specialization: '', password: '', confirmPassword: '',
    });
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [submitError, setSubmitError] = useState('');

    const set = (field) => (e) => {
        const value = e.target.value;
        setFormData((p) => ({ ...p, [field]: value }));
        if (touched[field]) {
            const err = field === 'confirmPassword'
                ? validators.confirmPassword(value, formData.password)
                : validators[field]?.(value) ?? '';
            setErrors((p) => ({ ...p, [field]: err }));
        }
    };

    const blur = (field) => () => {
        setTouched((p) => ({ ...p, [field]: true }));
        const err = field === 'confirmPassword'
            ? validators.confirmPassword(formData.confirmPassword, formData.password)
            : validators[field]?.(formData[field]) ?? '';
        setErrors((p) => ({ ...p, [field]: err }));
    };

    const validateFields = (fields) => {
        const newErrors = {};
        fields.forEach((field) => {
            const err = field === 'confirmPassword'
                ? validators.confirmPassword(formData.confirmPassword, formData.password)
                : validators[field]?.(formData[field]) ?? '';
            if (err) newErrors[field] = err;
        });
        setErrors((p) => ({ ...p, ...newErrors }));
        setTouched((p) => { const t = { ...p }; fields.forEach((f) => (t[f] = true)); return t; });
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateFields(['firstName', 'lastName', 'email', 'phone'])) setStep(2);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateFields(['slmcNumber', 'specialization', 'password', 'confirmPassword'])) return;
        setLoading(true);
        setSubmitError('');
        try {
            await api.post('/auth/doctor/register', {
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                email: formData.email.trim(),
                phone: formData.phone.trim(),
                slmcNumber: formData.slmcNumber.trim(),
                specialization: formData.specialization.trim(),
                password: formData.password,
            });
            setSuccess(true);
        } catch (err) {
            setSubmitError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const pwStrength = passwordStrength(formData.password);
    const specValid = SPECIALIZATIONS.includes(formData.specialization.trim());

    // ── Success screen ───────────────────────────────────────────────────────────
    if (success) return (
        <div className="text-center space-y-5 py-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-400 shadow-xl shadow-emerald-500/30 mb-2">
                <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Application Submitted!</h2>
                <p className="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">
                    Your registration is awaiting admin review. Once your SLMC credentials are verified, you'll receive full access.
                </p>
            </div>
            <Button variant="outline" onClick={() => navigate('/login')} className="w-full justify-center">
                Back to Login
            </Button>
        </div>
    );

    // ── Form ─────────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-2xl font-bold text-slate-900 mb-1">Doctor Registration</h1>
                <p className="text-sm text-slate-500">Apply for a verified MediPortal account</p>
            </div>

            {/* Step progress bar */}
            <div className="space-y-1.5">
                <div className="flex gap-2">
                    {[1, 2].map((s) => (
                        <div key={s} className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${s <= step ? 'bg-blue-500' : 'bg-slate-200'}`} />
                    ))}
                </div>
                <p className="text-xs font-medium text-slate-400 text-center">
                    Step {step} of 2 — {step === 1 ? 'Personal Details' : 'Credentials & Security'}
                </p>
            </div>

            {/* Server error */}
            {submitError && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <span className="text-red-500 text-lg leading-none mt-0.5">⚠</span>
                    <p className="text-sm text-red-700 font-medium">{submitError}</p>
                </div>
            )}

            {/* ── STEP 1 ── */}
            {step === 1 && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="First Name *"
                            id="fn"
                            icon={User}
                            placeholder="Amara"
                            value={formData.firstName}
                            onChange={set('firstName')}
                            onBlur={blur('firstName')}
                            error={touched.firstName ? errors.firstName : ''}
                        />
                        <Input
                            label="Last Name *"
                            id="ln"
                            placeholder="Perera"
                            value={formData.lastName}
                            onChange={set('lastName')}
                            onBlur={blur('lastName')}
                            error={touched.lastName ? errors.lastName : ''}
                        />
                    </div>
                    <Input
                        label="Email Address *"
                        id="email"
                        type="email"
                        icon={Mail}
                        placeholder="doctor@hospital.com"
                        value={formData.email}
                        onChange={set('email')}
                        onBlur={blur('email')}
                        error={touched.email ? errors.email : ''}
                        autoComplete="email"
                    />

                    {/* Phone number with format hints */}
                    <div className="space-y-1.5">
                        <label htmlFor="phone" className="block text-sm font-semibold text-slate-700">
                            Phone Number *
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                <Phone size={16} className="text-slate-400" />
                            </div>
                            <input
                                id="phone"
                                type="tel"
                                autoComplete="tel"
                                placeholder="07XXXXXXXX or +94XXXXXXXXX"
                                value={formData.phone}
                                onChange={set('phone')}
                                onBlur={blur('phone')}
                                maxLength={15}
                                className={`input-field pr-9 ${touched.phone && errors.phone ? 'border-red-400 focus:border-red-500' : touched.phone && PHONE_REGEX.test(formData.phone.trim()) ? 'border-emerald-400 focus:border-emerald-500' : ''}`}
                                style={{ paddingLeft: '38px' }}
                            />
                            <div className="absolute inset-y-0 right-3 flex items-center">
                                {touched.phone && (
                                    PHONE_REGEX.test(formData.phone.trim())
                                        ? <CheckCircle size={15} className="text-emerald-500" />
                                        : <AlertCircle size={15} className="text-red-400" />
                                )}
                            </div>
                        </div>
                        {touched.phone && errors.phone
                            ? <p className="text-xs font-medium text-red-500 flex items-center gap-1"><AlertCircle size={11} /> {errors.phone}</p>
                            : touched.phone && PHONE_REGEX.test(formData.phone.trim())
                                ? <p className="text-xs font-medium text-emerald-600 flex items-center gap-1"><CheckCircle size={11} /> Valid phone number</p>
                                : (
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <p className="text-xs text-slate-400">Formats:</p>
                                        <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">07XXXXXXXX</span>
                                        <span className="text-xs text-slate-400">or</span>
                                        <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">+94XXXXXXXXX</span>
                                    </div>
                                )
                        }
                    </div>
                    <Button onClick={handleNext} className="w-full justify-center mt-1">
                        Continue →
                    </Button>
                </div>
            )}

            {/* ── STEP 2 ── */}
            {step === 2 && (
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    {/* SLMC */}
                    <Input
                        label="SLMC Registration Number *"
                        id="slmc"
                        icon={CreditCard}
                        placeholder="e.g. SLMC/12345"
                        value={formData.slmcNumber}
                        onChange={set('slmcNumber')}
                        onBlur={blur('slmcNumber')}
                        error={touched.slmcNumber ? errors.slmcNumber : ''}
                        helper="Will be manually verified by the admin team"
                    />

                    {/* Specialization — datalist (type-to-search + click-to-select) */}
                    <div className="space-y-1.5">
                        <label htmlFor="spec" className="block text-sm font-semibold text-slate-700">
                            Specialization *
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                <Stethoscope size={16} className="text-slate-400" />
                            </div>
                            <input
                                id="spec"
                                list="spec-list"
                                placeholder="Type or select your specialization…"
                                value={formData.specialization}
                                onChange={set('specialization')}
                                onBlur={blur('specialization')}
                                autoComplete="off"
                                className={`input-field ${touched.specialization && errors.specialization ? 'border-red-400' : specValid && formData.specialization ? 'border-emerald-400' : ''}`}
                                style={{ paddingLeft: '38px' }}
                            />
                            <datalist id="spec-list">
                                {SPECIALIZATIONS.map((s) => <option key={s} value={s} />)}
                            </datalist>
                        </div>
                        {touched.specialization && errors.specialization && (
                            <p className="text-xs font-medium text-red-500">⚠ {errors.specialization}</p>
                        )}
                        {specValid && formData.specialization && (
                            <p className="text-xs font-medium text-emerald-600">✓ Valid specialization selected</p>
                        )}
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                        <Input
                            label="Password *"
                            id="pw"
                            type="password"
                            icon={Lock}
                            placeholder="Min. 8 chars, 1 uppercase, 1 number"
                            value={formData.password}
                            onChange={set('password')}
                            onBlur={blur('password')}
                            error={touched.password ? errors.password : ''}
                            autoComplete="new-password"
                        />
                        {/* Strength indicator */}
                        {formData.password && (
                            <div className="space-y-1 pt-0.5">
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div
                                            key={i}
                                            className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${i <= pwStrength.score ? pwStrength.color : 'bg-slate-200'}`}
                                        />
                                    ))}
                                </div>
                                <p className={`text-xs font-semibold ${pwStrength.score <= 1 ? 'text-red-500'
                                        : pwStrength.score === 2 ? 'text-amber-500'
                                            : pwStrength.score === 3 ? 'text-blue-500'
                                                : 'text-emerald-600'
                                    }`}>
                                    {pwStrength.label} password
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Confirm password */}
                    <Input
                        label="Confirm Password *"
                        id="cpw"
                        type="password"
                        icon={Lock}
                        placeholder="Re-enter your password"
                        value={formData.confirmPassword}
                        onChange={set('confirmPassword')}
                        onBlur={blur('confirmPassword')}
                        error={touched.confirmPassword ? errors.confirmPassword : ''}
                        autoComplete="new-password"
                    />

                    <div className="flex gap-3 pt-1">
                        <Button variant="outline" type="button" onClick={() => setStep(1)} className="flex-1">
                            ← Back
                        </Button>
                        <Button type="submit" isLoading={loading} className="flex-1 justify-center">
                            Submit Application
                        </Button>
                    </div>
                </form>
            )}

            <p className="text-center text-sm text-slate-500">
                Already registered?{' '}
                <Link to="/login" className="text-blue-600 font-semibold hover:underline underline-offset-2">
                    Sign in →
                </Link>
            </p>
        </div>
    );
};

export default Register;
