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
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-50">
            {/* AI Generated Universal Light Blue Background */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center"
                style={{ backgroundImage: "url('/images/unified_light_blue_bg.png')" }}
            />
            {/* Soft gradient overlay for readability */}
            <div className="absolute inset-0 z-0 bg-white/30 backdrop-blur-[2px]" />

            {/* Brand strip at top (Dark text for light theme) */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-10 py-6 z-10 w-full max-w-7xl mx-auto">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <svg viewBox="0 0 24 24" fill="white" className="h-5 w-5">
                            <path d="M12 2a5 5 0 1 0 0 10A5 5 0 0 0 12 2zm0 12c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z" />
                        </svg>
                    </div>
                    <span className="font-extrabold text-slate-900 text-xl tracking-tight drop-shadow-sm">Medicare</span>
                </div>
                <span className="text-sm font-semibold text-blue-800/70 hidden sm:block tracking-wide">Secure E-Channeling Portal</span>
            </div>

            {/* Auth card (Clean Light Glassmorphism) */}
            <div className="w-full max-w-[440px] animate-fade-up z-10 relative mt-8">
                <div className="bg-white/70 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl shadow-blue-900/10 p-8 sm:p-10 border border-white/80 relative overflow-hidden">
                    {/* Inner top glow effect */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
                    <Outlet />
                </div>
                <p className="text-center text-xs font-medium text-slate-500 mt-8 drop-shadow-sm">
                    © 2026 Medicare · Secure Authentication
                </p>
            </div>
        </div>
    );
};

export default AuthLayout;
