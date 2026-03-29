import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, IdCard, Calendar, CheckCircle, AlertCircle, ArrowRight, Heart, ShieldCheck } from 'lucide-react';
import api from '../services/api';

const PHONE_REGEX = /^(07\d{8}|\+94\d{9})$/;
const NIC_REGEX = /^(\d{9}[Vv]|\d{12})$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

const Field = ({ id, label, icon: Icon, type = 'text', placeholder, field, autoComplete, extra = {}, form, set, blur, handleEmailBlur, emailChecking, touched, errors }) => (
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
                value={form[field]} onChange={set(field)}
                onBlur={field === 'email' ? handleEmailBlur : blur(field)}
                className={`input-field pr-9 ${touched[field] && errors[field] ? 'border-red-400 focus:border-red-500' : ''}`}
                style={Icon ? { paddingLeft: '38px' } : {}}
                {...extra}
            />
            <div className="absolute inset-y-0 right-3 flex items-center">
                {field === 'email' && emailChecking ? (
                    <svg className="animate-spin h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                ) : touched[field] ? (
                    errors[field]
                        ? <AlertCircle size={15} className="text-red-400" />
                        : <CheckCircle size={15} className="text-emerald-500" />
                ) : null}
            </div>
        </div>
        {touched[field] && errors[field] && (
            <p className="text-xs font-medium text-red-500 flex items-center gap-1"><AlertCircle size={11} /> {errors[field]}</p>
        )}
    </div>
);

