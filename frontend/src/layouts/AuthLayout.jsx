import { Outlet, Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const AuthLayout = () => {
    const { user } = useAuthStore();

    if (user) {
        if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
        if (user.role === 'DOCTOR') return <Navigate to="/dashboard" replace />;
        if (user.role === 'PATIENT') return <Navigate to="/patient" replace />;
    }

    return (
        <div className="auth-bg flex items-center justify-center p-4 relative">
            {/* Decorative blobs */}
            <div className="auth-blob w-96 h-96 bg-blue-400 top-[-80px] left-[-80px]" />
            <div className="auth-blob w-80 h-80 bg-purple-400 bottom-[-60px] right-[-60px]" />
            <div className="auth-blob w-64 h-64 bg-emerald-300 top-[40%] right-[10%]" />

            {/* Brand strip at top */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-10 py-5">
                <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <svg viewBox="0 0 24 24" fill="white" className="h-4 w-4">
                            <path d="M12 2a5 5 0 1 0 0 10A5 5 0 0 0 12 2zm0 12c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z" />
                        </svg>
                    </div>
                    <span className="font-bold text-slate-800 text-lg tracking-tight">MediPortal</span>
                </div>
                <span className="text-xs font-medium text-slate-400 hidden sm:block">Doctor Management System</span>
            </div>

            {/* Auth card */}
            <div className="w-full max-w-[440px] animate-fade-up">
                <div className="glass rounded-3xl shadow-2xl shadow-blue-900/10 p-8 sm:p-10 border border-white/80">
                    <Outlet />
                </div>
                <p className="text-center text-xs text-slate-400 mt-6">
                    © 2025 MediPortal · Doctor Management Module
                </p>
            </div>
        </div>
    );
};

export default AuthLayout;
