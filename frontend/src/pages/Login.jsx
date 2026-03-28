import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Eye, EyeOff, CheckCircle, AlertCircle, Activity, Stethoscope, Heart } from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/authStore';

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
    const [showPw, setShowPw] = useState(false);
    const [serverError, setServerError] = useState('');
    const [loading, setLoading] = useState(false);

    const set = (field) => (e) => {
        setForm(p => ({ ...p, [field]: e.target.value }));
        if (serverError) setServerError('');
    };

    const blur = (field) => () => setTouched(p => ({ ...p, [field]: true }));

    const errors = {
        email: touched.email && (!form.email.trim() ? 'Email is required' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ? 'Invalid email' : ''),
        password: touched.password && !form.password ? 'Password is required' : '',
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setTouched({ email: true, password: true });
        const email = form.email.trim().toLowerCase();
        if (!email || !form.password) return;

        setServerError('');
        setLoading(true);
        try {
            const { data } = await api.post('/auth/login', { email, password: form.password });
            login(data);
            if (data.role === 'ADMIN') navigate('/admin');
            else if (data.role === 'PATIENT') navigate('/patient');
            else navigate('/dashboard');
        } catch (err) {
            if (!err.response) {
                setServerError('Unable to connect to the server. Please make sure the backend is running.');
            } else {
                setServerError(err.response?.data?.message || 'Invalid credentials. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-0">
            {/* ── Gradient header strip ── */}
            <div className={`rounded-2xl bg-gradient-to-br from-blue-600/90 to-indigo-700/90 border border-blue-500/50 p-6 mb-7 text-white text-center relative overflow-hidden backdrop-blur-md shadow-lg shadow-blue-500/20`}>
                <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-cyan-400/20 blur-xl" />
                <div className="absolute -bottom-8 -left-4 w-20 h-20 rounded-full bg-blue-400/20 blur-xl" />
                <div className="relative z-10">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/20 border border-white/30 backdrop-blur-sm mb-3 shadow-lg">
                        <Activity size={22} className="text-white drop-shadow-md" />
                    </div>
                    <h1 className="text-xl font-bold mb-0.5 text-white tracking-wide">Welcome back</h1>
                    <p className="text-blue-100/90 text-xs font-medium">Sign in to your secure portal</p>
                </div>
            </div>

            <p className="text-sm font-medium text-slate-500 mb-6 text-center">Access your account securely</p>

            {serverError && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 animate-fade-in backdrop-blur-sm">
                    <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                    <p className="text-sm text-red-700 font-medium leading-relaxed">{serverError}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {/* Email */}
                <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-700">Email Address</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail size={16} className="text-slate-400" />
                        </div>
                        <input
                            id="email" type="email" autoComplete="email"
                            placeholder="user@example.com"
                            value={form.email} onChange={set('email')} onBlur={blur('email')}
                            className={`w-full bg-white/50 backdrop-blur-sm border ${errors.email ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : touched.email && form.email && !errors.email ? 'border-emerald-400 focus:border-emerald-400 focus:ring-emerald-400/20' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500/20'} text-slate-900 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-4 transition-all duration-300 shadow-sm`}
                            style={{ paddingLeft: '40px', paddingTop: '12px', paddingBottom: '12px' }}
                        />
                        <div className="absolute inset-y-0 right-3 flex items-center">
                            <FieldStatus valid={!!form.email && !errors.email} touched={touched.email} />
                        </div>
                    </div>
                    {errors.email && <p className="text-xs font-semibold text-red-500 flex items-center gap-1.5 mt-1"><AlertCircle size={12} /> {errors.email}</p>}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-700">Password</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock size={16} className="text-slate-400" />
                        </div>
                        <input
                            id="password" type={showPw ? 'text' : 'password'} autoComplete="current-password"
                            placeholder="••••••••"
                            value={form.password} onChange={set('password')} onBlur={blur('password')}
                            className={`w-full bg-white/50 backdrop-blur-sm border ${errors.password ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500/20'} text-slate-900 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-4 transition-all duration-300 shadow-sm`}
                            style={{ paddingLeft: '40px', paddingRight: '70px', paddingTop: '12px', paddingBottom: '12px' }}
                        />
                        <button type="button" onClick={() => setShowPw(v => !v)}
                            className="absolute inset-y-0 right-10 flex items-center px-2 text-slate-400 hover:text-blue-500 transition-colors" tabIndex={-1}>
                            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <div className="absolute inset-y-0 right-3 flex items-center">
                            <FieldStatus valid={!!form.password} touched={touched.password} />
                        </div>
                    </div>
                    {errors.password && <p className="text-xs font-semibold text-red-500 flex items-center gap-1.5 mt-1"><AlertCircle size={12} /> {errors.password}</p>}
                </div>

                <div className="pt-4">
                    <button type="submit" disabled={loading}
                        className={`w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-sm transition-all duration-300
                            bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed`}>
                        {loading ? (
                            <><svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg> Authenticating…</>
                        ) : (<>Secure Sign In <ArrowRight size={18} /></>)}
                    </button>
                </div>
            </form>

            {/* Demo credentials */}
            <div className="mt-8 border border-slate-200/60 rounded-xl p-5 bg-white/50 backdrop-blur-md relative overflow-hidden group shadow-sm">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-black border border-blue-200">i</span>
                    Demo Admin Credentials
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 relative z-10">
                    <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Email</p>
                        <p className="text-xs text-slate-700 font-mono mt-0.5">admin@mediportal.com</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Password</p>
                        <p className="text-xs text-slate-700 font-mono mt-0.5">admin123</p>
                    </div>
                </div>
            </div>

            {/* Registration Options */}
            <div className="mt-8 pt-6 border-t border-slate-200/60">
                <p className="text-center text-sm font-medium text-slate-500 mb-4">
                    Don't have an account?
                </p>
                <div className="grid grid-cols-2 gap-3">
                    <Link to="/patient/register" className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-sm font-bold hover:bg-blue-100 hover:border-blue-300 transition-all">
                        <Heart size={16} /> Register as Patient
                    </Link>
                    <Link to="/register" className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 text-sm font-bold hover:bg-indigo-100 hover:border-indigo-300 transition-all">
                        <Stethoscope size={16} /> Apply as Doctor
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