const PatientRegister = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({
        firstName: '', lastName: '', email: '', phone: '', nic: '', dateOfBirth: '',
        password: '', confirmPassword: '',
    });
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [submitError, setSubmitError] = useState('');

    // Email availability
    const [emailChecking, setEmailChecking] = useState(false);
    const [emailAvailable, setEmailAvailable] = useState(null);

    const validate = {
        firstName: (v) => !v.trim() ? 'First name is required' : v.trim().length < 2 ? 'Min 2 characters' : '',
        lastName: (v) => !v.trim() ? 'Last name is required' : v.trim().length < 2 ? 'Min 2 characters' : '',
        email: (v) => !v.trim() ? 'Email is required' : !EMAIL_REGEX.test(v) ? 'Enter a valid email' : '',
        phone: (v) => !v.trim() ? 'Phone is required' : !PHONE_REGEX.test(v.trim()) ? 'Use 07XXXXXXXX or +94XXXXXXXXX' : '',
        nic: (v) => !v.trim() ? 'NIC is required' : !NIC_REGEX.test(v.trim()) ? 'Use 912345678V or 200012345678' : '',
        dateOfBirth: (v) => !v ? 'Date of birth is required' : '',
        password: (v) => !v ? 'Password is required' : v.length < 8 ? 'Min 8 characters' : !/[A-Z]/.test(v) ? 'Need 1 uppercase letter' : !/[0-9]/.test(v) ? 'Need 1 number' : '',
        confirmPassword: (v, pw) => !v ? 'Please confirm password' : v !== pw ? "Passwords don't match" : '',
    };

    const set = (field) => (e) => {
        const value = e.target.value;
        setForm(p => ({ ...p, [field]: value }));
        if (field === 'email') setEmailAvailable(null);
        if (touched[field]) {
            const err = field === 'confirmPassword'
                ? validate.confirmPassword(value, form.password)
                : validate[field]?.(value) ?? '';
            setErrors(p => ({ ...p, [field]: err }));
        }
    };

    const blur = (field) => () => {
        setTouched(p => ({ ...p, [field]: true }));
        const err = field === 'confirmPassword'
            ? validate.confirmPassword(form.confirmPassword, form.password)
            : validate[field]?.(form[field]) ?? '';
        setErrors(p => ({ ...p, [field]: err }));
    };

    const handleEmailBlur = useCallback(async () => {
        blur('email')();
        const val = form.email.trim();
        if (!EMAIL_REGEX.test(val)) return;
        setEmailChecking(true);
        setEmailAvailable(null);
        try {
            const { data } = await api.get(`/auth/check-email?email=${encodeURIComponent(val)}`);
            setEmailAvailable(data.available);
            if (!data.available) setErrors(p => ({ ...p, email: 'This email is already registered' }));
        } catch { /* silent */ } finally { setEmailChecking(false); }
    }, [form.email]);

    const validateFields = (fields) => {
        const newErrors = {};
        fields.forEach(f => {
            const err = f === 'confirmPassword'
                ? validate.confirmPassword(form.confirmPassword, form.password)
                : validate[f]?.(form[f]) ?? '';
            if (err) newErrors[f] = err;
        });
        setErrors(p => ({ ...p, ...newErrors }));
        setTouched(p => { const t = { ...p }; fields.forEach(f => (t[f] = true)); return t; });
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateFields(['firstName', 'lastName', 'email', 'phone', 'nic', 'dateOfBirth'])) {
            // Fix #7: block if email taken OR availability check still pending (null)
            const emailFormatOk = EMAIL_REGEX.test(form.email.trim());
            if (emailFormatOk && emailAvailable !== true) return;
            setStep(2);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateFields(['password', 'confirmPassword'])) return;
        setLoading(true);
        setSubmitError('');
        try {
            await api.post('/auth/patient/register', {
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                nic: form.nic.trim().toUpperCase(),
                dateOfBirth: form.dateOfBirth,
                password: form.password,
            });
            setSuccess(true);
        } catch (err) {
            setSubmitError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const pwStr = passwordStrength(form.password);
    const emailOk = EMAIL_REGEX.test(form.email.trim());

    if (success) return (
        <div className="text-center space-y-5 py-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-400 shadow-xl shadow-emerald-500/30 mb-2">
                <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">You&apos;re all set!</h2>
                <p className="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">
                    Your patient account has been created. Sign in to start booking appointments.
                </p>
            </div>
            <button
                onClick={() => navigate('/login')}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-700 transition-all"
            >
                Sign In Now <ArrowRight size={16} />
            </button>
        </div>
    );

    const fieldProps = { form, set, blur, touched, errors };

    return (
        <div className="space-y-5">
            {/* Header/Title */}
            <div className="text-center mb-8 animate-fade-up">
                <div className="mx-auto w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4">
                    <Heart size={28} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Create Patient Account</h2>
                <p className="text-sm font-medium text-slate-500 mt-1">Book appointments and track your health</p>
            </div>

            {/* Progress */}
            <div className="space-y-1.5">
                <div className="flex gap-2">
                    {[1, 2].map(s => (
                        <div key={s} className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${s <= step ? 'bg-blue-500' : 'bg-slate-200'}`} />
                    ))}
                </div>
                <p className="text-xs font-medium text-slate-400 text-center">
                    Step {step} of 2 — {step === 1 ? 'Personal Information' : 'Account Security'}
                </p>
            </div>

            {submitError && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 font-medium">{submitError}</p>
                </div>
            )}

            {step === 1 && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <Field {...fieldProps} id="fn" label="First Name *" icon={User} placeholder="Shalini" field="firstName" autoComplete="given-name" />
                        <Field {...fieldProps} id="ln" label="Last Name *" placeholder="Kumara" field="lastName" autoComplete="family-name" />
                    </div>
                    <Field {...fieldProps} id="email" label="Email Address *" icon={Mail} type="email" placeholder="you@email.com" field="email" autoComplete="email" handleEmailBlur={handleEmailBlur} emailChecking={emailChecking} />
                    {emailAvailable === true && emailOk && (
                        <p className="text-xs font-medium text-emerald-600 flex items-center gap-1 -mt-3">
                            <CheckCircle size={11} /> Email available
                        </p>
                    )}
                    <Field {...fieldProps} id="phone" label="Phone Number *" icon={Phone} type="tel" placeholder="07XXXXXXXX" field="phone" autoComplete="tel" extra={{ maxLength: 15 }} />
                    <Field {...fieldProps} id="nic" label="NIC Number *" icon={IdCard} placeholder="912345678V or 200012345678" field="nic" autoComplete="off" extra={{ maxLength: 12, className: 'input-field pr-9 uppercase' }} />
                    <div className="flex gap-2 text-xs text-slate-400 -mt-1">
                        <span className="font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">912345678V</span>
                        <span>or</span>
                        <span className="font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">200012345678</span>
                    </div>
                    <Field {...fieldProps} id="dob" label="Date of Birth *" icon={Calendar} type="date" field="dateOfBirth" autoComplete="bday" />
                    <div className="flex justify-end pt-2">
                        <button type="button" onClick={handleNext}
                            className="flex items-center gap-2 py-3 px-8 rounded-xl font-semibold text-sm bg-gradient-to-r from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all active:scale-95 group">
                            Continue <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            )}

            {step === 2 && (
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-slate-700">Password *</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                <Lock size={16} className="text-slate-400" />
                            </div>
                            <input
                                id="pw" type="password" autoComplete="new-password"
                                placeholder="Min. 8 chars, 1 uppercase, 1 number"
                                value={form.password} onChange={set('password')} onBlur={blur('password')}
                                className={`input-field pr-9 ${touched.password && errors.password ? 'border-red-400' : ''}`}
                                style={{ paddingLeft: '38px' }}
                            />
                        </div>
                        {touched.password && errors.password && (
                            <p className="text-xs font-medium text-red-500 flex items-center gap-1"><AlertCircle size={11} /> {errors.password}</p>
                        )}
                        {form.password && (
                            <div className="space-y-1 pt-0.5">
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${i <= pwStr.score ? pwStr.color : 'bg-slate-200'}`} />
                                    ))}
                                </div>
                                <p className={`text-xs font-semibold ${pwStr.score <= 1 ? 'text-red-500' : pwStr.score === 2 ? 'text-amber-500' : pwStr.score === 3 ? 'text-blue-500' : 'text-emerald-600'}`}>
                                    {pwStr.label} password
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-slate-700">Confirm Password *</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                <Lock size={16} className="text-slate-400" />
                            </div>
                            <input
                                id="cpw" type="password" autoComplete="new-password"
                                placeholder="Re-enter your password"
                                value={form.confirmPassword} onChange={set('confirmPassword')} onBlur={blur('confirmPassword')}
                                className={`input-field pr-9 ${touched.confirmPassword && errors.confirmPassword ? 'border-red-400' : ''}`}
                                style={{ paddingLeft: '38px' }}
                            />
                            <div className="absolute inset-y-0 right-3 flex items-center">
                                {touched.confirmPassword && (
                                    errors.confirmPassword
                                        ? <AlertCircle size={15} className="text-red-400" />
                                        : <CheckCircle size={15} className="text-emerald-500" />
                                )}
                            </div>
                        </div>
                        {touched.confirmPassword && errors.confirmPassword && (
                            <p className="text-xs font-medium text-red-500 flex items-center gap-1"><AlertCircle size={11} /> {errors.confirmPassword}</p>
                        )}
                    </div>

                    <div className="flex gap-3 pt-1">
                        <button type="button" onClick={() => setStep(1)}
                            className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                            ← Back
                        </button>
                        <button type="submit" disabled={loading}
                            className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-sm bg-gradient-to-r from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed">
                            {loading ? (
                                <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg> Creating Account…</>
                            ) : (<><ShieldCheck size={16} /> Create Account</>)}
                        </button>
                    </div>
                </form>
            )}

            <p className="text-center text-sm font-medium text-slate-500 mt-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                Already have an account?{' '}
                <Link to="/login" className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors">
                    Log in here
                </Link>
            </p>
        </div>
    );
};

export default PatientRegister;
