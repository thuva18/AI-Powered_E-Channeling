import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Eye, EyeOff, CheckCircle, AlertCircle, Activity } from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/authStore';

// ── Field status icon ──────────────────────────────────────────────────────────
const FieldStatus = ({ valid, touched }) => {
    if (!touched) return null;
    return valid
        ? <CheckCircle size={15} className="text-emerald-500 shrink-0" />
        : <AlertCircle size={15} className="text-red-400 shrink-0" />;
};

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuthStore();

    const [form, setForm] = useState({ email: '', password: '' });
    const [touched, setTouched] = useState({ email: false, password: false });
    const [showPassword, setShowPassword] = useState(false);
    const [serverError, setServerError] = useState('');
    const [loading, setLoading] = useState(false);

    const set = (field) => (e) => {
        setForm(p => ({ ...p, [field]: e.target.value }));
        if (serverError) setServerError('');
    };

    const blur = (field) => () => setTouched(p => ({ ...p, [field]: true }));

    const errors = {
        email: touched.email && !form.email.trim() ? 'Email is required'
            : touched.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ? 'Enter a valid email address'
            : '',
        password: touched.password && !form.password ? 'Password is required' : '',
    };

    const formValid = form.email.trim() && !errors.email && form.password;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setTouched({ email: true, password: true });
        if (!form.email.trim() || !form.password) return;

        setServerError('');
        setLoading(true);
        try {
            const { data } = await api.post('/auth/login', {
                email: form.email,
                password: form.password,
            });
            login(data);
            navigate(data.role === 'ADMIN' ? '/admin' : '/dashboard');
        } catch (err) {
            setServerError(err.response?.data?.message || 'Invalid credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-0">
            {/* ── Gradient header strip ── */}
            <div className="rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 p-6 mb-7 text-white text-center relative overflow-hidden">
                {/* Decorative rings */}
                <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
                <div className="absolute -bottom-8 -left-4 w-20 h-20 rounded-full bg-white/10" />
                <div className="relative z-10">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm mb-3 shadow-lg">
                        <Activity size={22} className="text-white" />
                    </div>
                    <h1 className="text-xl font-bold mb-0.5">Welcome back</h1>
                    <p className="text-blue-100 text-xs font-medium">Sign in to access your MediPortal account</p>
                </div>
            </div>

            {/* ── Server error ── */}
            {serverError && (
                <div className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl mb-5 animate-fade-up">
                    <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 font-medium">{serverError}</p>
                </div>
            )}

            {/* ── Form ── */}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>

                {/* Email */}
                <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-700">
                        Email Address
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail size={15} className="text-slate-400" />
                        </div>
                        <input
                            id="email"
                            type="email"
                            autoComplete="email"
                            placeholder="doctor@example.com"
                            value={form.email}
                            onChange={set('email')}
                            onBlur={blur('email')}
                            className={`input-field pr-9 ${errors.email ? 'border-red-400 focus:border-red-500' : touched.email && form.email && !errors.email ? 'border-emerald-400 focus:border-emerald-500' : ''}`}
                            style={{ paddingLeft: '38px' }}
                        />
                        <div className="absolute inset-y-0 right-3 flex items-center">
                            <FieldStatus valid={!!form.email && !errors.email} touched={touched.email} />
                        </div>
                    </div>
                    {errors.email && <p className="text-xs font-medium text-red-500 flex items-center gap-1"><AlertCircle size={11} /> {errors.email}</p>}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-700">
                        Password
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock size={15} className="text-slate-400" />
                        </div>
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            placeholder="••••••••"
                            value={form.password}
                            onChange={set('password')}
                            onBlur={blur('password')}
                            className={`input-field ${errors.password ? 'border-red-400 focus:border-red-500' : ''}`}
                            style={{ paddingLeft: '38px', paddingRight: '70px' }}
                        />
                        {/* Show/hide toggle */}
                        <button
                            type="button"
                            onClick={() => setShowPassword(v => !v)}
                            className="absolute inset-y-0 right-9 flex items-center px-2 text-slate-400 hover:text-slate-600 transition-colors"
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                        <div className="absolute inset-y-0 right-3 flex items-center">
                            <FieldStatus valid={!!form.password} touched={touched.password} />
                        </div>
                    </div>
                    {errors.password && <p className="text-xs font-medium text-red-500 flex items-center gap-1"><AlertCircle size={11} /> {errors.password}</p>}
                </div>

                {/* Submit */}
                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200
                            ${formValid && !loading
                                ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 shadow-lg shadow-blue-500/25 active:scale-[0.98]'
                                : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25 active:scale-[0.98]'
                            } disabled:opacity-60 disabled:cursor-not-allowed`}
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                </svg>
                                Signing in…
                            </>
                        ) : (
                            <>Sign In <ArrowRight size={16} /></>
                        )}
                    </button>
                </div>
            </form>

            {/* ── Demo credentials ── */}
            <div className="mt-5 border border-dashed border-slate-200 rounded-xl p-4 bg-slate-50/80">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <span className="h-4 w-4 rounded bg-amber-100 text-amber-600 flex items-center justify-center text-[9px] font-black">i</span>
                    Demo Admin Credentials
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <div>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Email</p>
                        <p className="text-xs text-slate-700 font-mono">admin@mediportal.com</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Password</p>
                        <p className="text-xs text-slate-700 font-mono">admin123</p>
                    </div>
                </div>
            </div>

            {/* ── Register link ── */}
            <p className="text-center text-sm text-slate-500 mt-5">
                New doctor?{' '}
                <Link to="/register" className="text-blue-600 font-semibold hover:underline underline-offset-2">
                    Apply for an account →
                </Link>
            </p>
        </div>
    );
};

export default Login;
